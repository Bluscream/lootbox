import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getStats } from "@/app/actions";
import { Header } from "@/components/Header";
import AdminDashboard from "@/components/AdminDashboard";
import { redirect } from "next/navigation";
import { Shield } from "lucide-react";

export default async function AdminPage() {
  const session = await getSession();

  if (!session || !session.isAdmin) {
    redirect("/giveaway");
  }

  // Get initial stats and lists
  const stats = await getStats();
  
  const giveaways = await db.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { claims: true },
      },
    },
  });

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col gap-6">
        <AdminDashboard initialStats={stats} giveawaysList={giveaways} />
      </main>
    </div>
  );
}
