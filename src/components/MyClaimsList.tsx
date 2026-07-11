"use client";

import { useState } from "react";
import { Copy, CheckCircle2, Gift, Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface ClaimLogItem {
  id: string;
  claimedAt: Date;
  giveaway: {
    id: string;
    title: string;
    description: string;
    code: string;
    claimUrl?: string | null;
  };
}

interface MyClaimsListProps {
  claims: ClaimLogItem[];
}

export default function MyClaimsList({ claims }: MyClaimsListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getRedeemUrl = (gw: { claimUrl?: string | null; code: string }) => {
    if (!gw.claimUrl) return null;
    return gw.claimUrl.replace("{code}", gw.code).replace("{key}", gw.code);
  };

  if (claims.length === 0) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border-white/5 flex flex-col gap-4 items-center">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-500">
          <Gift className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-white text-lg">No claimed loot yet</h3>
          <p className="text-zinc-500 text-sm mt-1 max-w-sm">
            Solve math puzzles and trivia quizzes on active giveaways to reveal and claim game codes!
          </p>
        </div>
        <Link
          href="/"
          className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-colors"
        >
          View Active Giveaways
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border-white/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase">
              <th className="py-4 px-6">Claimed At</th>
              <th className="py-4 px-6">Item</th>
              <th className="py-4 px-6">Description</th>
              <th className="py-4 px-6">Key Code</th>
              <th className="py-4 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {claims.map((claim) => (
              <tr key={claim.id} className="hover:bg-white/5 transition-colors">
                <td className="py-4 px-6 text-zinc-400 text-xs whitespace-nowrap">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-zinc-500" />
                    {new Date(claim.claimedAt).toLocaleString()}
                  </span>
                </td>
                <td className="py-4 px-6 font-bold text-white whitespace-nowrap">
                  {claim.giveaway.title}
                </td>
                <td className="py-4 px-6 text-zinc-400 text-xs max-w-xs truncate" title={claim.giveaway.description}>
                  {claim.giveaway.description}
                </td>
                <td className="py-4 px-6">
                  <span className="font-mono bg-black/40 border border-white/5 px-3 py-1.5 rounded-lg text-green-400 font-bold text-sm tracking-wider select-all">
                    {claim.giveaway.code}
                  </span>
                </td>
                <td className="py-4 px-6 text-right whitespace-nowrap">
                  <div className="flex justify-end items-center gap-2">
                    <button
                      onClick={() => handleCopy(claim.id, claim.giveaway.code)}
                      className="inline-flex items-center gap-1 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 hover:text-white text-xs px-3 py-1.5 rounded-lg transition-all"
                    >
                      {copiedId === claim.id ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> Copied
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Copy Key
                        </>
                      )}
                    </button>

                    {getRedeemUrl(claim.giveaway) && (
                      <a
                        href={getRedeemUrl(claim.giveaway)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600/35 border border-blue-500/30 text-blue-300 hover:text-blue-200 text-xs px-3 py-1.5 rounded-lg transition-all font-semibold"
                      >
                        Redeem
                      </a>
                    )}

                    <Link
                      href={`/claim/${claim.giveaway.id}`}
                      className="inline-flex items-center gap-1 text-zinc-500 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/5"
                      title="View Details"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
