import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AccountView } from "@/components/AccountView";

export default async function AccountPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-4 pt-6 pb-4">
        <div className="mb-5">
          <h1 className="text-2xl font-black text-zinc-50 tracking-tight">
            Account
          </h1>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
            Manage your profile, password, and on-device data.
          </p>
        </div>
        <AccountView userId={user.id} />
      </div>
    </div>
  );
}
