"use client";

import { useState } from "react";
import { Send, Loader2, Sparkles, BookOpen } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  sources?: string[];
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "init-1",
    role: "ai",
    text: "Yo! 👋 I'm your FinScroll finance companion, your personal antidote to toxic TikTok finfluencer hype. Ready to stop doomscrolling away your future compound wealth and ground your investing in real, elite economic science? Ask me anything!"
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { id: Date.now().toString(), role: "user", text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }
      
      const aiMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        text: data.data.reply,
        sources: data.data.sources
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (err: any) {
      const errorMessage: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        text: `Oops, something went wrong connecting to my brain. 🧠 (${err.message})` 
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-full mt-10 bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
      
      {/* Chat Header */}
      <div className="p-5 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <Sparkles className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="font-bold text-zinc-100">FinScroll FinLit Mentor</h3>
          <p className="text-xs text-zinc-400 font-medium tracking-wide">SEC & SPRINGER GROUNDED AI</p>
        </div>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start"}`}>
            <div className={`p-4 rounded-2xl ${
              msg.role === "user" 
                ? "bg-emerald-600 text-emerald-50 rounded-br-sm" 
                : "bg-zinc-800/80 text-zinc-200 border border-zinc-700/50 rounded-bl-sm"
            }`}>
              <p className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</p>
            </div>
            
            {/* Source Citations */}
            {msg.role === "ai" && msg.sources && msg.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2 px-1">
                {msg.sources.map((source, idx) => {
                  const isUrl = source.startsWith("http://") || source.startsWith("https://");
                  
                  return isUrl ? (
                    <a 
                      key={idx} 
                      href={source}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs font-medium text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20 hover:bg-sky-500/20 transition-colors"
                    >
                      <BookOpen className="w-3 h-3" />
                      {new URL(source).hostname.replace("www.", "")}
                    </a>
                  ) : (
                    <span key={idx} className="flex items-center gap-1.5 text-xs font-medium text-sky-400 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
                      <BookOpen className="w-3 h-3" />
                      Source: {source}
                    </span>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex max-w-[80%] mr-auto items-start">
             <div className="p-4 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 rounded-bl-sm flex gap-2">
                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
             </div>
          </div>
        )}
      </div>

      {/* Chat Input */}
      <div className="p-4 bg-zinc-900 border-t border-zinc-800">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="How does compounding interest help me build wealth?"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-full py-4 pl-6 pr-14 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all text-[15px]"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className="absolute right-2 w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-600 text-zinc-950 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-900"
          >
            {isTyping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
          </button>
        </form>
      </div>
      
    </div>
  );
}
