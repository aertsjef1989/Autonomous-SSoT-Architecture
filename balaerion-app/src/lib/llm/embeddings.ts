/**
 * Card-Free 1024-Dimensional Multilingual Embeddings Helper (Decision A2):
 *  1. Cloudflare Workers AI `@cf/baai/bge-m3` (1024-dim, EN/NL/FR, ZDR free tier)
 *  2. Cohere Trial `embed-multilingual-v3.0` (1024-dim, EN/NL/FR)
 *  3. Graceful `null` fallback so callers seamlessly use PostgreSQL `tsvector` full-text ranking when unset.
 */

export async function generateFreeEmbeddings1024(
  texts: string[],
  inputType: 'search_document' | 'search_query' = 'search_query',
  env: NodeJS.ProcessEnv = process.env
): Promise<number[][] | null> {
  const cleanTexts = texts.map((t) => t.trim().slice(0, 2000)).filter(Boolean);
  if (cleanTexts.length === 0) return null;

  // 1. Cloudflare Workers AI @cf/baai/bge-m3 (1024-dim)
  const cfAccount = (env.CLOUDFLARE_ACCOUNT_ID ?? '').trim();
  const cfToken = (env.CLOUDFLARE_AI_API_TOKEN ?? '').trim();
  if (cfAccount && cfToken) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const url = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(cfAccount)}/ai/run/@cf/baai/bge-m3`;
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cfToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: cleanTexts }),
        signal: controller.signal,
      });
      if (resp.ok) {
        const json = (await resp.json()) as { result?: { data?: number[][] } };
        const vecs = json?.result?.data;
        if (Array.isArray(vecs) && vecs.length === cleanTexts.length && vecs[0]?.length === 1024) {
          return vecs;
        }
      }
    } catch {
      /* fall through to Cohere or tsvector */
    } finally {
      clearTimeout(timer);
    }
  }

  // 2. Cohere Trial Key embed-multilingual-v3.0 (1024-dim)
  const cohereKey = (env.COHERE_API_KEY ?? '').trim();
  if (cohereKey) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch('https://api.cohere.com/v1/embed', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cohereKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'embed-multilingual-v3.0',
          texts: cleanTexts,
          input_type: inputType,
          truncate: 'END',
        }),
        signal: controller.signal,
      });
      if (resp.ok) {
        const json = (await resp.json()) as { embeddings?: number[][] };
        const vecs = json?.embeddings;
        if (Array.isArray(vecs) && vecs.length === cleanTexts.length && vecs[0]?.length === 1024) {
          return vecs;
        }
      }
    } catch {
      /* fall through to tsvector */
    } finally {
      clearTimeout(timer);
    }
  }

  return null;
}
