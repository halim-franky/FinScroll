import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LandingContent } from "@/components/LandingContent";

export default async function RootPage() {
  const { userId } = await auth();

  // Authenticated users go straight to the feed — no marketing page flash
  if (userId) redirect("/feed");

  return <LandingContent />;
}
