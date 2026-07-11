import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { Header } from "@/components/Header";
import MyClaimsList from "@/components/MyClaimsList";
import { redirect } from "next/navigation";
import { Gift } from "lucide-react";

export default async function MyClaimsPage() {
  const session = await getSession();

  if (!session) {
    redirect("/");
  }

  // Fetch claimed logs for the current user
  const claims = await db.claimLog.findMany({
    where: {
      userId: session.userId,
    },
    orderBy: {
      claimedAt: "desc",
    },
    include: {
      giveaway: true,
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white">My Claimed Keys</h1>
            <p className="text-xs text-zinc-400">View and copy your previously unlocked code keys.</p>
          </div>
        </div>

        <MyClaimsList claims={claims} />
      </main>
    </div>
  );
}
