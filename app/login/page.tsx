"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, UserCheck, ArrowRight, FileSpreadsheet, Zap } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

export default function NonGstLoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"owner" | "employee">("owner");

  // Auto-detect role from email input
  const lowerEmail = email.toLowerCase().trim();
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

  async function handleLogin(targetEmail = email, targetPassword = password) {
    if (!targetEmail.trim() || !targetPassword.trim()) {
      setError("Please enter both email/ID and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail.trim(), password: targetPassword.trim() }),
      });
      const data = await res.json();

      if (data.success) {
        try {
          await supabase.auth.signInWithPassword({
            email: targetEmail.trim(),
            password: targetPassword.trim(),
          });
        } catch {
          // ignore
        }

        router.push("/billing");
        router.refresh();
        return;
      }

      setError(data.error || "Sign in failed. Please check your credentials.");
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin(email, password);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Brand Header with Official Logo */}
        <div className="mb-8 text-center">
          <div className="relative mx-auto mb-3 h-20 w-20 overflow-hidden rounded-full border-2 border-emerald-500 shadow-xl shadow-emerald-500/20">
            <Image src="/logo.png" alt="Rudra Electricals" fill className="object-cover" priority />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-canvas">
            M/S RUDRA ELECTRICALS
          </h2>
          <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-bold text-emerald-400">
            <FileSpreadsheet className="h-3 w-3" /> Non-GST Counter & Estimate Desk
          </div>
          <p className="text-xs font-mono text-ink-600 mt-1">
            Garadpur, Kendrapara, Odisha
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-xl border border-ink-800 bg-ink-900/90 p-7 shadow-2xl backdrop-blur-sm">
          {/* Quick Role Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-ink-950/80 border border-ink-800 mb-6">
            <button
              type="button"
              onClick={() => handleRoleSwitch("owner")}
              className={clsx(
                "flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-bold transition",
                activeRole === "owner"
                  ? "bg-emerald-500 text-ink-950 shadow-md shadow-emerald-500/20"
                  : "text-ink-600 hover:text-canvas hover:bg-ink-900"
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
                  ? "bg-cyan-500 text-ink-950 shadow-md shadow-cyan-500/20"
                  : "text-ink-600 hover:text-canvas hover:bg-ink-900"
              )}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Employee / Staff</span>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-bold text-canvas">
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
            <p className="text-xs text-ink-600 mt-1">
              {activeRole === "owner"
                ? "Enter owner credentials to access Non-GST Cash Memo desk, estimate ledger, customer khata, and sales summaries."
                : "Enter employee credentials to issue fast Non-GST Cash Memos, Estimates, and print retail slips."}
            </p>
          </div>

          <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="email">
                {activeRole === "owner" ? "Owner Email Address / ID" : "Employee Email Address / ID"}
              </label>
              <input
                id="email"
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={clsx(
                  "w-full rounded-lg border bg-ink-800/90 px-3.5 py-2.5 text-sm text-canvas placeholder:text-ink-600 focus:outline-none focus:ring-1 transition",
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
                <label className="block text-xs font-medium text-ink-600" htmlFor="password">
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
                    "w-full rounded-lg border bg-ink-800/90 px-3.5 py-2.5 text-sm text-canvas placeholder:text-ink-600 focus:outline-none focus:ring-1 transition pr-10",
                    activeRole === "owner"
                      ? "border-emerald-900/60 focus:border-emerald-500 focus:ring-emerald-500"
                      : "border-cyan-800/60 focus:border-cyan-500 focus:ring-cyan-500"
                  )}
                  placeholder={activeRole === "owner" ? "Type owner password" : "Type employee password"}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-600 hover:text-canvas transition"
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
                "flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold text-ink-950 transition focus:outline-none focus:ring-2 disabled:opacity-60 shadow-lg",
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
        <p className="mt-6 text-center text-xs text-ink-600">
          Rudra Electricals • Non-GST Retail Billing & Estimate System
        </p>
      </div>
    </div>
  );
}
