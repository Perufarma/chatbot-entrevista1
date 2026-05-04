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

  // Mapeo de type a key en Upstash
  let key;
  if (type === 'results')        key = 'results';
  else if (type === 'reqs')      key = 'reqs';
  else if (type === 'feedbacks') key = 'feedbacks';
  else if (type === 'config')    key = 'config';
  else                           key = 'jobs';

  const headers = { Authorization: `Bearer ${KV_TOKEN}`, 'Content-Type': 'application/json' };

  // ── CONFIG: clave-valor individual (para contraseña y ajustes) ──
  if (type === 'config') {
    if (req.method === 'GET') {
      try {
        const r = await fetch(`${KV_URL}/get/config`, { headers });
        const data = await r.json();
        let cfg = {};
        if (data.result) {
          try { cfg = typeof data.result === 'string' ? JSON.parse(data.result) : data.result; } catch(e) {}
        }
        return res.status(200).json({ config: cfg });
      } catch(e) {
        return res.status(200).json({ config: {} });
      }
    }
    if (req.method === 'POST') {
      try {
        // Leer config actual
        const rg = await fetch(`${KV_URL}/get/config`, { headers });
        const dg = await rg.json();
        let cfg = {};
        if (dg.result) {
          try { cfg = typeof dg.result === 'string' ? JSON.parse(dg.result) : dg.result; } catch(e) {}
        }
        // Actualizar la clave
        cfg[req.body.key] = req.body.value;
        const r = await fetch(`${KV_URL}/pipeline`, {
          method: 'POST', headers,
          body: JSON.stringify([["SET", "config", JSON.stringify(cfg)]])
        });
        return res.status(200).json({ ok: true });
      } catch(e) {
        return res.status(500).json({ error: e.message });
      }
    }
  }

  // GET (arrays: jobs, results, reqs, feedbacks)
  if (req.method === 'GET') {
    try {
      const r    = await fetch(`${KV_URL}/get/${key}`, { headers });
      const data = await r.json();
      let items  = [];
      if (data.result) {
        try {
          const parsed = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
          items = Array.isArray(parsed) ? parsed : [];
        } catch(e) { items = []; }
      }
      return res.status(200).json({ [key]: items });
    } catch(e) {
      return res.status(200).json({ [key]: [] });
    }
  }

  // POST (arrays)
  if (req.method === 'POST') {
    try {
      const payload = req.body[key];
      if (payload === undefined) {
        return res.status(400).json({ error: `Payload key "${key}" no encontrada` });
      }
      const valueStr = JSON.stringify(payload);
      const r = await fetch(`${KV_URL}/pipeline`, {
        method: 'POST',
        headers,
        body: JSON.stringify([["SET", key, valueStr]])
      });
      const result = await r.json();
      if (result[0] && result[0].error) {
        return res.status(500).json({ error: result[0].error });
      }
      return res.status(200).json({ ok: true });
    } catch(e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
