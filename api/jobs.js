export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const KV_URL   = process.env.KV_REST_API_URL;
  const KV_TOKEN = process.env.KV_REST_API_TOKEN;
  if (!KV_URL || !KV_TOKEN) {
    return res.status(500).json({ error: 'KV no configurado' });
  }

  const type = req.query.type;
  let key = type === 'results' ? 'results' : type === 'reqs' ? 'reqs' : 'jobs';

  // ── GET ──
  if (req.method === 'GET') {
    try {
      const r = await fetch(`${KV_URL}/get/${key}`, {
        headers: { Authorization: `Bearer ${KV_TOKEN}` }
      });
      const data = await r.json();
      let items = [];
      if (data.result) {
        try {
          const parsed = JSON.parse(data.result);
          items = Array.isArray(parsed) ? parsed : [];
        } catch(e) { items = []; }
      }
      return res.status(200).json({ [key]: items });
    } catch(e) {
      return res.status(200).json({ [key]: [] });
    }
  }

  // ── POST ──
  if (req.method === 'POST') {
    try {
      const payload = req.body[key];
      if (payload === undefined) {
        return res.status(400).json({ error: `Payload key "${key}" no encontrada` });
      }
      // Guardar como string JSON (una sola serialización)
      const valueStr = JSON.stringify(payload);
      const r = await fetch(`${KV_URL}/set/${key}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KV_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(valueStr)
      });
      const result = await r.json();
      if (result.error) return res.status(500).json({ error: result.error });
      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
