import OpenAI from "openai";

function getClient(): OpenAI | null {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    console.warn("[embeddings] OPENAI_API_KEY not set — embedding step skipped");
    return null;
  }
  return new OpenAI({ apiKey: key });
}

async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const status = (err as { status?: number }).status;
      if (status === 429 || status === 500) {
        const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

export async function generateEmbedding(text: string): Promise<number[] | null> {
  const client = getClient();
  if (!client) return null;
  try {
    const res = await withRetry(() =>
      client.embeddings.create({ model: "text-embedding-3-small", input: text.slice(0, 8000) })
    );
    return res.data[0].embedding;
  } catch (err) {
    console.error("[embeddings] generateEmbedding failed:", err);
    return null;
  }
}

export async function generateEmbeddings(texts: string[]): Promise<(number[] | null)[]> {
  const client = getClient();
  if (!client) return texts.map(() => null);

  // Batch in groups of 100
  const results: (number[] | null)[] = [];
  for (let i = 0; i < texts.length; i += 100) {
    const batch = texts.slice(i, i + 100).map((t) => t.slice(0, 8000));
    try {
      const res = await withRetry(() =>
        client.embeddings.create({ model: "text-embedding-3-small", input: batch })
      );
      for (const item of res.data) {
        results.push(item.embedding);
      }
    } catch (err) {
      console.error("[embeddings] batch failed at offset", i, err);
      for (let j = 0; j < batch.length; j++) results.push(null);
    }
  }
  return results;
}
