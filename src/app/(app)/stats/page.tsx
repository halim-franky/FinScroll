import { currentUser } from "@clerk/nextjs/server";
import { StatsView } from "@/components/StatsView";

export default async function StatsPage() {
  const user = await currentUser();
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-5">
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
            Your Stats
          </h1>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Track your streak, complete weekly challenges, and share your progress.
          </p>
        </div>
        <StatsView userId={user?.id ?? "guest"} />
      </div>
    </div>
  );
}
