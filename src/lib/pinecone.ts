import { Pinecone } from "@pinecone-database/pinecone";
import { config } from "./config";

/**
 * Singleton instance of Pinecone client.
 * Ensures we don't create multiple connections in serverless environments.
 */
let pineconeInstance: Pinecone | null = null;

export async function getPineconeClient() {
  if (!pineconeInstance) {
    if (!config.pinecone.apiKey) {
      throw new Error("Pinecone API key is not configured.");
    }
    
    pineconeInstance = new Pinecone({
      apiKey: config.pinecone.apiKey,
    });
  }
  return pineconeInstance;
}

export async function getPineconeIndex() {
  const client = await getPineconeClient();
  if (!config.pinecone.index) {
    throw new Error("Pinecone Index is not configured.");
  }
  return client.index(config.pinecone.index);
}
