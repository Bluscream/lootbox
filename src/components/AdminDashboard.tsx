"use client";

import { useState, useEffect } from "react";
import { hasActiveCooldown } from "@/lib/cooldown";
import {
  createGiveaway,
  updateGiveaway,
  deleteGiveaway,
  resetCooldown,
  toggleAdminRole,
  deleteUser,
  clearUserClaims,
} from "@/app/actions";
import {
  Plus,
  Trash2,
  Edit3,
  RefreshCw,
  Users,
  Gift,
  History,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Shield,
  Loader2,
  AlertTriangle,
} from "lucide-react";

interface PlatformPreset {
  name: string;
  claimUrl: string;
  maxClaims: number;
  placeholder: string;
  regex?: RegExp;
  validationError?: string;
}

const PRESETS: Record<string, PlatformPreset> = {
  steam: {
    name: "Steam Key",
    claimUrl: "https://store.steampowered.com/account/registerkey?key={code}",
    maxClaims: 1,
    placeholder: "e.g. ABCDE-FGHJI-KLMNO",
    regex: /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}(-[A-Z0-9]{5})*$/i,
    validationError: "Steam keys usually follow XXXXX-XXXXX-XXXXX format."
  },
  gog: {
    name: "GOG Code",
    claimUrl: "https://www.gog.com/redeem/{code}",
    maxClaims: 1,
    placeholder: "e.g. ABCDE12345FGHIJ987",
    regex: /^[a-z0-9]{18,20}$/i,
    validationError: "GOG codes are usually 18-20 alphanumeric characters."
  },
  epic: {
    name: "Epic Games Key",
    claimUrl: "https://www.epicgames.com/redeem?code={code}",
    maxClaims: 1,
    placeholder: "e.g. ABCD-EFGH-IJKL-MNOP",
    regex: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i,
    validationError: "Epic Games keys usually follow XXXX-XXXX-XXXX-XXXX format."
  },
  discord: {
    name: "Discord Gift Link / Code",
    claimUrl: "https://discord.com/billing/promotions/{code}",
    maxClaims: 1,
    placeholder: "e.g. discord.gift/XXXXXXXXXXXX or XXXXXXXXXXXXXXXX",
    regex: /^([A-Za-z0-9]{16,24}|(https?:\/\/)?(www\.)?discord(app)?\.gift\/[A-Za-z0-9]{16,24})$/,
    validationError: "Discord promo codes/gifts are usually 16 or 24 alphanumeric characters."
  },
  battle: {
    name: "Battle.Net Code",
    claimUrl: "https://battle.net/shop/checkout/key-claim",
    maxClaims: 1,
    placeholder: "e.g. XXXX-XXXX-XXXX-XXXX-XXXX",
    regex: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}(-[A-Z0-9]{4})*$/i,
    validationError: "Battle.net keys usually follow XXXX-XXXX-XXXX-XXXX-XXXX format."
  },
  ea: {
    name: "EA Desktop Product Code",
    claimUrl: "https://myaccount.ea.com/cp-ui/redemption/index",
    maxClaims: 1,
    placeholder: "e.g. XXXX-XXXX-XXXX-XXXX",
    regex: /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/i,
    validationError: "EA codes usually follow XXXX-XXXX-XXXX-XXXX format."
  }
};

interface AdminDashboardProps {
  initialStats: {
    totalUsers: number;
    totalGiveaways: number;
    totalClaims: number;
    claimLogs: any[];
    users: any[];
  };
  giveawaysList: any[];
}

