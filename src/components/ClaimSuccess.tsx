"use client";

import { useState } from "react";
import { CheckCircle2, Copy, Sparkles } from "lucide-react";
import Link from "next/link";
import { PlatformIcon, getPlatformPreset } from "./PlatformIcon";

interface ClaimSuccessProps {
  code: string;
  claimUrl?: string | null;
}

export default function ClaimSuccess({ code, claimUrl }: ClaimSuccessProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getRedeemUrl = () => {
    if (!claimUrl) return null;
    return claimUrl.replace("{code}", code).replace("{key}", code);
  };

  const redeemUrl = getRedeemUrl();

  return (
    <div className="glass-panel p-8 rounded-3xl border-green-500/20 shadow-xl shadow-green-950/20 max-w-lg w-full text-center flex flex-col gap-6 items-center">
      <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
        <Sparkles className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-2xl font-black text-white">Giveaway Claimed!</h2>
        <p className="text-sm text-zinc-400 mt-2">
          Here is your custom code. It has been saved to your account.
        </p>
      </div>

      <div className="w-full bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between mt-2">
        <span className="font-mono text-lg font-bold text-green-400 tracking-wider select-all">
          {code}
        </span>
        <button
          onClick={handleCopy}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Copy to clipboard"
        >
          {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
        </button>
      </div>

      {(() => {
        const platform = getPlatformPreset(claimUrl);
        let buttonStyle = "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20";
        let buttonText = "Redeem Key Directly";
        if (platform) {
          buttonText = `Redeem on ${platform.name}`;
          if (platform.iconType === "steam") {
            buttonStyle = "bg-[#1b2838] hover:bg-[#2a475e] border border-[#66c0f4]/20 text-[#66c0f4] shadow-lg shadow-black/40";
          } else if (platform.iconType === "discord") {
            buttonStyle = "bg-[#5865F2] hover:bg-[#4752C4] text-white shadow-lg shadow-[#5865F2]/20";
          } else if (platform.iconType === "epic") {
            buttonStyle = "bg-[#121212] hover:bg-[#202020] border border-zinc-800 text-white shadow-lg shadow-black/40";
          } else if (platform.iconType === "gog") {
            buttonStyle = "bg-[#5c2d91] hover:bg-[#723fa3] text-white shadow-lg shadow-[#5c2d91]/20";
          } else if (platform.iconType === "battle") {
            buttonStyle = "bg-[#00aeff] hover:bg-[#0092d6] text-white shadow-lg shadow-[#00aeff]/20";
          } else if (platform.iconType === "ea") {
            buttonStyle = "bg-[#ff4747] hover:bg-[#e03b3b] text-white shadow-lg shadow-[#ff4747]/20";
          }
        }

        return redeemUrl ? (
          <a
            href={redeemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${buttonStyle}`}
          >
            {platform && <PlatformIcon type={platform.iconType} className="w-4 h-4" />}
            <span>{buttonText}</span>
          </a>
        ) : null;
      })()}

      <div className="text-xs text-zinc-500 max-w-xs leading-relaxed">
        Please copy this key now.
      </div>

      <Link
        href="/"
        className="mt-4 px-6 py-2 rounded-xl text-sm font-semibold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
      >
        Return to Giveaways
      </Link>
    </div>
  );
}
