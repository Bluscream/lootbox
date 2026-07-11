import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { Header } from "@/components/Header";
import Link from "next/link";
import { MarkdownText } from "@/components/MarkdownText";
import { PlatformIcon, getPlatformPreset } from "@/components/PlatformIcon";
import { Lock, Unlock, HelpCircle, ShieldAlert } from "lucide-react";
import { getClientIp } from "@/lib/ip";
import { hasActiveCooldown } from "@/lib/cooldown";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();
  const clientIp = await getClientIp();
  const resolvedParams = await searchParams;

  // Fetch all active giveaways
  const giveaways = await db.giveaway.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });

  // Check cooldowns
  let isLockedOut = false;
  let cooldownEnd: Date | null = null;

  if (session) {
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });
    if (user && hasActiveCooldown(user.cooldownUntil)) {
      isLockedOut = true;
      cooldownEnd = user.cooldownUntil;
    }
  }

  // Double check IP cooldown
  if (!isLockedOut) {
    const ipCooldown = await db.ipCooldown.findUnique({
      where: { ip: clientIp },
    });
    if (ipCooldown && hasActiveCooldown(ipCooldown.cooldownUntil)) {
      isLockedOut = true;
      cooldownEnd = ipCooldown.cooldownUntil;
    }
  }

  // Fetch claimed giveaways by this user or IP
  const userClaims = session
    ? await db.claimLog.findMany({
        where: {
          OR: [
            { userId: session.userId },
            { ipAddress: clientIp },
          ],
        },
      })
    : [];
  const claimedGiveawayIds = new Set(userClaims.map((c) => c.giveawayId));
  const visibleGiveaways = giveaways.filter((g) => !claimedGiveawayIds.has(g.id));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 flex flex-col gap-10">
        {/* Error notifications */}
        {resolvedParams.error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-300 p-4 rounded-xl text-sm">
            Warning: Authentication error: {resolvedParams.error}
          </div>
        )}



        {/* Giveaways Section */}
        <section className="flex flex-col gap-6">
          <h2 className="text-xl font-bold text-zinc-200">Active Giveaways</h2>
          {visibleGiveaways.length === 0 ? (
            <div className="glass-panel p-12 text-center rounded-2xl border-white/5">
              <p className="text-zinc-500">No active giveaways at this moment. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {visibleGiveaways.map((giveaway) => {
                 const dummyBlurStr = "✖✖✖✖✖-✖✖✖✖✖-✖✖✖✖✖";
                 const isClaimedByMe = claimedGiveawayIds.has(giveaway.id);
                 // Lock other cards if user is on cooldown and has not claimed this specific one
                 const showAsClaimed = isClaimedByMe || isLockedOut;
                 const platform = getPlatformPreset(giveaway.claimUrl);

                 return (
                   <div
                     key={giveaway.id}
                     className={`glow-card glass-panel rounded-2xl p-6 flex flex-col justify-between min-h-[220px] transition-all duration-300 ${
                       showAsClaimed && !isClaimedByMe ? "opacity-60" : ""
                     }`}
                   >
                     <div className="flex flex-col gap-2">
                       {platform && (
                         <div className="flex items-center gap-1 bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full w-max select-none">
                           <PlatformIcon type={platform.iconType} className="w-3 h-3" />
                           <span>{platform.name}</span>
                         </div>
                       )}
                       <div className="flex items-center justify-between">
                         <h3 className="font-bold text-lg text-white">{giveaway.title}</h3>
                        {!session ? (
                          <span className="text-xs text-zinc-500 flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" /> Login Required
                          </span>
                        ) : isClaimedByMe ? (
                          <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                            <Unlock className="w-3 h-3" /> Claimed
                          </span>
                        ) : isLockedOut ? (
                          <span className="text-xs text-zinc-500 flex items-center gap-1 bg-white/5 px-2 py-1 rounded">
                            <Lock className="w-3 h-3" /> Claimed
                          </span>
                        ) : (
                          <span className="text-xs text-green-400 flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded">
                            <Unlock className="w-3 h-3" /> Ready
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-400 line-clamp-3 leading-relaxed">
                        <MarkdownText text={giveaway.description} />
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 mt-6">
                      {/* Blurred out code field */}
                      <div className="bg-black/30 border border-white/5 px-4 py-2.5 rounded-xl flex items-center justify-between">
                        <span className="text-xs font-mono text-zinc-500 select-none tracking-wider">
                          CODE:
                        </span>
                        <span className="blur-code text-sm font-mono text-indigo-400 tracking-wider">
                          {dummyBlurStr.substring(0, Math.max(15, giveaway.code.length))}
                        </span>
                      </div>

                      {/* Action Button */}
                      {!session ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-800 text-zinc-500 border border-zinc-700 flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5" /> Log in to Claim
                        </button>
                      ) : isClaimedByMe ? (
                        <Link
                          href={`/claim/${giveaway.id}`}
                          className="w-full text-center py-2.5 rounded-xl text-xs font-bold bg-green-600/30 hover:bg-green-600/50 border border-green-500/30 text-green-300 flex items-center justify-center gap-2 transition-colors"
                        >
                          <Unlock className="w-3.5 h-3.5" /> View My Code
                        </Link>
                      ) : isLockedOut ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl text-xs font-bold bg-zinc-900 text-zinc-600 border border-white/5 flex items-center justify-center gap-2 cursor-not-allowed"
                        >
                          <Lock className="w-3.5 h-3.5" /> Claimed
                        </button>
                      ) : (
                        <Link
                          href={`/claim/${giveaway.id}`}
                          className="w-full text-center py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center gap-2 transition-colors shadow-lg shadow-blue-900/20"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Claim
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
