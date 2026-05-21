import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SettingsView } from "@/components/SettingsView";

export default async function SettingsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="h-[calc(100dvh-5rem)] overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-5">
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
            Settings
          </h1>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Manage your account, password, and on-device data.
          </p>
        </div>
        <SettingsView userId={user.id} />
      </div>
    </div>
  );
}
