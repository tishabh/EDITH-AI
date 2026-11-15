/**
 * Real-Time Live Web Search & Research Engine
 * Fetches real-time web search results from live sources and synthesizes them into model context.
 */

export async function performWebSearch(query) {
  if (!query || !query.trim()) return [];

  const trimmed = query.trim();
  if (trimmed.length < 3 || /^(hi|hello|hey|howdy|sup|ping)$/i.test(trimmed)) {
    return [];
  }

  try {
    const cleanQuery = trimmed.replace(/[?.,!]/g, ' ').trim();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3200);

    const res = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];

    const data = await res.json();
    return data.results || [];
  } catch (err) {
    return [];
  }
}

/**
 * Determine if a query benefits from real-time web research
 */
export function shouldPerformWebSearch(query) {
  if (!query) return false;
  const q = query.trim().toLowerCase();

  // If casual one-word greeting, skip
  if (q.length < 4 || /^(hi|hello|hey|who are you|what can you do|help)$/i.test(q)) {
    return false;
  }

  // Pure calendar date/time questions are handled 100% accurately by the local system clock
  if (/^(aaj ki date|aaj kya date|aaj ki tarikh|aaj kya din|today'?s? date|what is today'?s? date|current date|current time|current day|today date)$/i.test(q)) {
    return false;
  }

  // Check user settings override
  try {
    const userSettings = JSON.parse(localStorage.getItem("edith_user_settings") || "{}");
    if (userSettings.webSearchMode === "always") return true;
    if (userSettings.webSearchMode === "off") return false;
  } catch (_) {}

  // Triggers for real-world factual information, research, news, or current topics
  const researchTriggers = [
    'today', 'latest', 'news', 'current', 'weather', 'stock', 'price', 
    'release date', 'released', 'who won', 'score', 'match', 'update', 
    'recent', '2025', '2026', 'election', 'founder of', 'ceo of', 'live',
    'search', 'who is', 'what happened', 'champions', 'winner', 'crypto',
    'bitcoin', 'gold rate', 'rate', 'nifty', 'sensex', 'bhav', 'daam',
    'aaj', 'taza', 'khabar', 'samachar', 'mausam', 'kaun jita', 'ipl',
    'cricket', 'president', 'prime minister', 'pm of', 'research', 'source',
    'website', 'tell me about', 'explain', 'what is', 'how does', 'specs',
    'features', 'gpu', 'nvidia', 'nemotron', 'kmp', 'benchmark'
  ];

  return researchTriggers.some(trigger => q.includes(trigger));
}

/**
 * Format search results into context for the AI with explicit instructions to cite sources
 */
export function formatWebSearchContext(results) {
  if (!results || results.length === 0) return "";

  const formattedSources = results.slice(0, 5).map((r, i) => 
    `[Source ${i + 1}]: ${r.title}\nDomain: ${r.domain || 'web'}\nURL: ${r.source}\nSummary: ${r.snippet}`
  ).join("\n\n");

  return `[LIVE REAL-TIME WEB RESEARCH & SOURCES]
The following live, verified web pages and real-time search data were retrieved:

${formattedSources}

INSTRUCTIONS FOR USING RESEARCH DATA:
1. Ground your answer thoroughly in the factual details provided above.
2. Directly answer the user's question using this verified real-world research.
3. Cite sources naturally where appropriate (e.g. "According to NVIDIA Developer...", "[1]", or by naming the source publication).
4. Maintain a professional, direct, and intelligent tone.`;
}
