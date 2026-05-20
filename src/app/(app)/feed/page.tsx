import { currentUser } from "@clerk/nextjs/server";
import { FinTokFeed } from "@/components/FinTokFeed";

export default async function FeedPage() {
  const user = await currentUser();
  return (
    <div className="h-[100dvh] overflow-hidden">
      <FinTokFeed userId={user?.id ?? "guest"} />
    </div>
  );
}
