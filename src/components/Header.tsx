import Link from "next/link";
import { getSession } from "@/lib/session";
import { LogOut, ShieldAlert, Award, Gift } from "lucide-react";

export async function Header() {
  const session = await getSession();

  return (
    <header className="sticky top-0 z-50 w-full glass-panel border-b border-white/5 py-4 px-6 md:px-12 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          <Award className="w-6 h-6 text-blue-500" />
          LOOTBOX
        </Link>
      </div>

      <div className="flex items-center gap-4">
        {session ? (
          <div className="flex items-center gap-4">
            <Link
              href="/my-claims"
              className="flex items-center gap-1.5 text-sm bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/5 px-3.5 py-1.5 rounded-full transition-all"
            >
              <Gift className="w-3.5 h-3.5" />
              My Claims
            </Link>

            {session.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-1 text-sm bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/30 px-3.5 py-1.5 rounded-full transition-all"
              >
                <ShieldAlert className="w-4 h-4" />
                Admin Panel
              </Link>
            )}

            <div className="flex items-center gap-2">
              {session.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={session.avatar}
                  alt={session.username}
                  className="w-8 h-8 rounded-full border border-white/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  {session.username.substring(0, 2).toUpperCase()}
                </div>
              )}
              <span className="hidden md:inline text-sm font-medium text-zinc-300">
                {session.username}
              </span>
            </div>

            <Link
              href="/api/auth/logout"
              className="text-zinc-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/5"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/api/auth/discord"
              className="flex items-center gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors"
            >
              Discord Login
            </Link>
            <Link
              href="/api/auth/steam"
              className="flex items-center gap-2 bg-[#1b2838] hover:bg-[#2a475e] text-white text-xs font-semibold border border-white/10 px-4 py-2 rounded-lg transition-colors"
            >
              Steam Login
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
