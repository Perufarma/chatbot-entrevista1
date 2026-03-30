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

  async function kv(command, method, body) {
    const opts = { headers: { Authorization: `Bearer ${TOKEN}` } };
    if (method === 'POST') {
      opts.method = 'POST';
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    const r = await fetch(`${URL}/${command}`, opts);
    return r.json();
  }

  const key = req.query.type === 'results' ? 'results' : 'jobs';

  // GET
  if (req.method === 'GET') {
    try {
      const data = await kv(`get/${key}`);
      const items = data.result ? JSON.parse(data.result) : [];
      return res.status(200).json({ [key]: items });
    } catch (e) {
      return res.status(200).json({ [key]: [] });
    }
  }

  // POST — guardar
  if (req.method === 'POST') {
    try {
      const payload = req.body[key];
      const encoded = encodeURIComponent(JSON.stringify(payload));
      await kv(`set/${key}/${encoded}`);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
