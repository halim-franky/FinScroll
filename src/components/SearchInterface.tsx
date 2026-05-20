"use client";

import { useState } from "react";
import { Search, Loader2 } from "lucide-react";

interface SearchResult {
  text: string;
  score: number;
  metadata: Record<string, any>;
}

export function SearchInterface() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, limit: 3 }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to search");
      }
      
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="w-full space-y-6 mt-10">
      {/* Search Input */}
      <form onSubmit={handleSearch} className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question or search semantically..."
          className="w-full pl-12 pr-4 py-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all shadow-inner text-lg"
          disabled={isSearching}
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="absolute inset-y-2 right-2 px-6 bg-emerald-500 hover:bg-emerald-400 disabled:bg-zinc-800 disabled:text-zinc-500 text-zinc-950 font-bold rounded-xl transition-colors flex items-center"
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : "Search"}
        </button>
      </form>

      {/* Results Area */}
      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl">
          {error}
        </div>
      )}

      {hasSearched && !isSearching && !error && results.length === 0 && (
        <div className="p-8 text-center text-zinc-500 bg-zinc-900/30 border border-zinc-800/50 rounded-2xl">
          No relevant documents found.
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-zinc-300 mb-4 px-1">Top Matches</h3>
          <div className="grid grid-cols-1 gap-4">
            {results.map((result, index) => (
              <div 
                key={index} 
                className="p-6 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-zinc-700 transition-colors flex flex-col gap-3"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                      Match {index + 1}
                    </span>
                    {result.metadata.source && (
                      <span className="text-xs text-zinc-500 font-medium px-2 py-1 bg-zinc-950 rounded-md border border-zinc-800">
                        {result.metadata.source}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 font-mono font-medium bg-zinc-950 px-2 py-1 rounded border border-zinc-800">
                    Score: {(result.score * 100).toFixed(1)}%
                  </div>
                </div>
                <p className="text-zinc-300 leading-relaxed text-sm md:text-base mt-2">
                  {result.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
