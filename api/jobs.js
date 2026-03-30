export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const URL   = process.env.KV_REST_API_URL;
  const TOKEN = process.env.KV_REST_API_TOKEN;

  if (!URL || !TOKEN) {
    return res.status(500).json({ error: 'KV no configurado', vars: { URL: !!URL, TOKEN: !!TOKEN } });
  }

  async function kv(command) {
    const r = await fetch(`${URL}/${command}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    return r.json();
  }

  if (req.method === 'GET') {
    try {
      const data = await kv('get/jobs');
      const jobs = data.result ? JSON.parse(data.result) : [];
      return res.status(200).json({ jobs });
    } catch (e) {
      return res.status(200).json({ jobs: [], error: e.message });
    }
  }

  if (req.method === 'POST') {
    try {
      const { jobs } = req.body;
      const encoded = encodeURIComponent(JSON.stringify(jobs));
      await kv(`set/jobs/${encoded}`);
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
