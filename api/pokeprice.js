// api/pokeprice.js
const BASE = 'https://www.pokemonpricetracker.com/api/v2';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.POKEPRICE_KEY;
  if (!apiKey) return res.status(503).json({ error: 'Price API key is not configured.' });

  const headers = { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/json' };
  const { action, name, set, id, language } = req.query;
  const lang = language === 'japanese' ? 'japanese' : 'english';

  // ── Search cards ──────────────────────────────────────────────────────────
  if (action === 'search') {
    if (!name) return res.status(400).json({ error: 'Missing param: name' });
    const searchStr = set ? `${name.trim()} ${set.trim()}` : name.trim();
    const params = new URLSearchParams({ search: searchStr, limit: '20', language: lang });
    try {
      const upstream = await fetch(`${BASE}/cards?${params}`, { headers });
      const body = await upstream.text();
      if (!upstream.ok) return res.status(upstream.status).json({ error: 'Upstream error', detail: body });
      const data = JSON.parse(body);
      const results = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json({ results, metadata: data.metadata });
    } catch (err) {
      return res.status(500).json({ error: 'Fetch failed', detail: err.message });
    }
  }

  // ── Search by card number (e.g. 199/165) ─────────────────────────────────
  if (action === 'bynumber') {
    if (!name) return res.status(400).json({ error: 'Missing param: name (card number)' });
    // name param carries the number string here, set carries optional set name
    const params = new URLSearchParams({ search: name.trim(), limit: '30', language: lang });
    if (set) params.set('set', set.trim());
    try {
      const upstream = await fetch(`${BASE}/cards?${params}`, { headers });
      const body = await upstream.text();
      if (!upstream.ok) return res.status(upstream.status).json({ error: 'Upstream error', detail: body });
      const data = JSON.parse(body);
      const all = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
      // Filter to only cards whose cardNumber matches the input exactly
      const num = name.trim().toLowerCase();
      const matched = all.filter(r => {
        const cn = (r.cardNumber || '').toLowerCase();
        const full = `${cn}/${r.totalSetNumber || ''}`.toLowerCase();
        return cn === num || full === num || full.startsWith(num + '/');
      });
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json({ results: matched.length ? matched : all, metadata: data.metadata });
    } catch (err) {
      return res.status(500).json({ error: 'Fetch failed', detail: err.message });
    }
  }

  // ── Search sealed products ────────────────────────────────────────────────
  if (action === 'sealed') {
    const q = name || '';
    const params = new URLSearchParams({ limit: '20', language: lang });
    if (q) params.set('search', q.trim());
    if (set) params.set('set', set.trim());
    try {
      const upstream = await fetch(`${BASE}/sealed-products?${params}`, { headers });
      const body = await upstream.text();
      if (!upstream.ok) return res.status(upstream.status).json({ error: 'Upstream error', detail: body });
      const data = JSON.parse(body);
      const results = Array.isArray(data.data) ? data.data : (data.data ? [data.data] : []);
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json({ results, metadata: data.metadata });
    } catch (err) {
      return res.status(500).json({ error: 'Fetch failed', detail: err.message });
    }
  }

  // ── Single card by TCGPlayer ID ───────────────────────────────────────────
  if (action === 'card') {
    if (!id) return res.status(400).json({ error: 'Missing param: id' });
    const params = new URLSearchParams({ tcgPlayerId: id.trim(), language: lang });
    try {
      const upstream = await fetch(`${BASE}/cards?${params}`, { headers });
      const body = await upstream.text();
      if (!upstream.ok) return res.status(upstream.status).json({ error: 'Upstream error', detail: body });
      const data = JSON.parse(body);
      res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: 'Fetch failed', detail: err.message });
    }
  }

  return res.status(400).json({ error: 'Invalid action. Use: search, bynumber, sealed, card' });
}
