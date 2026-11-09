// Vercel serverless function: returns the latest Instagram posts as JSON.
// The access token lives in the INSTAGRAM_TOKEN env var, never in the page.
export default async function handler(req, res) {
  const token = process.env.INSTAGRAM_TOKEN;
  if (!token) return res.status(500).json({ error: 'INSTAGRAM_TOKEN not set' });
  const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption';
  const url = `https://graph.instagram.com/me/media?fields=${fields}&limit=12&access_token=${token}`;
  try {
    const r = await fetch(url);
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data.error?.message || 'Instagram error' });
    const posts = (data.data || [])
      .filter(p => p.media_type === 'IMAGE' || p.media_type === 'CAROUSEL_ALBUM' || p.media_type === 'VIDEO')
      .map(p => ({
        src: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url,
        alt: (p.caption || 'Instagram post').slice(0, 140),
        link: p.permalink,
      }))
      .filter(p => p.src);
    res.setHeader('Cache-Control', 's-maxage=1800, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(200).json(posts);
  } catch (e) {
    res.status(502).json({ error: 'Fetch failed' });
  }
}
