import { ChatInterface } from "@/components/ChatInterface";

export default function ChatPage() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="px-4 pt-6 pb-3 shrink-0">
        <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
          AI Finance Coach
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Grounded in SEC & Springer Nature research. Powered by Google Gemini.
        </p>
      </div>
      <div className="flex-1 overflow-hidden px-4 pb-4">
        <ChatInterface />
      </div>
    </div>
  );
}
