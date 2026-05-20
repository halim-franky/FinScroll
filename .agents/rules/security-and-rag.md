---
trigger: always_on
---

# FinScroll Engineering & Security Guardrails
- Core Stack: Next.js 15 (App Router), TypeScript, Tailwind CSS, Lucide React Icons.
- Design System: Premium minimalist dark SaaS theme. Background: Zinc-950. Accents: Emerald-500 or Sky-500.
- AI Logic: LangChain Core orchestration with Gemini 3 Flash. Truth grounding via a serverless Vector DB.
- Security Requirements: 
  1. Zero hardcoded secrets or keys. All access points must reference server-side `process.env`.
  2. Implement explicit string sanitization rules on incoming text arrays to mitigate Prompt Injection attacks.
  3. Set strict Cross-Origin Resource Sharing (CORS) policies on Next.js API endpoints.