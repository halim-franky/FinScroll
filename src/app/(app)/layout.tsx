import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { SessionNudge } from "@/components/SessionNudge";
import { CloudSync } from "@/components/CloudSync";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col max-w-md mx-auto relative">
      <CloudSync userId={userId} />
      <main className="flex-1 overflow-hidden pb-20">{children}</main>
      <BottomNav />
      <SessionNudge userId={userId} />
    </div>
  );
}
