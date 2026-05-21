import Link from "next/link";
import { currentUser } from "@clerk/nextjs/server";
import { Settings } from "lucide-react";
import { StatsView } from "@/components/StatsView";

export default async function StatsPage() {
  const user = await currentUser();
  return (
    <div className="h-[calc(100dvh-5rem)] overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
              Your Stats
            </h1>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              Track your streak, complete weekly challenges, and share your progress.
            </p>
          </div>
          <Link
            href="/settings"
            aria-label="Settings"
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:border-zinc-700 transition-colors"
          >
            <Settings className="w-4 h-4" />
          </Link>
        </div>
        <StatsView userId={user?.id ?? "guest"} />
      </div>
    </div>
  );
}
