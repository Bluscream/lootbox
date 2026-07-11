"use client";

import { useEffect, useState, useRef } from "react";
import { claimGiveaway } from "@/app/actions";
import { CheckCircle2, Copy, RefreshCw, HelpCircle, ArrowLeft, Loader2, Sparkles } from "lucide-react";
import Link from "next/link";
import { MarkdownText } from "./MarkdownText";
import { PlatformIcon, getPlatformPreset } from "./PlatformIcon";

interface ClaimFormProps {
  giveaway: {
    id: string;
    title: string;
    description: string;
    captchaRequired: boolean;
    mathRequired: boolean;
    quizQuestion: string | null;
    quizOptions: string | null; // JSON string
    claimUrl?: string | null;
  };
  turnstileSiteKey: string;
}

function getBrowserFingerprint(): string {
  if (typeof window === "undefined") return "";
  const components = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    Intl.DateTimeFormat().resolvedOptions().timeZone,
  ];
  const input = components.join("|");
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return (hash >>> 0).toString(16);
}



export default function ClaimForm({ giveaway, turnstileSiteKey }: ClaimFormProps) {
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [mathQuestion, setMathQuestion] = useState<{ str: string; ans: number }>({ str: "", ans: 0 });
  const [userMathAnswer, setUserMathAnswer] = useState<string>("");
  const [quizAnswer, setQuizAnswer] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [revealedCode, setRevealedCode] = useState<string | null>(null);

  const turnstileRef = useRef<HTMLDivElement>(null);

  // Generate random math question
  const generateMath = () => {
    const ops = ["+", "-", "*"];
    const op = ops[Math.floor(Math.random() * ops.length)];
    let n1 = Math.floor(Math.random() * 12) + 1;
    let n2 = Math.floor(Math.random() * 12) + 1;

    // ensure positive subtraction
    if (op === "-" && n1 < n2) {
      const temp = n1;
      n1 = n2;
      n2 = temp;
    }

    let ans = 0;
    if (op === "+") ans = n1 + n2;
    else if (op === "-") ans = n1 - n2;
    else if (op === "*") ans = n1 * n2;

    setMathQuestion({
      str: `${n1} ${op} ${n2}`,
      ans,
    });
  };

  useEffect(() => {
    if (giveaway.mathRequired) {
      generateMath();
    }
  }, [giveaway.mathRequired]);

  // Load and initialize Cloudflare Turnstile
  useEffect(() => {
    if (giveaway.captchaRequired) {
      // Create global callback
      (window as any).onloadTurnstileCallback = () => {
        if ((window as any).turnstile) {
          (window as any).turnstile.render(turnstileRef.current, {
            sitekey: turnstileSiteKey || "1x00000000000000000000AA", // Cloudflare test key (always passes)
            callback: (token: string) => {
              setCaptchaToken(token);
            },
          });
        }
      };

      // Check if already loaded
      if (document.getElementById("turnstile-script")) {
        if ((window as any).turnstile && turnstileRef.current) {
          try {
            (window as any).turnstile.render(turnstileRef.current, {
              sitekey: turnstileSiteKey || "1x00000000000000000000AA",
              callback: (token: string) => {
                setCaptchaToken(token);
              },
            });
          } catch (e) {
            // Already rendered or other minor issue
          }
        }
        return;
      }

      const script = document.createElement("script");
      script.id = "turnstile-script";
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, [giveaway.captchaRequired, turnstileSiteKey]);

  // Parse options
  let optionsList: string[] = [];
  if (giveaway.quizOptions) {
    try {
      optionsList = JSON.parse(giveaway.quizOptions);
    } catch (e) {
      // fallback
    }
  }

  const handleCopy = () => {
    if (revealedCode) {
      navigator.clipboard.writeText(revealedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Basic Validation
    if (giveaway.captchaRequired && !captchaToken && turnstileSiteKey) {
      setError("Please complete the CAPTCHA.");
      setLoading(false);
      return;
    }

    if (giveaway.mathRequired && userMathAnswer.trim() === "") {
      setError("Please answer the math puzzle.");
      setLoading(false);
      return;
    }

    if (giveaway.quizQuestion && quizAnswer.trim() === "") {
      setError("Please answer the quiz question.");
      setLoading(false);
      return;
    }

    // Call API
    try {
      const fingerprint = getBrowserFingerprint();
      const res = await claimGiveaway(
        giveaway.id,
        captchaToken || "mock-captcha-token",
        parseInt(userMathAnswer) || 0,
        mathQuestion.str,
        quizAnswer,
        fingerprint
      );

      if (res.success && res.code) {
        setRevealedCode(res.code);
      } else {
        setError(res.error || "Claim failed.");
        if (giveaway.mathRequired) generateMath(); // reset math on fail
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getRedeemUrl = () => {
    if (!giveaway.claimUrl) return null;
    return giveaway.claimUrl.replace("{code}", revealedCode).replace("{key}", revealedCode);
  };

  if (revealedCode) {
    const redeemUrl = getRedeemUrl();
    const platform = getPlatformPreset(giveaway.claimUrl);

    // Get brand styling configs
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

    return (
      <div className="glass-panel p-8 rounded-3xl border-green-500/20 shadow-xl shadow-green-950/20 max-w-lg w-full text-center flex flex-col gap-6 items-center">
        <div className="w-16 h-16 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center">
          <Sparkles className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">Verification Complete!</h2>
          <p className="text-sm text-zinc-400 mt-2">
            Your custom key has been generated and unlocked successfully.
          </p>
        </div>

        <div className="w-full bg-black/40 border border-white/5 p-4 rounded-xl flex items-center justify-between mt-2">
          <span className="font-mono text-lg font-bold text-green-400 tracking-wider select-all">
            {revealedCode}
          </span>
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
          </button>
        </div>

        {redeemUrl && (
          <a
            href={redeemUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`w-full py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${buttonStyle}`}
          >
            {platform && <PlatformIcon type={platform.iconType} className="w-4 h-4" />}
            <span>{buttonText}</span>
          </a>
        )}

        <div className="text-xs text-zinc-500 max-w-xs leading-relaxed">
          Please copy this key now. Due to the 24-hour claim limitation, you won't be able to request details or new codes from this account or IP for 24 hours.
        </div>

        <Link
          href="/"
          className="mt-2 w-full text-center py-2.5 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-white transition-colors"
        >
          Return to Giveaways
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-panel p-8 rounded-3xl border-white/5 max-w-xl w-full flex flex-col gap-6">
      <div>
        <Link
          href="/giveaway"
          className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to list
        </Link>
        {(() => {
          const platform = getPlatformPreset(giveaway.claimUrl);
          return platform ? (
            <div className="flex items-center gap-1 bg-white/5 border border-white/10 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full w-max select-none mb-3">
              <PlatformIcon type={platform.iconType} className="w-3 h-3" />
              <span>{platform.name}</span>
            </div>
          ) : null;
        })()}
        <h2 className="text-2xl font-black text-white">{giveaway.title}</h2>
        <div className="text-sm text-zinc-400 mt-2 leading-relaxed">
          <MarkdownText text={giveaway.description} />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* 1. Turnstile CAPTCHA */}
        {giveaway.captchaRequired && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Step 1: Identity Verification
            </label>
            <div className="border border-white/5 bg-black/20 p-4 rounded-2xl flex justify-center">
              <div ref={turnstileRef}></div>
            </div>
          </div>
        )}

        {/* 2. Math Puzzle */}
        {giveaway.mathRequired && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                Step 2: Math Puzzle
              </label>
              <button
                type="button"
                onClick={generateMath}
                className="text-zinc-500 hover:text-white transition-colors p-1"
                title="Refresh Math Question"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="border border-white/5 bg-black/20 p-5 rounded-2xl flex flex-col md:flex-row items-center gap-4">
              <span className="font-mono text-lg font-bold text-zinc-300">
                Solve: {mathQuestion.str} =
              </span>
              <input
                type="number"
                value={userMathAnswer}
                onChange={(e) => setUserMathAnswer(e.target.value)}
                placeholder="Answer"
                className="flex-1 w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-white font-mono placeholder-zinc-600 focus:outline-none focus:border-blue-500 text-center md:text-left"
              />
            </div>
          </div>
        )}

        {/* 3. Quiz Trivia */}
        {giveaway.quizQuestion && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              Step 3: Trivia Quiz <HelpCircle className="w-3.5 h-3.5 text-zinc-500" />
            </label>
            <div className="border border-white/5 bg-black/20 p-5 rounded-2xl flex flex-col gap-4">
              <p className="text-sm text-zinc-300 font-medium">{giveaway.quizQuestion}</p>

              {optionsList.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {optionsList.map((opt, idx) => (
                    <label
                      key={idx}
                      className={`flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-zinc-900/50 hover:bg-zinc-800/50 cursor-pointer transition-all ${
                        quizAnswer === opt ? "border-blue-500 bg-blue-500/5 text-blue-300" : "text-zinc-400"
                      }`}
                    >
                      <input
                        type="radio"
                        name="quiz"
                        value={opt}
                        checked={quizAnswer === opt}
                        onChange={() => setQuizAnswer(opt)}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          quizAnswer === opt ? "border-blue-500" : "border-zinc-600"
                        }`}
                      >
                        {quizAnswer === opt && <div className="w-2 h-2 rounded-full bg-blue-500" />}
                      </div>
                      <span className="text-sm font-medium">{opt}</span>
                    </label>
                  ))}
                </div>
              ) : (
                <input
                  type="text"
                  value={quizAnswer}
                  onChange={(e) => setQuizAnswer(e.target.value)}
                  placeholder="Your Answer"
                  className="w-full bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Verifying Puzzles...
            </>
          ) : (
            "Verify & Reveal Code"
          )}
        </button>
      </form>
    </div>
  );
}
