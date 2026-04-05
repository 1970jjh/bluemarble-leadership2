export default async function handler(req, res) {
  const GAS_URL = process.env.VITE_GAS_URL;

  if (!GAS_URL) {
    res.status(500).json({ success: false, error: 'VITE_GAS_URL not configured on Vercel' });
    return;
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
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
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(text);
      return;
    }

    if (req.method === 'GET') {
      const url = new URL(GAS_URL);
      const query = req.query || {};
      Object.keys(query).forEach((k) => {
        if (k) url.searchParams.set(k, query[k]);
      });
      const response = await fetch(url.toString(), { redirect: 'follow' });
      const text = await response.text();
      res.setHeader('Content-Type', 'application/json');
      res.status(200).send(text);
      return;
    }

    res.status(405).json({ success: false, error: 'Method not allowed' });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
}
