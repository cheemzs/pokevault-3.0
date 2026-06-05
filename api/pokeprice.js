// api/pokeprice.js
// ─────────────────────────────────────────────────────────────────────────
//  Vercel Serverless Function — Pokemon Price Tracker API secure proxy
//
//  Base URL:  https://www.pokemonpricetracker.com/api/v2
//  Auth:      Authorization: Bearer <key>  (header, never exposed to client)
//
//  Actions (via ?action= query param):
//    search  → GET /cards?search=<name>&set=<set>&limit=10
//    card    → GET /cards?tcgPlayerId=<id>
// ─────────────────────────────────────────────────────────────────────────

const BASE = 'https://www.pokemonpricetracker.com/api/v2';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.POKEPRICE_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Price API key is not configured on the server.' });
  }

  const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Accept': 'application/json',
  };

  const { action, name, set, id } = req.query;

  // ── Search cards by name (+ optional set) ─────────────────────
  if (action === 'search') {
    if (!name) {
      return res.status(400).json({ error: 'Missing required param: name' });
    }

    // Build a natural-language search string e.g. "charizard base set"
    const searchStr = set ? `${name.trim()} ${set.trim()}` : name.trim();
    const params    = new URLSearchParams({
      search: searchStr,
      limit:  '10',
      sortBy: 'price',
      sortOrder: 'desc',
    });

    const url = `${BASE}/cards?${params}`;
    try {
      const upstream = await fetch(url, { headers });
      const body     = await upstream.text();

      if (!upstream.ok) {
        console.error(`[pokeprice] search ${upstream.status}:`, body);
        return res.status(upstream.status).json({ error: 'Upstream API error', detail: body });
      }

      const data = JSON.parse(body);
      // Normalise: always return an array under .results
      const cards = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
      return res.status(200).json({ results: cards, metadata: data.metadata });
    } catch (err) {
      console.error('[pokeprice] search fetch failed:', err);
      return res.status(500).json({ error: 'Failed to reach the Price Tracker API' });
    }
  }

  // ── Fetch a single card by TCGPlayer ID ───────────────────────
  if (action === 'card') {
    if (!id) {
      return res.status(400).json({ error: 'Missing required param: id' });
    }

    const params = new URLSearchParams({ tcgPlayerId: id.trim() });
    const url    = `${BASE}/cards?${params}`;

    try {
      const upstream = await fetch(url, { headers });
      const body     = await upstream.text();

      if (!upstream.ok) {
        console.error(`[pokeprice] card ${upstream.status}:`, body);
        return res.status(upstream.status).json({ error: 'Upstream API error', detail: body });
      }

      const data = JSON.parse(body);
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=120');
      return res.status(200).json(data);
    } catch (err) {
      console.error('[pokeprice] card fetch failed:', err);
      return res.status(500).json({ error: 'Failed to reach the Price Tracker API' });
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use action=search or action=card.' });
}