export default function AdminDashboard({ initialStats, giveawaysList }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"giveaways" | "users" | "logs">("giveaways");

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash === "users" || hash === "logs" || hash === "giveaways") {
        setActiveTab(hash);
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const changeTab = (tab: "giveaways" | "users" | "logs") => {
    setActiveTab(tab);
    window.location.hash = tab;
  };

  const [giveaways, setGiveaways] = useState<any[]>(giveawaysList);
  const [users, setUsers] = useState<any[]>(initialStats.users);
  const [logs, setLogs] = useState<any[]>(initialStats.claimLogs);
  const [stats, setStats] = useState({
    totalUsers: initialStats.totalUsers,
    totalGiveaways: initialStats.totalGiveaways,
    totalClaims: initialStats.totalClaims,
  });

  // Modal / Form state
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [active, setActive] = useState(true);
  const [captchaRequired, setCaptchaRequired] = useState(true);
  const [mathRequired, setMathRequired] = useState(true);
  const [quizQuestion, setQuizQuestion] = useState("");
  const [quizOptions, setQuizOptions] = useState(""); // JSON or comma list
  const [quizAnswer, setQuizAnswer] = useState("");
  const [maxClaims, setMaxClaims] = useState<number>(1);
  const [claimUrl, setClaimUrl] = useState("");
  const [selectedPresetKey, setSelectedPresetKey] = useState("");

  // Toast & Confirm Modal states
  interface Toast {
    id: string;
    message: string;
    type: "success" | "error" | "info";
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: "success" | "error" | "info" = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  interface ConfirmModalState {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDestructive?: boolean;
    onConfirm: () => void | Promise<void>;
  }
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  const triggerConfirm = (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    confirmText = "Confirm",
    isDestructive = false
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      confirmText,
      isDestructive,
      onConfirm: async () => {
        try {
          await onConfirm();
        } catch (err: any) {
          showToast(err.message || "Action failed", "error");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setCode("");
    setActive(true);
    setMaxClaims(1);
    setClaimUrl("");
    setSelectedPresetKey("");
    setCaptchaRequired(true);
    setMathRequired(true);
    setQuizQuestion("");
    setQuizOptions("");
    setQuizAnswer("");
    setEditingId(null);
    setIsEditing(false);
  };

  const handleEdit = (gw: any) => {
    setEditingId(gw.id);
    setTitle(gw.title);
    setDescription(gw.description);
    setCode(gw.code);
    setActive(gw.active);
    setMaxClaims(gw.maxClaims || 1);
    setClaimUrl(gw.claimUrl || "");
    const matchedKey = Object.keys(PRESETS).find(key => PRESETS[key].claimUrl === gw.claimUrl) || "";
    setSelectedPresetKey(matchedKey);
    setCaptchaRequired(gw.captchaRequired);
    setMathRequired(gw.mathRequired);
    setQuizQuestion(gw.quizQuestion || "");
    setQuizOptions(gw.quizOptions ? JSON.stringify(JSON.parse(gw.quizOptions)) : "");
    setQuizAnswer(gw.quizAnswer || "");
    setIsEditing(true);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Validate options JSON if present
    let formattedOptions = null;
    if (quizOptions.trim()) {
      try {
        const parsed = JSON.parse(quizOptions);
        if (!Array.isArray(parsed)) {
          throw new Error("Must be a JSON array");
        }
        formattedOptions = JSON.stringify(parsed);
      } catch (err) {
        setMessage({
          text: "Quiz Options must be a valid JSON array of strings, e.g. [\"Opt A\", \"Opt B\"]",
          type: "error",
        });
        setLoading(false);
        return;
      }
    }

    // Validate code pattern based on selected preset
    if (selectedPresetKey && PRESETS[selectedPresetKey]) {
      const preset = PRESETS[selectedPresetKey];
      if (preset.regex && !preset.regex.test(code.trim())) {
        setMessage({
          text: preset.validationError || "Invalid code format for the selected platform.",
          type: "error",
        });
        setLoading(false);
        return;
      }
    }

    try {
      if (editingId) {
        // Update
        const updated = await updateGiveaway(editingId, {
          title,
          description,
          code,
          active,
          maxClaims,
          claimUrl: claimUrl || undefined,
          captchaRequired,
          mathRequired,
          quizQuestion: quizQuestion || undefined,
          quizOptions: formattedOptions || undefined,
          quizAnswer: quizAnswer || undefined,
        });
        setGiveaways((prev) => prev.map((g) => (g.id === editingId ? { ...updated, _count: g._count } : g)));
        setMessage({ text: "Giveaway updated successfully!", type: "success" });
      } else {
        // Create
        const created = await createGiveaway({
          title,
          description,
          code,
          active,
          maxClaims,
          claimUrl: claimUrl || undefined,
          captchaRequired,
          mathRequired,
          quizQuestion: quizQuestion || undefined,
          quizOptions: formattedOptions || undefined,
          quizAnswer: quizAnswer || undefined,
        });
        setGiveaways((prev) => [{ ...created, _count: { claims: 0 } }, ...prev]);
        setStats((prev) => ({ ...prev, totalGiveaways: prev.totalGiveaways + 1 }));
        setMessage({ text: "Giveaway created successfully!", type: "success" });
      }
      resetForm();
    } catch (err: any) {
      setMessage({ text: err.message || "Operation failed", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    triggerConfirm(
      "Delete Giveaway",
      "Are you sure you want to delete this giveaway?",
      async () => {
        await deleteGiveaway(id);
        setGiveaways((prev) => prev.filter((g) => g.id !== id));
        setStats((prev) => ({ ...prev, totalGiveaways: prev.totalGiveaways - 1 }));
        showToast("Giveaway deleted successfully!", "success");
      },
      "Delete",
      true
    );
  };

  const handleResetCooldown = (userId: string) => {
    triggerConfirm(
      "Reset Cooldown",
      "Are you sure you want to reset the 24-hour cooldown for this user and their associated IP?",
      async () => {
        await resetCooldown(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, cooldownUntil: null, lastIp: null } : u))
        );
        showToast("Cooldown reset successfully for this user and their associated IP!", "success");
      },
      "Reset Cooldown"
    );
  };

  const handleToggleAdmin = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    const actionName = targetUser?.isAdmin ? "demote" : "promote";
    triggerConfirm(
      `${targetUser?.isAdmin ? "Demote" : "Promote"} User`,
      `Are you sure you want to ${actionName} this user?`,
      async () => {
        const updated = await toggleAdminRole(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, isAdmin: updated.isAdmin } : u))
        );
        showToast(`User successfully ${targetUser?.isAdmin ? "demoted" : "promoted"}!`, "success");
      },
      targetUser?.isAdmin ? "Demote" : "Promote",
      targetUser?.isAdmin
    );
  };

  const handleDeleteUser = (userId: string) => {
    triggerConfirm(
      "Delete User Profile",
      "Are you sure you want to permanently delete this user? All their claims history will be deleted.",
      async () => {
        await deleteUser(userId);
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setStats((prev) => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        showToast("User profile and claims history permanently deleted.", "success");
      },
      "Delete User",
      true
    );
  };

  const handleClearUserClaims = (userId: string) => {
    triggerConfirm(
      "Clear Claims & Cooldowns",
      "Are you sure you want to clear this user's claim history and active cooldowns?",
      async () => {
        await clearUserClaims(userId);
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, cooldownUntil: null, lastIp: null } : u))
        );
        showToast("User claim history and cooldowns cleared successfully!", "success");
      },
      "Clear History"
    );
  };

  return (
    <div className="flex flex-col gap-8">
      {/* Security & Giveaway Control Header & Badges */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
          <Shield className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-black text-white">Security & Giveaway Control</h1>
            <div className="flex items-center gap-1.5 text-[10px] font-bold select-none">
              <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                Giveaways: {stats.totalGiveaways}
              </span>
              <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                Users: {stats.totalUsers}
              </span>
              <span className="bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full border border-white/5 whitespace-nowrap">
                Claimed: {stats.totalClaims}
              </span>
            </div>
          </div>
          <p className="text-xs text-zinc-400 mt-1">Manage loot distribution parameters, claims, and account lockout configurations.</p>
        </div>
      </div>

      {/* Tabs Control */}
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => changeTab("giveaways")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "giveaways" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Manage Giveaways
        </button>
        <button
          onClick={() => changeTab("users")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "users" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Users & Cooldowns
        </button>
        <button
          onClick={() => changeTab("logs")}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "logs" ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
          }`}
        >
          Claims Log
        </button>
      </div>

      {/* Giveaways Tab */}
      {activeTab === "giveaways" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Create / Edit Form */}
          <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col gap-6 lg:col-span-1">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-500" />
              {editingId ? "Edit Giveaway" : "Create Giveaway"}
            </h3>

            {message && (
              <div
                className={`p-4 rounded-xl text-xs border ${
                  message.type === "success"
                    ? "bg-green-500/10 border-green-500/20 text-green-400"
                    : "bg-red-500/10 border-red-500/20 text-red-400"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Redeem Preset</label>
                <select
                  value={selectedPresetKey}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedPresetKey(val);
                    if (val && PRESETS[val]) {
                      const preset = PRESETS[val];
                      setClaimUrl(preset.claimUrl);
                      setMaxClaims(preset.maxClaims);
                    }
                  }}
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="">Custom (No Preset)</option>
                  <option value="steam">Steam Key</option>
                  <option value="gog">GOG Code</option>
                  <option value="epic">Epic Games Key</option>
                  <option value="discord">Discord Gift / Promo</option>
                  <option value="battle">Battle.Net Key</option>
                  <option value="ea">EA Product Code</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Steam Key: Portal 2"
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Description</label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Giveaway info..."
                  rows={3}
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase">Loot Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder={
                    selectedPresetKey && PRESETS[selectedPresetKey]
                      ? PRESETS[selectedPresetKey].placeholder
                      : "e.g. XXXXX-XXXXX-XXXXX"
                  }
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between">
                  <span>Redeem URL (Optional)</span>
                  <span className="text-[9px] text-zinc-400 font-normal normal-case">Supports {"{code}"} template</span>
                </label>
                <input
                  type="text"
                  value={claimUrl}
                  onChange={(e) => setClaimUrl(e.target.value)}
                  placeholder="Redemption link e.g. https://..."
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase flex items-center justify-between">
                  <span>How Often (Max Claims)</span>
                  <span className="text-[9px] text-zinc-400 font-normal normal-case bg-white/5 px-2 py-0.5 rounded" title="How many times this code can be claimed across all users before running out.">
                    Can be claimed multiple times
                  </span>
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={maxClaims}
                  onChange={(e) => setMaxClaims(Math.max(1, parseInt(e.target.value) || 1))}
                  placeholder="e.g. 5"
                  className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-zinc-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="mb-1.5"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Active</span>
                </label>

                <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-zinc-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={captchaRequired}
                    onChange={(e) => setCaptchaRequired(e.target.checked)}
                    className="mb-1.5"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Turnstile</span>
                </label>

                <label className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/5 bg-zinc-900/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mathRequired}
                    onChange={(e) => setMathRequired(e.target.checked)}
                    className="mb-1.5"
                  />
                  <span className="text-[10px] font-bold text-zinc-400 uppercase">Math</span>
                </label>
              </div>

              {/* Quiz section */}
              <div className="border-t border-white/5 pt-4 flex flex-col gap-3">
                <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Quiz Trivia (Optional)
                </h4>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Trivia Question</label>
                  <input
                    type="text"
                    value={quizQuestion}
                    onChange={(e) => setQuizQuestion(e.target.value)}
                    placeholder="e.g. What is the cake in Portal?"
                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Options Array (JSON)
                  </label>
                  <input
                    type="text"
                    value={quizOptions}
                    onChange={(e) => setQuizOptions(e.target.value)}
                    placeholder='e.g. ["A lie", "A truth", "Tasty"]'
                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white font-mono placeholder-zinc-700 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">Correct Answer</label>
                  <input
                    type="text"
                    value={quizAnswer}
                    onChange={(e) => setQuizAnswer(e.target.value)}
                    placeholder="e.g. A lie"
                    className="bg-zinc-900 border border-white/5 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? "Save Edits" : "Create"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 font-bold text-sm transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Giveaways List */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <h3 className="font-bold text-lg text-white">All Giveaways</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {giveaways.map((gw) => (
                <div key={gw.id} className="glass-panel p-5 rounded-2xl border-white/5 flex flex-col justify-between min-h-[180px]">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-base leading-tight">{gw.title}</h4>
                      {gw.active ? (
                        <span className="text-[10px] text-green-400 font-bold uppercase bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-500 font-bold uppercase bg-white/5 px-2 py-0.5 rounded border border-white/5">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-zinc-500 text-xs mt-1.5 leading-relaxed line-clamp-2">{gw.description}</p>
                    <div className="mt-2 text-xs font-mono bg-black/30 border border-white/5 px-3 py-1.5 rounded-lg text-indigo-400 flex justify-between items-center">
                      <span>Code:</span>
                      <span className="font-bold">{gw.code}</span>
                    </div>
                    <div className="mt-1 text-xs font-mono bg-black/20 border border-white/5 px-3 py-1 rounded-lg text-zinc-400 flex justify-between items-center">
                       <span>Claims Count:</span>
                       <span className="font-semibold">{gw._count?.claims ?? 0} / {gw.maxClaims} claimed</span>
                     </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4 mt-4 text-[10px] text-zinc-400">
                    <div className="flex gap-1.5">
                      {gw.captchaRequired && <span className="bg-zinc-800 px-1.5 py-0.5 rounded">Turnstile</span>}
                      {gw.mathRequired && <span className="bg-zinc-800 px-1.5 py-0.5 rounded">Math</span>}
                      {gw.quizQuestion && <span className="bg-zinc-800 px-1.5 py-0.5 rounded">Quiz</span>}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(gw)}
                        className="text-zinc-400 hover:text-white p-1 hover:bg-white/5 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(gw.id)}
                        className="text-red-500 hover:text-red-400 p-1 hover:bg-white/5 rounded transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === "users" && (
        <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col gap-4">
          <h3 className="font-bold text-lg text-white">Registered Users</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Provider</th>
                  <th className="py-3 px-4">IPs</th>
                  <th className="py-3 px-4">User Agent</th>
                  <th className="py-3 px-4">Fingerprint</th>
                  <th className="py-3 px-4">24h Cooldown</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((u) => {
                  const hasCooldown = hasActiveCooldown(u.cooldownUntil);
                  const allIps = Array.from(
                    new Set([u.lastIp, ...(u.claims || []).map((c: any) => c.ipAddress)].filter(Boolean))
                  );

                  return (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 flex items-center gap-2">
                        {u.avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={u.avatar} alt="" className="w-7 h-7 rounded-full" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-600/30 flex items-center justify-center font-bold text-[10px]">
                            {u.username.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span className="font-semibold text-zinc-200">{u.username}</span>
                        {u.isAdmin && (
                          <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                            Admin
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-xs font-mono text-zinc-400 capitalize">{u.provider}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-zinc-400" title={allIps.join(", ")}>
                        {allIps.join(", ") || "N/A"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-[200px] truncate" title={u.lastUserAgent || ""}>{u.lastUserAgent || "N/A"}</td>
                      <td className="py-3.5 px-4 text-xs font-mono text-zinc-400">{u.lastFingerprint || "N/A"}</td>
                      <td className="py-3.5 px-4">
                        {hasCooldown ? (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(u.cooldownUntil).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="text-zinc-500 text-xs">No Cooldown</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right flex justify-end items-center gap-2">
                        {/* Toggle Admin role */}
                        <button
                          onClick={() => handleToggleAdmin(u.id)}
                          className={`p-1.5 rounded-lg border transition-all flex items-center justify-center ${
                            u.isAdmin
                              ? "bg-red-500/10 border-red-500/20 hover:bg-red-500/20 text-red-400"
                              : "bg-green-500/10 border-green-500/20 hover:bg-green-500/20 text-green-400"
                          }`}
                          title={u.isAdmin ? "Demote to Normal User" : "Promote to Admin"}
                        >
                          <Shield className="w-4 h-4" />
                        </button>

                        {/* Recycle Claims & Cooldown */}
                        <button
                          onClick={() => handleClearUserClaims(u.id)}
                          className="p-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center"
                          title="Clear Claims & Cooldowns"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        {/* Reset Cooldown */}
                        {hasCooldown && (
                          <button
                            onClick={() => handleResetCooldown(u.id)}
                            className="p-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 flex items-center justify-center"
                            title="Reset 24h Cooldown"
                          >
                            <Clock className="w-4 h-4" />
                          </button>
                        )}

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Claims Log Tab */}
      {activeTab === "logs" && (
        <div className="glass-panel p-6 rounded-2xl border-white/5 flex flex-col gap-4">
          <h3 className="font-bold text-lg text-white">Claim Activity Log</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-zinc-500 text-xs font-bold uppercase">
                  <th className="py-3 px-4">Claimed At</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Giveaway</th>
                  <th className="py-3 px-4">IP Address</th>
                  <th className="py-3 px-4">User Agent</th>
                  <th className="py-3 px-4">Fingerprint</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-4 text-xs text-zinc-400">
                      {new Date(log.claimedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 flex items-center gap-2">
                      {log.user.avatar && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={log.user.avatar} alt="" className="w-5 h-5 rounded-full" />
                      )}
                      <span className="font-semibold text-zinc-300">{log.user.username}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300 font-semibold">{log.giveaway.title}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-zinc-400">{log.ipAddress}</td>
                    <td className="py-3.5 px-4 text-xs text-zinc-400 max-w-[200px] truncate" title={log.userAgent || ""}>{log.userAgent || "N/A"}</td>
                    <td className="py-3.5 px-4 text-xs font-mono text-zinc-400">{log.fingerprint || "N/A"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Toast Notifications container */}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-md transition-all duration-300 ${
              t.type === "success"
                ? "bg-green-500/10 border-green-500/20 text-green-300"
                : t.type === "error"
                ? "bg-red-500/10 border-red-500/20 text-red-300"
                : "bg-blue-500/10 border-blue-500/20 text-blue-300"
            }`}
          >
            <div className="text-sm font-semibold">{t.message}</div>
            <button
              onClick={() => setToasts((prev) => prev.filter((toast) => toast.id !== t.id))}
              className="text-xs opacity-60 hover:opacity-100 transition-opacity text-zinc-400"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Custom Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border-white/5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-lg shrink-0 ${
                confirmModal.isDestructive
                  ? "bg-red-500/10 border border-red-500/20 text-red-400"
                  : "bg-blue-500/10 border border-blue-500/20 text-blue-400"
              }`}>
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">{confirmModal.title}</h3>
                <p className="text-sm text-zinc-400 mt-1 leading-relaxed">
                  {confirmModal.message}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => confirmModal.onConfirm()}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-colors ${
                  confirmModal.isDestructive
                    ? "bg-red-600 hover:bg-red-500"
                    : "bg-blue-600 hover:bg-blue-500"
                }`}
              >
                {confirmModal.confirmText || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
