/**
 * Security and sanitization utilities.
 * Defends against: prompt injection, XSS, token exhaustion, path traversal.
 */

export function sanitizeInput(text: string): string {
  if (typeof text !== "string") return "";

  let s = text;

  // 1. Strip all HTML / XML tags and script content
  s = s.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
  s = s.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "");
  s = s.replace(/<[^>]*>?/gm, "");

  // 2. Decode common HTML entities to prevent double-encoding bypass
  s = s
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/");
  // Re-strip tags after entity decode
  s = s.replace(/<[^>]*>?/gm, "");

  // 3. Prompt injection patterns — extended list
  const injectionPatterns = [
    /ignore\s+(previous|all|above|prior)\s+(instructions?|prompts?|context|rules?)/gi,
    /forget\s+(all|everything|previous|prior|your|the)/gi,
    /system\s*prompt/gi,
    /bypass\s+(rules?|restrictions?|filters?|safety|guardrails?)/gi,
    /you\s+are\s+(now|a|an|the)\s+/gi,
    /act\s+as\s+(if\s+you\s+are|a|an|the)/gi,
    /new\s+(instructions?|directives?|rules?|context)/gi,
    /override\s+(instructions?|rules?|restrictions?)/gi,
    /reveal\s+(your|the)\s+(system|hidden|secret|base)\s+prompt/gi,
    /disregard\s+(previous|all|prior|your)/gi,
    /DAN\s+(mode|jailbreak)/gi,
    /developer\s+mode/gi,
    /jailbreak/gi,
    /do\s+anything\s+now/gi,
    /pretend\s+(you\s+are|to\s+be)/gi,
    /<\|im_start\|>/gi,
    /<\|im_end\|>/gi,
    /\[INST\]/gi,
    /\[\/INST\]/gi,
  ];

  for (const pattern of injectionPatterns) {
    s = s.replace(pattern, "[FILTERED]");
  }

  // 4. Path traversal — strip directory traversal sequences
  s = s.replace(/\.\.(\/|\\)/g, "");

  // 5. Null byte injection
  s = s.replace(/\x00/g, "");

  // 6. Token exhaustion — collapse any character repeated more than 15 times
  s = s.replace(/(.)\1{15,}/g, "$1$1$1");

  // 7. Remove non-printable control characters (except newline/tab/space)
  s = s.replace(/[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return s.trim();
}

export function sanitizeStringArray(inputs: string[]): string[] {
  return inputs.map(sanitizeInput).filter((str) => str.length > 0);
}
