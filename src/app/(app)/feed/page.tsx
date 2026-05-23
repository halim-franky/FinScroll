import { currentUser } from "@clerk/nextjs/server";
import { FinTokFeed } from "@/components/FinTokFeed";
import { OnboardingGate } from "@/components/OnboardingGate";

export default async function FeedPage() {
  const user = await currentUser();
  const uid = user?.id ?? "guest";

  return (
    <div className="h-full overflow-hidden">
      <OnboardingGate userId={uid}>
        <FinTokFeed userId={uid} />
      </OnboardingGate>
    </div>
  );
}
