import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Header } from "@/components/Header";
import ClaimForm from "@/components/ClaimForm";
import ClaimSuccess from "@/components/ClaimSuccess";
import { redirect } from "next/navigation";
import { Lock, Clock } from "lucide-react";
import { getClientIp } from "@/lib/ip";
import { hasActiveCooldown } from "@/lib/cooldown";

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) {
    redirect("/");
  }

  const { id } = await params;
  const clientIp = await getClientIp();

  // Fetch giveaway
  const giveaway = await db.giveaway.findUnique({
    where: { id },
  });

  if (!giveaway || !giveaway.active) {
    redirect("/");
  }

  // Check if this specific user or IP already claimed this giveaway
  const claim = await db.claimLog.findFirst({
    where: {
      OR: [
        { userId: session.userId, giveawayId: id },
        { ipAddress: clientIp, giveawayId: id },
      ],
    },
  });

  // Check user cooldown
  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  const now = new Date();
  let cooldownEnd: Date | null = null;
  let isLockedOut = false;

  // Only enforce lockout if the user hasn't already claimed this giveaway
  if (!claim) {
    if (user && hasActiveCooldown(user.cooldownUntil)) {
      isLockedOut = true;
      cooldownEnd = user.cooldownUntil;
    }

    // Check IP cooldown
    if (!isLockedOut) {
      const ipCooldown = await db.ipCooldown.findUnique({
        where: { ip: clientIp },
      });
      if (ipCooldown && hasActiveCooldown(ipCooldown.cooldownUntil)) {
        isLockedOut = true;
        cooldownEnd = ipCooldown.cooldownUntil;
      }
    }
  }

  const turnstileSiteKey = process.env.TURNSTILE_SITE_KEY || "1x00000000000000000000AA";

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        {claim ? (
          <ClaimSuccess code={giveaway.code} claimUrl={giveaway.claimUrl} />
        ) : isLockedOut && cooldownEnd ? (
          <div className="glass-panel p-8 rounded-3xl border-red-500/20 shadow-xl shadow-red-950/10 max-w-md w-full text-center flex flex-col gap-6 items-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Giveaway Ended</h2>
              <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                This loot key has already been claimed by another user! Puzzles for this drop are closed.
              </p>
            </div>

            <Link
              href="/"
              className="mt-2 w-full text-center py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
            >
              Return to Giveaways
            </Link>
          </div>
        ) : (
          <ClaimForm giveaway={giveaway} turnstileSiteKey={turnstileSiteKey} />
        )}
      </main>
    </div>
  );
}
