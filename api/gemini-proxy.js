// Server-side Gemini proxy: the API key lives only in the GEMINI_API_KEY server env var,
// never in the browser bundle. The browser SDK points httpOptions.baseUrl at /api/gemini-proxy.
// ponytail: same-origin + path allowlist only, add rate limiting if the proxy itself gets abused.
const ALLOWED_PATH = /^v1beta\/models\/[\w.\-]+:(generateContent|streamGenerateContent)$/;

export const config = { api: { bodyParser: { sizeLimit: '4mb' } } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const origin = req.headers.origin;
  if (origin && new URL(origin).host !== req.headers.host) {
    return res.status(403).json({ error: 'cross-origin requests are not allowed' });
  }

  const path = String(req.query.path || '');
  if (!ALLOWED_PATH.test(path)) return res.status(400).json({ error: 'path not allowed' });

  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });

  try {
    const qs = req.query.alt ? `?alt=${encodeURIComponent(String(req.query.alt))}` : '';
    const upstream = await fetch(`https://generativelanguage.googleapis.com/${path}${qs}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: typeof req.body === 'string' ? req.body : JSON.stringify(req.body),
    });
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    return res.send(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    console.error('Gemini proxy failed:', error);
    return res.status(502).json({ error: 'Gemini upstream request failed' });
  }
}
