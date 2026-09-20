"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, UserCheck, ArrowRight, FileSpreadsheet, Zap } from "lucide-react";
import clsx from "clsx";
import Image from "next/image";
import { STORE_LOGO_BASE64 } from "@/lib/logoBase64";

export default function NonGstLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"owner" | "employee">("owner");

  // Auto-detect role from email input
  const lowerEmail = email.toLowerCase().trim();
  const cleanEmail = lowerEmail.replace(/@/g, "").replace(/\./g, "");
  const isEmployeeEmail =
    lowerEmail.includes("rudrapratapparida88") ||
    lowerEmail.includes("employee") ||
    lowerEmail.includes("staff") ||
    lowerEmail.includes("kanha");

  const isOwnerEmail =
    lowerEmail.includes("rudrapratap9") ||
    lowerEmail.includes("rudra@") ||
    lowerEmail.includes("owner") ||
    lowerEmail.includes("admin");

  const activeRole: "owner" | "employee" = isEmployeeEmail
    ? "employee"
    : isOwnerEmail
    ? "owner"
    : selectedRole;

  function handleRoleSwitch(role: "owner" | "employee") {
    setSelectedRole(role);
    setError(null);
    setEmail("");
    setPassword("");
  }

  function handleLogin(targetEmail = email, targetPassword = password) {
    if (!targetEmail.trim() || !targetPassword.trim()) {
      setError("Please enter both email/ID and password.");
      return;
    }

    setLoading(true);
    setError(null);

    const rawEmail = targetEmail.trim().toLowerCase();
    const cleanE = rawEmail.replace(/@/g, "").replace(/\./g, "");
    const trimmedPassword = targetPassword.trim();

    const isOwner =
      rawEmail === "rudrapratap9@gmail.com" ||
      cleanE === "rudrapratap9gmailcom" ||
      rawEmail === "rudra@electrical.com" ||
      rawEmail === "owner" ||
      rawEmail === "owner@electrical.com" ||
      rawEmail === "admin";

    const isEmployee =
      rawEmail === "rudrapratapparida88@gmail.com" ||
      rawEmail === "rudrapratapparida88gmail.com" ||
      cleanE === "rudrapratapparida88gmailcom" ||
      rawEmail === "employee@electrical.com" ||
      rawEmail === "staff@electrical.com" ||
      rawEmail === "employee" ||
      rawEmail === "staff" ||
      rawEmail === "kanha";

    if (isOwner) {
      if (
        trimmedPassword !== "Rudra@1234" &&
        trimmedPassword !== "Rusra@1234" &&
        trimmedPassword !== "admin123" &&
        trimmedPassword !== "owner123"
      ) {
        setError("Incorrect owner password. Please try again.");
        setLoading(false);
        return;
      }

      const session = {
        role: "owner",
        name: "Rabindra Kumar Parida",
        email: rawEmail.includes("@") ? rawEmail : "rudrapratap9@gmail.com",
        login_at: new Date().toISOString()
      };
      localStorage.setItem("rudra_nongst_current_user", JSON.stringify(session));
      router.push("/billing");
      return;
    }

    if (isEmployee || activeRole === "employee") {
      if (
        trimmedPassword !== "Kanha@123" &&
        trimmedPassword !== "staff123" &&
        trimmedPassword !== "employee123" &&
        trimmedPassword !== "123456"
      ) {
        setError("Incorrect employee password. Please try again.");
        setLoading(false);
        return;
      }

      const session = {
        role: "employee",
        name: "Rudra Pratap Parida (Staff)",
        email: rawEmail.includes("@") ? rawEmail : "rudrapratapparida88@gmail.com",
        login_at: new Date().toISOString()
      };
      localStorage.setItem("rudra_nongst_current_user", JSON.stringify(session));
      router.push("/billing");
      return;
    }

    // Default fallback for owner tab
    if (trimmedPassword === "Rudra@1234" || trimmedPassword === "admin123") {
      const session = {
        role: "owner",
        name: "Rabindra Kumar Parida",
        email: rawEmail,
        login_at: new Date().toISOString()
      };
      localStorage.setItem("rudra_nongst_current_user", JSON.stringify(session));
      router.push("/billing");
      return;
    }

    setError("Invalid email or password. Please verify your credentials.");
    setLoading(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header with Official Logo */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-500 shadow-xl shadow-emerald-500/20">
            <Image src={STORE_LOGO_BASE64} alt="Rudra Electricals" fill className="object-cover" priority />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white">
            M/S RUDRA ELECTRICALS
          </h2>
          <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
            <FileSpreadsheet className="h-3 w-3" /> Non-GST Counter & Estimate Desk
          </div>
          <p className="text-xs font-mono text-slate-400 mt-1">
            Garadpur, Kendrapara • Mob: 7008690038, 8984038934
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-emerald-900/60 bg-slate-900/90 p-7 shadow-2xl backdrop-blur-sm">
          {/* Quick Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-slate-950/80 border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => handleRoleSwitch("owner")}
              className={clsx(
                "flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold transition",
                activeRole === "owner"
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Shop Owner</span>
            </button>
            <button
              type="button"
              onClick={() => handleRoleSwitch("employee")}
              className={clsx(
                "flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold transition",
                activeRole === "employee"
                  ? "bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20"
                  : "text-slate-400 hover:text-white hover:bg-slate-900"
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Employee / Staff</span>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-white">
                {activeRole === "owner" ? "Owner Sign in (Non-GST)" : "Employee Sign in (Non-GST)"}
              </h1>
              {activeRole === "owner" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-400 border border-emerald-500/30">
                  <ShieldCheck className="h-3 w-3" /> Shop Owner
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-bold text-cyan-400 border border-cyan-500/30">
                  <UserCheck className="h-3 w-3" /> Employee / Staff
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {activeRole === "owner"
                ? "Enter owner credentials to access Non-GST Cash Memo desk, estimate ledger, customer khata, and stock."
                : "Enter employee credentials to issue fast Non-GST Cash Memos, Estimates, and print retail slips."}
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400" htmlFor="email">
                {activeRole === "owner" ? "Owner Email Address / ID" : "Employee Email Address / ID"}
              </label>
              <input
                id="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={clsx(
                  "w-full rounded-lg border bg-slate-800/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 transition",
                  activeRole === "owner"
                    ? "border-emerald-900/60 focus:border-emerald-500 focus:ring-emerald-500"
                    : "border-cyan-800/60 focus:border-cyan-500 focus:ring-cyan-500"
                )}
                placeholder={activeRole === "owner" ? "rudrapratap9@gmail.com" : "rudrapratapparida88@gmail.com"}
                autoComplete="off"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-medium text-slate-400" htmlFor="password">
                  {activeRole === "owner" ? "Owner Password" : "Employee Password"}
                </label>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={clsx(
                    "w-full rounded-lg border bg-slate-800/90 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 transition pr-10",
                    activeRole === "owner"
                      ? "border-emerald-900/60 focus:border-emerald-500 focus:ring-emerald-500"
                      : "border-cyan-800/60 focus:border-cyan-500 focus:ring-cyan-500"
                  )}
                  placeholder={activeRole === "owner" ? "Type owner password (Rudra@1234)" : "Type employee password (Kanha@123)"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-red-950/60 border border-red-800/50 p-3 text-xs text-red-300">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={clsx(
                "flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-slate-950 transition focus:outline-none focus:ring-2 disabled:opacity-60 shadow-lg",
                activeRole === "owner"
                  ? "bg-emerald-500 hover:bg-emerald-400 focus:ring-emerald-500 shadow-emerald-500/20"
                  : "bg-cyan-500 hover:bg-cyan-400 focus:ring-cyan-500 shadow-cyan-500/20"
              )}
            >
              {loading ? (
                "Authenticating…"
              ) : (
                <>
                  {activeRole === "owner" ? "Sign in to Non-GST Portal (Owner)" : "Sign in to Non-GST Portal (Staff)"} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-slate-500">
          Rudra Electricals • Non-GST Retail Billing & Estimate System
        </p>
      </div>
    </div>
  );
}
