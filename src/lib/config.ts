/**
 * Centralized configuration for server-side environment variables.
 * Ensures zero hardcoded secrets and validates environment setup.
 */

export const config = {
  pinecone: {
    apiKey: process.env.PINECONE_API_KEY ?? "",
    index: process.env.PINECONE_INDEX ?? "",
  },
  googleGenAI: {
    apiKey: process.env.GOOGLE_GEMINI_API_KEY ?? "",
  },
  cors: {
    allowedOrigins: (process.env.ALLOWED_ORIGINS ?? "").split(",").filter(Boolean),
  },
} as const;

export function validateServerConfig() {
  const missing = [];
  if (!config.pinecone.apiKey) missing.push("PINECONE_API_KEY");
  if (!config.pinecone.index) missing.push("PINECONE_INDEX");
  if (!config.googleGenAI.apiKey) missing.push("GOOGLE_GEMINI_API_KEY");

  if (missing.length > 0) {
    throw new Error(`Missing required server-side environment variables: ${missing.join(", ")}`);
  }
}
