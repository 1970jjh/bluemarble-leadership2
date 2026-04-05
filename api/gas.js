export default async function handler(req, res) {
  const GAS_URL = process.env.VITE_GAS_URL;

  if (!GAS_URL) {
    return res.status(500).json({ success: false, error: 'VITE_GAS_URL not configured' });
  }

  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      const response = await fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: body,
        redirect: 'follow',
      });
      const data = await response.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(data);
    }

    if (req.method === 'GET') {
      const url = new URL(GAS_URL);
      Object.entries(req.query || {}).forEach(([k, v]) => {
        if (k !== '') url.searchParams.set(k, v);
      });
      const response = await fetch(url.toString(), { redirect: 'follow' });
      const data = await response.text();
      res.setHeader('Content-Type', 'application/json');
      return res.status(200).send(data);
    }

    return res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || String(error) });
  }
}
