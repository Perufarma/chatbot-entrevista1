export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const URL   = process.env.KV_REST_API_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN;
  if (!URL || !TOKEN) {
    return res.status(500).json({ error: 'KV no configurado' });
  }

  // Helper KV — GET usa /get/key, POST usa pipeline con SET
  async function kvGet(key) {
    const r = await fetch(`${URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    return r.json();
  }

  async function kvSet(key, value) {
    // Usar POST al endpoint pipeline para evitar límite de URL con payloads grandes
    const r = await fetch(`${URL}/set/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    });
    return r.json();
  }

  // Determinar key según ?type=
  const type = req.query.type;
  let key;
  if (type === 'results') key = 'results';
  else if (type === 'reqs')    key = 'reqs';
  else                         key = 'jobs';

  // ── GET ──
  if (req.method === 'GET') {
    try {
      const data = await kvGet(key);
      const items = data.result ? JSON.parse(data.result) : [];
      return res.status(200).json({ [key]: items });
    } catch (e) {
      return res.status(200).json({ [key]: [] });
    }
  }

  // ── POST ──
  if (req.method === 'POST') {
    try {
      const payload = req.body[key];
      if (payload === undefined) {
        return res.status(400).json({ error: `Payload key "${key}" no encontrada en body` });
      }
      await kvSet(key, JSON.stringify(payload));
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
