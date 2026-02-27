/* ═══ TudatosAI Chatbot Widget ═══ */
(function () {
  'use strict';

  var WORKER_URL = 'https://tudatosai-chatbot.szabo-leonard-henrik.workers.dev/chat';

  var MAX_HISTORY = 20;
  var history = [];
  var isOpen = false;

  /* ── Inject HTML ── */
  var fab = document.createElement('button');
  fab.className = 'chatbot-fab';
  fab.type = 'button';
  fab.setAttribute('aria-label', 'Chat');
  fab.innerHTML =
    '<svg class="icon-chat" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
    '<svg class="icon-close" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';

  var panel = document.createElement('div');
  panel.className = 'chatbot-panel';
  panel.innerHTML =
    '<div class="chatbot-header">' +
      '<div class="chatbot-header-avatar"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/></svg></div>' +
      '<div>' +
        '<div class="chatbot-header-title">TudatosAI Asszisztens</div>' +
        '<div class="chatbot-header-sub">AI tanácsadás percek alatt</div>' +
      '</div>' +
    '</div>' +
    '<div class="chatbot-messages" id="chatbotMessages"></div>' +
    '<div class="chatbot-input-area">' +
      '<input class="chatbot-input" id="chatbotInput" type="text" placeholder="Írj egy kérdést..." autocomplete="off">' +
      '<button class="chatbot-send" id="chatbotSend" type="button" aria-label="Küldés">' +
        '<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
      '</button>' +
    '</div>';

  document.body.appendChild(panel);
  document.body.appendChild(fab);

  var messagesEl = document.getElementById('chatbotMessages');
  var inputEl = document.getElementById('chatbotInput');
  var sendBtn = document.getElementById('chatbotSend');

  /* ── Greeting ── */
  addBotMessage('Szia! 👋 A TudatosAI virtuális asszisztense vagyok. Kérdezz bátran AI stratégiáról, szolgáltatásainkról, vagy arról, hogyan segíthetünk a vállalkozásodnak!');

  /* ── Toggle ── */
  fab.addEventListener('click', function () {
    isOpen = !isOpen;
    fab.classList.toggle('open', isOpen);
    panel.classList.toggle('open', isOpen);
    if (isOpen) inputEl.focus();
  });

  /* ── Send ── */
  sendBtn.addEventListener('click', sendMessage);
  inputEl.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  function sendMessage() {
    var text = inputEl.value.trim();
    if (!text) return;

    addUserMessage(text);
    inputEl.value = '';
    sendBtn.disabled = true;

    history.push({ role: 'user', content: text });
    if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);

    var typing = showTyping();

    fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        removeTyping(typing);
        var reply = (data && data.reply) || 'Elnézést, nem tudtam feldolgozni a kérést. Kérlek próbáld újra!';
        addBotMessage(reply);
        history.push({ role: 'assistant', content: reply });
        if (history.length > MAX_HISTORY) history = history.slice(-MAX_HISTORY);
      })
      .catch(function () {
        removeTyping(typing);
        addBotMessage('Hálózati hiba történt. Kérlek próbáld újra, vagy írj nekünk: hello@tudatosai.hu');
      })
      .finally(function () {
        sendBtn.disabled = false;
      });
  }

  /* ── Helpers ── */
  function addBotMessage(text) {
    var el = document.createElement('div');
    el.className = 'chatbot-msg bot';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollBottom();
  }

  function addUserMessage(text) {
    var el = document.createElement('div');
    el.className = 'chatbot-msg user';
    el.textContent = text;
    messagesEl.appendChild(el);
    scrollBottom();
  }

  function showTyping() {
    var el = document.createElement('div');
    el.className = 'chatbot-typing';
    el.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(el);
    scrollBottom();
    return el;
  }

  function removeTyping(el) {
    if (el && el.parentNode) el.parentNode.removeChild(el);
  }

  function scrollBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }
})();
