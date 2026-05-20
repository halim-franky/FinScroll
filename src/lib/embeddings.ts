import { Embeddings } from "@langchain/core/embeddings";
import { AsyncCaller } from "@langchain/core/utils/async_caller";
import { config } from "./config";

/**
 * Resilient fetch wrapper that automatically catches 429 rate limits 
 * and retries with exponential backoff.
 */
async function fetchWithRetry(url: string, options: any, retries = 3, delay = 2000): Promise<Response> {
  const res = await fetch(url, options);
  if (res.status === 429 && retries > 0) {
    console.warn(`Gemini API 429 Rate Limit hit. Retrying in ${delay}ms... (${retries} retries left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
  return res;
}

export class CustomGeminiEmbeddings implements Embeddings {
  caller = new AsyncCaller({});

  async embedDocuments(texts: string[]): Promise<number[][]> {
    if (!config.googleGenAI.apiKey) {
      throw new Error("Google Gemini API key is not configured.");
    }

    if (texts.length === 0) return [];

    // The free-tier has severe rate-limits on concurrent requests.
    // We will batch chunks together using Gemini's official batchEmbedContents endpoint
    // to execute up to 50 embeddings in a single HTTP request.
    const batchSize = 50;
    const allEmbeddings: number[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents?key=${config.googleGenAI.apiKey}`;

      // Call our resilient retry wrapper to survive rate limits
      const response = await fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: batch.map(text => ({
            model: "models/gemini-embedding-001",
            content: { parts: [{ text }] }
          }))
        })
      });

      const data = await response.json();

      if (!response.ok || !data.embeddings) {
        console.error("Gemini Batch API Error:", data);
        throw new Error(`Gemini Batch API Error: ${data.error?.message || "Unknown error"}`);
      }

      allEmbeddings.push(...data.embeddings.map((e: any) => e.values));
    }

    return allEmbeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const results = await this.embedDocuments([text]);
    return results[0];
  }
}

let embeddingsInstance: Embeddings | null = null;

export function getEmbeddings(): Embeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new CustomGeminiEmbeddings();
  }
  return embeddingsInstance as Embeddings;
}
