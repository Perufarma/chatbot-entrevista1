// api/jobs.js — guarda y lee puestos desde variables de entorno o KV
// Solución simple: los puestos se leen desde una variable de entorno JOBS_DATA
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    // Lee puestos desde variable de entorno
    try {
      const jobsData = process.env.JOBS_DATA;
      const jobs = jobsData ? JSON.parse(jobsData) : [];
      return res.status(200).json({ jobs });
    } catch {
      return res.status(200).json({ jobs: [] });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
