import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { PineconeStore } from "@langchain/pinecone";
import { getPineconeIndex } from "../lib/pinecone";
import { getEmbeddings } from "../lib/embeddings";

export interface IngestionResult {
  success: boolean;
  documentsProcessed: number;
  chunksCreated: number;
  error?: string;
}

/**
 * Takes an array of raw text strings, splits them, creates embeddings,
 * and stores them in Pinecone.
 */
export async function ingestDocuments(texts: string[], sourceMetadata: Record<string, any> = {}): Promise<IngestionResult> {
  try {
    // 1. Create Langchain Documents
    const docs = texts.map((text) => new Document({ pageContent: text, metadata: { ...sourceMetadata } }));

    // 2. Split text into manageable chunks
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });
    
    const chunkedDocs = await textSplitter.splitDocuments(docs);

    if (chunkedDocs.length === 0) {
      return {
        success: true,
        documentsProcessed: 0,
        chunksCreated: 0,
      };
    }
    // 3. Initialize Pinecone index and LangChain store
    const pineconeIndex = await getPineconeIndex();
    const embeddings = getEmbeddings();

    // 4. Generate embeddings for all chunks
    const textsToEmbed = chunkedDocs.map(doc => doc.pageContent);
    const vectors = await embeddings.embedDocuments(textsToEmbed);

    // 5. Prepare records for Pinecone
    const records = chunkedDocs.map((doc, i) => {
      // Pinecone only accepts string, number, boolean, or array of strings.
      // LangChain's TextSplitter adds an object `loc` which breaks Pinecone.
      const safeMetadata: Record<string, any> = { text: doc.pageContent };
      for (const [key, value] of Object.entries(doc.metadata)) {
        if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
          safeMetadata[key] = value;
        } else if (Array.isArray(value) && value.every(v => typeof v === "string")) {
          safeMetadata[key] = value;
        }
      }

      return {
        id: crypto.randomUUID(),
        values: vectors[i],
        metadata: safeMetadata
      };
    });

    // 6. Push to Pinecone Vector DB natively
    if (records.length > 0) {
      // @ts-ignore - Bypass potential TS declaration mismatches in Pinecone SDK
      await pineconeIndex.upsert({ records });
    }

    return {
      success: true,
      documentsProcessed: docs.length,
      chunksCreated: chunkedDocs.length,
    };
  } catch (error: any) {
    console.error("Ingestion Service Error:", error);
    return {
      success: false,
      documentsProcessed: 0,
      chunksCreated: 0,
      error: error.message || "Unknown error occurred during ingestion.",
    };
  }
}
