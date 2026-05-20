import { FinfluencerRoast } from "@/components/FinfluencerRoast";

export default function RoastPage() {
  return (
    <div className="h-[calc(100dvh-5rem)] overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-5">
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight flex items-center gap-2">
            🔥 Finfluencer Roast
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Paste any viral financial claim. AI obliterates it with SEC data.
          </p>
        </div>
        <FinfluencerRoast />
      </div>
    </div>
  );
}
