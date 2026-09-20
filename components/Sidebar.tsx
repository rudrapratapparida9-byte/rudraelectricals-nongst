"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileSpreadsheet,
  Receipt,
  Package,
  Users,
  LogOut,
  UserCheck,
  ShieldCheck,
  Clock,
  Boxes,
} from "lucide-react";
import clsx from "clsx";
import type { UserRole } from "@/types/database";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

const NON_GST_NAV = [
  { href: "/billing", label: "Cash Memo / POS", icon: Receipt, roles: ["owner", "billing_staff"] },
  { href: "/bills", label: "Non-GST Bill Register", icon: Clock, roles: ["owner", "billing_staff"] },
  { href: "/products", label: "Non-GST Products", icon: Package, roles: ["owner", "stock_manager"] },
  { href: "/customers", label: "Customer Khata", icon: Users, roles: ["owner"] },
  { href: "/stock", label: "Stock Ledger", icon: Boxes, roles: ["owner", "stock_manager"] },
] as const;

export function Sidebar({ role, fullName = "Rudra Pratap" }: { role: UserRole; fullName?: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NON_GST_NAV.filter((item) => (item.roles as readonly string[]).includes(role));

  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "RP";

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }

    try {
      await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "logout" }),
      });
    } catch {
      // ignore
    }

    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="no-print print:hidden sticky top-0 h-screen w-64 shrink-0 flex flex-col justify-between border-r border-ink-800 bg-ink-950 text-canvas z-40 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-4 py-4 border-b border-ink-800/80 shrink-0">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-emerald-500/40 shadow-sm">
            <Image src="/logo.png" alt="Rudra Electricals" fill className="object-cover" />
          </div>
          <div className="overflow-hidden">
            <span className="block text-xs font-bold tracking-tight text-canvas truncate">
              RUDRA ELECTRICALS
            </span>
            <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-400 font-semibold">
              <FileSpreadsheet className="h-2.5 w-2.5" /> Non-GST Retail Billing
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 px-2.5 py-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition",
                  active
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold"
                    : "text-ink-600 hover:bg-ink-900 hover:text-canvas"
                )}
              >
                <Icon
                  className={clsx("h-4 w-4", active ? "text-emerald-400" : "text-ink-600")}
                  strokeWidth={2}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-ink-800 p-3 bg-ink-900/60">
        <div className="flex items-center justify-between gap-2 px-1 mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shadow-sm",
                role === "owner" ? "bg-emerald-500 text-ink-950" : "bg-cyan-500 text-ink-950"
              )}
            >
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-canvas">{fullName}</p>
              {role === "owner" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                  <ShieldCheck className="h-3 w-3" /> Shop Owner
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-cyan-400">
                  <UserCheck className="h-3 w-3" /> Employee / Staff
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-ink-700/60 bg-ink-800/80 px-3 py-1.5 text-xs text-ink-600 hover:bg-red-950/40 hover:text-red-300 hover:border-red-800/50 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
