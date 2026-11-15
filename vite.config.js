import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function webSearchPlugin() {
  return {
    name: 'web-search-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/search')) {
          const urlObj = new URL(req.url, 'http://localhost');
          const query = urlObj.searchParams.get('q');
          if (!query || !query.trim()) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ results: [] }));
            return;
          }

          const cleanQuery = query.trim();
          const results = [];

          try {
            // 1. DuckDuckGo Real-Time Web Search (Extracts real organic websites & citations)
            try {
              const ddgRes = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(cleanQuery)}`, {
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
                signal: AbortSignal.timeout(2800)
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
                    results.push({
                      title,
                      snippet,
                      source: link,
                      domain: domain || 'web'
                    });
                  }
                }
              }
            } catch (err) {
              console.warn("DDG web search error:", err.message);
            }

            // 2. Google News RSS for Live Breaking News
            if (results.length < 3) {
              try {
                const newsUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(cleanQuery)}&hl=en-US&gl=US&ceid=US:en`;
                const newsRes = await fetch(newsUrl, {
                  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
                  signal: AbortSignal.timeout(2500)
                });
                if (newsRes.ok) {
                  const newsXml = await newsRes.text();
                  const items = newsXml.match(/<item>[\s\S]*?<\/item>/g)?.slice(0, 3) || [];

                  for (const item of items) {
                    const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim();
                    const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim();
                    const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim();

                    if (title) {
                      results.push({
                        title,
                        snippet: `Recent News (${pubDate || 'Latest'}): ${title}`,
                        source: link || 'https://news.google.com',
                        domain: 'news.google.com'
                      });
                    }
                  }
                }
              } catch (err) {
                console.warn("News RSS fetch failed:", err.message);
              }
            }

            // Deduplicate by URL or title
            const unique = [];
            const seen = new Set();
            for (const r of results) {
              const key = r.source || r.title;
              if (!seen.has(key)) {
                seen.add(key);
                unique.push(r);
              }
            }

            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ query: cleanQuery, results: unique.slice(0, 5) }));
          } catch (err) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ query: cleanQuery, results: [], error: err.message }));
          }
          return;
        }
        next();
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), webSearchPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api/nvidia': {
        target: 'https://integrate.api.nvidia.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/nvidia/, '')
      }
    }
  }
})
