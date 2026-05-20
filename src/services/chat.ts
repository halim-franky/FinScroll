import { semanticSearch } from "./search";
import { config } from "../lib/config";

export interface ChatResponse {
  reply: string;
  sources: string[];
}

export async function generateChatResponse(userMessage: string): Promise<ChatResponse> {
  // 1. Get context from Vector DB using our existing Semantic Search
  const searchResults = await semanticSearch(userMessage, 4);
  
  // 2. Build the context string
  const contextTexts = searchResults.map(r => `- ${r.text}`).join("\n");
  
  // 3. Construct the RAG prompt for Gemini
  const prompt = `You are "FinScroll", a highly witty, modern, and empathetic digital financial wellness mentor designed specifically for Gen Z and younger audiences. 
Your primary goal is to help users convert mindless screen doomscrolling into active wealth-building habits, master personal finance, understand compound interest, and avoid toxic retail trading hype or "get-rich-quick" finfluencer traps.

Guidelines:
- Speak in a natural, modern, engaging Gen-Z tone (use popular slang like "fr", "no cap", "bestie", "lowkey", "💀" naturally but keep it clean, highly professional, and grounded in real advice).
- Highlight the compound-interest opportunity cost of screen doomscrolling when appropriate (e.g. reminding them that early investing compounds massively!).
- Educate them on passive investing (ETFs/Index funds) and steady savings vs. emotional day trading or meme coin hypes.
- Keep your answers concise, highly actionable, engaging, and supportive.

Use the following retrieved knowledge context from our database (sourced from SEC Investor.gov and Springer Economics) to ground your answer. If the context isn't highly relevant to their specific question, just give your best empathetic finance advice based on your general knowledge.

### Retrieved Knowledge Base Context:
${contextTexts || "No specific context found in database for this query."}

### User Message:
${userMessage}
`;

  // 4. Call Google Gemini 3 Flash API directly for robustness
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${config.googleGenAI.apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 800,
      }
    })
  });

  const data = await response.json();
  
  if (!response.ok || !data.candidates || data.candidates.length === 0) {
    console.error("Gemini Chat Error:", data);
    throw new Error(`Failed to generate response: ${data?.error?.message || "Unknown error"}`);
  }
  
  // Extract unique sources that have a decent semantic match score
  const uniqueSources = Array.from(new Set(
    searchResults
      .filter(r => r.score > 0.2) // Threshold for relevance
      .map(r => r.metadata?.source)
      .filter(Boolean)
  ));
  
  return {
    reply: data.candidates[0].content.parts[0].text,
    sources: uniqueSources as string[]
  };
}
