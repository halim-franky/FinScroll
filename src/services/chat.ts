import { semanticSearch } from "./search";
import { config } from "../lib/config";
import {
  pickAcademicReferences,
  userRequestedAcademic,
} from "../lib/academicReferences";
import { callGeminiWithFallback } from "../lib/geminiFallback";

export interface ChatResponse {
  reply: string;
  sources: string[];
}

/**
 * Optional context passed in when the user starts the chat from a specific
 * Learn card via the "Ask Coach about this concept" CTA. We use it for two
 * things: (a) to enrich the embedding query so retrieval is more focused on
 * the card's topic, and (b) to add a dedicated section to the prompt so
 * Gemini knows the user is anchoring on this concept.
 */
export interface CardContext {
  title: string;
  topic: string;
  keyFact: string;
}

export async function generateChatResponse(
  userMessage: string,
  cardContext?: CardContext,
): Promise<ChatResponse> {
  // 1. Build the embedding query. If we have a card context, fold its title
  // and key fact in so retrieval surfaces chunks closest to THIS concept,
  // not just whatever's in the freeform user message.
  const retrievalQuery = cardContext
    ? `${cardContext.title} — ${cardContext.topic}. ${cardContext.keyFact} ${userMessage}`
    : userMessage;

  const searchResults = await semanticSearch(retrievalQuery, 4);

  // 2. Build the context string
  const contextTexts = searchResults.map(r => `- ${r.text}`).join("\n");

  // 3. Optional anchor block when answering about a specific card
  const cardAnchorBlock = cardContext
    ? `\n### Concept Anchor (user is asking about this specific Learn card):
- Concept: ${cardContext.title} (${cardContext.topic})
- Key fact already shown to the user: ${cardContext.keyFact}

Keep your answer focused on this concept. Build on what they already saw — don't repeat the key fact verbatim, expand it with examples, common mistakes, or a "what to do next."\n`
    : "";

  // 4. Construct the RAG prompt for Gemini
  const prompt = `You are "FinScroll", a highly witty, modern, and empathetic digital financial wellness mentor designed specifically for Gen Z and younger audiences.
Your primary goal is to help users convert mindless screen doomscrolling into active wealth-building habits, master personal finance, understand compound interest, and avoid toxic retail trading hype or "get-rich-quick" finfluencer traps.

Guidelines:
- Speak in a natural, modern, engaging Gen-Z tone (use popular slang like "fr", "no cap", "bestie", "lowkey", "💀" naturally but keep it clean, highly professional, and grounded in real advice).
- Highlight the compound-interest opportunity cost of screen doomscrolling when appropriate (e.g. reminding them that early investing compounds massively!).
- Educate them on passive investing (ETFs/Index funds) and steady savings vs. emotional day trading or meme coin hypes.
- Keep your answers concise, highly actionable, engaging, and supportive.

Formatting rules (this is a chat bubble, not a document):
- Aim for 3-5 short paragraphs total — concise wins.
- Use **bold** sparingly to highlight 1-2 key terms per answer (no more).
- Use a bulleted list (- one per line) only when listing 3+ discrete items.
- DO NOT use markdown headings (no #, ##, ###). Lead each section with a short sentence instead.
- Prefer plain prose with strategic bold over heavy structure.

Use the following retrieved knowledge context from our database (sourced from SEC Investor.gov and Springer Economics) to ground your answer. If the context isn't highly relevant to their specific question, just give your best empathetic finance advice based on your general knowledge.
${cardAnchorBlock}
### Retrieved Knowledge Base Context:
${contextTexts || "No specific context found in database for this query."}

### User Message:
${userMessage}
`;

  // 5. Call Google Gemini API via the shared fallback ladder. Primary is
  // gemini-3-flash-preview; auto-falls back to 2.5-flash-lite then
  // 2.0-flash on quota exhaustion. maxOutputTokens stays at 2048 — the 3
  // preview model reserves part of the token budget for internal reasoning
  // and 800 tokens led to mid-sentence truncation.
  const { data } = await callGeminiWithFallback(
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    },
    config.googleGenAI.apiKey,
    { callerTag: "chat" },
  );

  const typedData = data as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  if (!typedData.candidates || typedData.candidates.length === 0) {
    console.error("Gemini Chat Error: no candidates in response", data);
    throw new Error("Failed to generate response: empty response from Gemini");
  }

  // Gemini can split the answer across multiple `parts` (thinking models
  // especially). Reading only `parts[0]` produced the truncated answers
  // we saw in the UI. Concatenate every text part for the full reply.
  const candidate = typedData.candidates[0];
  const parts: Array<{ text?: string }> = candidate?.content?.parts ?? [];
  const reply = parts
    .map((p) => p.text ?? "")
    .filter(Boolean)
    .join("")
    .trim();

  // Diagnostic — log if Gemini stopped for a non-natural reason so we can
  // see truncation root causes in Sentry/server logs.
  if (candidate.finishReason && candidate.finishReason !== "STOP") {
    console.warn(
      `Gemini chat finishReason=${candidate.finishReason} for query: ${userMessage.slice(0, 80)}`,
    );
  }

  // Build the displayable source list:
  //   1. Filter retrieval hits to a decent similarity score
  //   2. Dedupe by hostname so three URLs from investor.gov don't render
  //      as three "investor.gov" pills — keep the most-relevant URL per
  //      hostname (first occurrence in the score-sorted results).
  const seenHosts = new Set<string>();
  const sources: string[] = [];
  const pushUnique = (url: string) => {
    let host: string;
    try {
      host = new URL(url).hostname.replace(/^www\./, "");
    } catch {
      host = url;
    }
    if (seenHosts.has(host)) return;
    seenHosts.add(host);
    sources.push(url);
  };

  for (const r of searchResults) {
    if (r.score <= 0.2) continue;
    const url = r.metadata?.source as string | undefined;
    if (url) pushUnique(url);
  }

  // Augment with curated academic references. We do this when:
  //   • The user explicitly asked for academic/journal/research evidence, OR
  //   • The user's message + retrieved context touches a known topic
  // The Pinecone index is currently SEC-heavy; this fills the academic gap
  // promised by the "SEC & academic research" tagline without fabricating
  // a citation.
  const askedAcademic = userRequestedAcademic(userMessage);
  const academicPicks = pickAcademicReferences(
    userMessage,
    contextTexts,
    askedAcademic ? 2 : 1,
  );
  for (const ref of academicPicks) pushUnique(ref.url);

  return { reply, sources };
}
