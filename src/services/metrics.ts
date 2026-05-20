import { getPineconeIndex } from "../lib/pinecone";

export interface DashboardMetrics {
  totalVectors: number;
  dimension: number;
  indexFullness: number;
  status: "Online" | "Offline" | "Error";
}

/**
 * Fetches core metrics from the Pinecone Vector DB for the Dashboard.
 */
export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  try {
    const index = await getPineconeIndex();
    const stats = await index.describeIndexStats();

    return {
      totalVectors: stats.totalRecordCount || 0,
      dimension: stats.dimension || 3072, // Default Gemini embedding dim
      indexFullness: stats.indexFullness || 0,
      status: "Online",
    };
  } catch (error) {
    console.error("Failed to fetch Pinecone metrics:", error);
    return {
      totalVectors: 0,
      dimension: 0,
      indexFullness: 0,
      status: "Error",
    };
  }
}
