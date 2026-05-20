import { getEmbeddings } from "../lib/embeddings";
import { getPineconeIndex } from "../lib/pinecone";

export interface SearchResult {
  text: string;
  score: number;
  metadata: Record<string, any>;
}

/**
 * Perform a semantic search query against the Pinecone Vector DB.
 */
export async function semanticSearch(query: string, topK: number = 3): Promise<SearchResult[]> {
  if (!query || query.trim() === "") {
    return [];
  }

  // 1. Get the initialized Pinecone index and Embeddings instance
  const pineconeIndex = await getPineconeIndex();
  const embeddings = getEmbeddings();

  // 2. Convert the user's string query into a mathematical vector
  const [queryVector] = await embeddings.embedDocuments([query]);

  // 3. Query the Pinecone index for the closest matching vectors
  const queryResponse = await pineconeIndex.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  // 4. Format and return the results
  const results: SearchResult[] = (queryResponse.matches || []).map((match) => {
    const metadata = match.metadata || {};
    return {
      text: (metadata.text as string) || "No text available",
      score: match.score || 0,
      metadata: metadata,
    };
  });

  return results;
}
