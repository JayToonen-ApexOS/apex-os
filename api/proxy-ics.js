export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'Missing url parameter' });

  // Convert webcal:// to https://
  const fetchUrl = decodeURIComponent(url).replace(/^webcal:\/\//i, 'https://');

  try {
    const response = await fetch(fetchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ApexOS/1.0)',
        'Accept': 'text/calendar, application/octet-stream, */*',
      },
    });

    if (!response.ok) throw new Error(`Upstream error: ${response.status}`);

    const text = await response.text();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'text/calendar');
    res.status(200).send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
