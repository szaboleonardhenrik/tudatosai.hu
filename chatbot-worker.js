/**
 * TudatosAI Chatbot — Cloudflare Worker
 *
 * Deployment:
 *   1. npx wrangler init tudatosai-chatbot
 *   2. Copy this file to src/index.js (or worker.js)
 *   3. npx wrangler secret put ANTHROPIC_API_KEY
 *   4. npx wrangler deploy
 *
 * Environment variable required:
 *   ANTHROPIC_API_KEY — your Anthropic API key
 */

const SYSTEM_PROMPT = `Te a TudatosAI virtuális AI asszisztense vagy. A TudatosAI a TDHR Group tagja, és magyar vállalkozásoknak segít az AI bevezetésében.

## Rólunk
- **Név:** TudatosAI
- **Weboldal:** tudatosai.hu
- **Email:** hello@tudatosai.hu
- **Telefon:** +36 70 567 8948
- **Iroda:** Alphagon Irodaház, Budapest
- **Anyacég:** TDHR Group (tdhr.hu)

## Szolgáltatásaink
1. **AI Stratégia & Audit** — Felmérjük a folyamatokat, azonosítjuk az AI lehetőségeket, roadmap + ROI
2. **AI Implementáció** — ChatGPT, Copilot, egyedi LLM megoldások bevezetése
3. **AI Tréning & Workshopok** — Prompt engineering, e-learning, kezdőtől haladóig
4. **Folyamat Automatizáció** — No-code, API, workflow automatizáció
5. **AI Adatelemzés** — Prediktív elemzés, BI dashboardok
6. **Etikus AI & Compliance** — EU AI Act, GDPR megfelelőség

## Szakterületek
- ERP rendszerek (fejlesztés, testreszabás, üzemeltetés + AI)
- CRM rendszerek (lead-kezelés, automatizált kommunikáció)
- ATS rendszerek (toborzás, AI-alapú jelöltszűrés)

## Eredmények
- 50+ sikeres projekt
- 15× átlagos hatékonyság-növekedés
- 97% partner-megtartási arány
- 3 hónap átlagos ROI megtérülés

## Árazás
- Ingyenes első konzultáció
- Személyre szabott árajánlat a felmérés után
- Konkrét árat ne adj meg, irányítsd az érdeklődőt az ingyenes konzultációra

## Stílus
- Válaszolj magyarul, barátságosan, szakszerűen
- Legyél tömör (max 2-3 mondat, hacsak nem kérnek részletesebb választ)
- Ha nem tudsz valamit, irányítsd a felhasználót a hello@tudatosai.hu emailre vagy az ingyenes konzultációra
- Soha ne találj ki információt amit nem ismersz`;

const ALLOWED_ORIGIN = 'https://tudatosai.hu';

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: corsHeaders(),
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const { messages } = await request.json();

      if (!Array.isArray(messages) || messages.length === 0) {
        return jsonResponse({ error: 'Messages array required' }, 400);
      }

      // Keep only last 20 messages
      const trimmed = messages.slice(-20).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content).slice(0, 1000),
      }));

      const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 512,
          system: SYSTEM_PROMPT,
          messages: trimmed,
        }),
      });

      if (!apiResponse.ok) {
        const errText = await apiResponse.text();
        console.error('Anthropic API error:', apiResponse.status, errText);
        return jsonResponse({ error: 'AI service error' }, 502);
      }

      const data = await apiResponse.json();
      const reply = data.content?.[0]?.text || 'Elnézést, nem tudtam választ adni.';

      return jsonResponse({ reply });
    } catch (err) {
      console.error('Worker error:', err);
      return jsonResponse({ error: 'Internal error' }, 500);
    }
  },
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(),
    },
  });
}
