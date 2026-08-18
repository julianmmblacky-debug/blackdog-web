/**
 * BLACKDOG — Cloudflare Pages Function
 * Endpoint: POST /api/finder
 *
 * Secrets en Cloudflare (nunca en el repo):
 *   ANTHROPIC_API_KEY  — clave de Anthropic
 *   FINDER_KV          — binding de KV namespace
 *
 * Qué se guarda en KV:
 *   key:   "query:{timestamp_ms}"
 *   value: { q, ts, ql, hm, hs }   — sin IP, email, teléfono
 *   TTL:   90 días
 */

const CFG = {
  MAX_Q: 400, MIN_Q: 10, MAX_TOKENS: 250,
  TIMEOUT: 8000, KV_TTL: 7776000, KV_CHARS: 300,
  RL_WIN: 60, RL_MAX: 5,
};

const MODELS = ['bmw','mercedes','toyota','audi','seat','volkswagen','vw',
  'ford','nissan','mitsubishi','volvo','land rover','jaguar','citroen',
  'citroën','peugeot','renault','opel','kia','suzuki','subaru','iveco',
  'sprinter','transit','e46','e60','e36','w203','w164','kzj90','a4','a6'];

const SYMPTOMS = ['pierde','fuga','gotea','liquido','líquido','aceite',
  'holgura','juego','ruido','clac','golpeteo','dura','tiesa','pesada',
  'no gira','bloquea','reparada','vuelve a','recambio','descatalogada'];

function sanitize(text) {
  return text.substring(0, CFG.KV_CHARS)
    .replace(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g, '[email]')
    .replace(/(?:\+34\s?)?[679]\d{2}[\s\-]?\d{3}[\s\-]?\d{3}/g, '[tel]')
    .replace(/https?:\/\/\S+/g, '[url]')
    .replace(/\s+/g, ' ').trim();
}

function hasModel(t) { const l=t.toLowerCase(); return MODELS.some(m=>l.includes(m)); }
function hasSymptom(t) { const l=t.toLowerCase(); return SYMPTOMS.some(s=>l.includes(s)); }

async function rateLimit(env, ip) {
  if (!env.FINDER_KV) return false;
  const k = `rl:${ip}`;
  const n = parseInt(await env.FINDER_KV.get(k)||'0');
  if (n >= CFG.RL_MAX) return true;
  await env.FINDER_KV.put(k, String(n+1), {expirationTtl: CFG.RL_WIN});
  return false;
}

async function saveKV(env, q) {
  if (!env.FINDER_KV) return;
  await env.FINDER_KV.put(
    `query:${Date.now()}`,
    JSON.stringify({
      q: sanitize(q), ts: new Date().toISOString(),
      ql: q.length, hm: hasModel(q), hs: hasSymptom(q)
    }),
    {expirationTtl: CFG.KV_TTL}
  );
}

async function callAnthropic(key, query) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), CFG.TIMEOUT);
  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: CFG.MAX_TOKENS,
        system: `Eres el asistente informativo de BLACKDOG Direcciones Asistidas.
Responde en español en exactamente 3 frases cortas.
- Usa siempre lenguaje prudente: "Por lo que describes...", "Parece relacionado con...", "BLACKDOG trabaja habitualmente este tipo de reparación...", "Habría que revisar el caso concreto..."
- NUNCA afirmes que una pieza tiene reparación garantizada ni des precios.
- Si no es un problema de cremallera o caja de dirección hidráulica, indícalo honestamente.
- Sin listas, markdown ni emojis.
- Frase 1: identifica síntoma o pieza. Frase 2: si es trabajo de BLACKDOG. Frase 3: invita a consultar por WhatsApp.`,
        messages: [{role:'user', content: query}]
      }),
      signal: ctrl.signal,
    });
    clearTimeout(t);
    if (!r.ok) throw new Error(`Anthropic ${r.status}`);
    const d = await r.json();
    return d?.content?.[0]?.text || null;
  } catch(e) { clearTimeout(t); throw e; }
}

const CORS = [
  'https://reparacion-cremallera-direccion.com',
  'https://blackdog-web.pages.dev',
];

export async function onRequestPost({request, env}) {
  const origin = request.headers.get('Origin') || '';
  const co = CORS.includes(origin) ? origin : CORS[1];
  const hdrs = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': co,
    'X-Content-Type-Options': 'nosniff',
  };

  if (!env.ANTHROPIC_API_KEY)
    return new Response(JSON.stringify({error:'service_unavailable'}), {status:503, headers:hdrs});

  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  if (await rateLimit(env, ip))
    return new Response(
      JSON.stringify({error:'rate_limited', message:'Demasiadas consultas. Espera un momento.'}),
      {status:429, headers:hdrs}
    );

  let query;
  try { query = String((await request.json())?.query||'').trim(); }
  catch { return new Response(JSON.stringify({error:'invalid_request'}), {status:400, headers:hdrs}); }

  if (query.length < CFG.MIN_Q)
    return new Response(
      JSON.stringify({error:'too_short', message:'Cuéntame un poco más sobre el problema.'}),
      {status:400, headers:hdrs}
    );
  if (query.length > CFG.MAX_Q)
    return new Response(
      JSON.stringify({error:'too_long', message:'Máximo 400 caracteres.'}),
      {status:400, headers:hdrs}
    );

  // Guardar en KV (no bloquea la respuesta)
  const ctx = {waitUntil: (p) => p};
  ctx.waitUntil(saveKV(env, query));

  try {
    const text = await callAnthropic(env.ANTHROPIC_API_KEY, query);
    if (!text) throw new Error('empty');
    return new Response(
      JSON.stringify({text, meta:{has_model:hasModel(query), has_symptom:hasSymptom(query)}}),
      {status:200, headers:hdrs}
    );
  } catch(e) {
    const isTimeout = e.name==='AbortError';
    return new Response(
      JSON.stringify({
        error: isTimeout?'timeout':'api_error',
        message:'No he podido analizar el caso ahora mismo. Escríbeme directamente por WhatsApp.'
      }),
      {status: isTimeout?504:502, headers:hdrs}
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {status:204, headers:{
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }});
}
