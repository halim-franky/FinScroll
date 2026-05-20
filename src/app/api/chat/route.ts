import { NextResponse } from "next/server";
import { z } from "zod";
import { generateChatResponse } from "@/services/chat";
import { rateLimit, getClientIp } from "@/lib/rateLimit";

const chatSchema = z.object({
  message: z
    .string()
    .min(1, "Message cannot be empty")
    .max(1000, "Message is too long"),
});

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const { allowed, remaining, resetIn } = rateLimit(`chat:${ip}`, 20, 60_000);

  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil(resetIn / 1000)),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    // Invalid JSON — return 400, never leak the raw parse error
    return NextResponse.json(
      { error: "Invalid JSON in request body." },
      { status: 400 }
    );
  }

  try {
    const { message } = chatSchema.parse(body);
    const response = await generateChatResponse(message);

    return NextResponse.json(
      { success: true, data: response },
      { headers: { "X-RateLimit-Remaining": String(remaining) } }
    );
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request payload", details: error.issues },
        { status: 400 }
      );
    }
    // Never expose internal error details to the client
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Failed to generate a response. Please try again." },
      { status: 500 }
    );
  }
}
