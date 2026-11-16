export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const query = req.query?.q || (new URL(req.url, 'http://localhost')).searchParams.get('q');
  if (!query || !query.trim()) {
    return res.status(200).json({ results: [] });
  }

  const cleanQuery = query.trim();
  const results = [];

  try {
    // 1. DuckDuckGo Real-Time Web Search
    try {
      const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml'
        },
        signal: AbortSignal.timeout(3500)
      });

      if (ddgRes.ok) {
        const html = await ddgRes.text();
        const itemMatches = [...html.matchAll(/<h2 class="result__title">[\s\S]*?<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet[^>]*>([\s\S]*?)<\/a>/g)];

        for (const m of itemMatches.slice(0, 5)) {
          let link = m[1];
          if (link.includes('uddg=')) {
            try {
              const u = new URL(link.startsWith('//') ? 'https:' + link : link);
              const real = u.searchParams.get('uddg');
              if (real) link = decodeURIComponent(real);
            } catch (_) {}
          }

          const title = m[2].replace(/<[^>]+>/g, '').trim();
          const snippet = m[3].replace(/<[^>]+>/g, '').trim();
          let domain = '';
          try {
            domain = new URL(link).hostname.replace(/^www\./, '');
          } catch (_) {}

          if (title && link) {
            results.push({ title, snippet, source: link, domain });
          }
        }
      }
    } catch (_) {}

    // 2. Google News RSS Feed fallback for current news
    if (results.length < 3) {
      try {
        const newsRes = await fetch(`https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=en-IN&gl=IN&ceid=IN:en`, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(3000)
        });

        if (newsRes.ok) {
          const xml = await newsRes.text();
          const items = [...xml.matchAll(/<item>[\s\S]*?<title>([\s\S]*?)<\/title>[\s\S]*?<link>([\s\S]*?)<\/link>[\s\S]*?<pubDate>([\s\S]*?)<\/pubDate>/g)];

          for (const item of items.slice(0, 4)) {
            const title = item[1].replace(/<!\[CDATA\[|\]\]>/g, '').replace(/<[^>]+>/g, '').trim();
            const link = item[2].trim();
            const pubDate = item[3].trim();

            if (title) {
              results.push({
                title,
                snippet: `News (${pubDate || 'Latest'}): ${title}`,
                source: link || 'https://news.google.com',
                domain: 'news.google.com'
              });
            }
          }
        }
      } catch (_) {}
    }

    // Deduplicate
    const unique = [];
    const seen = new Set();
    for (const r of results) {
      const key = r.source || r.title;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(r);
      }
    }

    return res.status(200).json({ query: cleanQuery, results: unique.slice(0, 5) });
  } catch (err) {
    return res.status(200).json({ query: cleanQuery, results: [], error: err.message });
  }
}
