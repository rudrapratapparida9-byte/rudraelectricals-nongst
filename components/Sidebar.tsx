'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
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
  Zap,
} from 'lucide-react';
import clsx from 'clsx';
import type { UserRole } from '@/types/database';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

const NON_GST_NAV = [
  { href: '/billing', label: 'Cash Memo / POS', icon: Receipt, roles: ['owner', 'billing_staff'] },
  { href: '/bills', label: 'Non-GST Bill Register', icon: Clock, roles: ['owner', 'billing_staff'] },
  { href: '/products', label: 'Non-GST Products', icon: Package, roles: ['owner', 'stock_manager'] },
  { href: '/customers', label: 'Customer Khata', icon: Users, roles: ['owner'] },
  { href: '/stock', label: 'Stock Ledger', icon: Boxes, roles: ['owner', 'stock_manager'] },
] as const;

export default function Sidebar({
  role: initialRole,
  fullName: initialName,
}: {
  role?: UserRole;
  fullName?: string;
} = {}) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole || 'owner');
  const [currentName, setCurrentName] = useState<string>(initialName || 'Rabindra Kumar Parida');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('rudra_nongst_current_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.role) setCurrentRole(u.role === 'owner' ? 'owner' : 'billing_staff');
        if (u.name) setCurrentName(u.name);
      }
    } catch (e) {}
  }, []);

  const items = NON_GST_NAV.filter((item) => (item.roles as readonly string[]).includes(currentRole));

  const initials = currentName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'RP';

  async function handleLogout() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}

    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch {}

    localStorage.removeItem('rudra_nongst_current_user');
    router.push('/login');
    router.refresh();
  }

  return (
    <aside className="no-print print:hidden sticky top-0 h-screen w-60 shrink-0 flex flex-col justify-between border-r border-emerald-900/60 bg-slate-950 text-slate-100 z-40 select-none">
      <div>
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-emerald-900/40 shrink-0 bg-emerald-950/20">
          <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-emerald-500/40 shadow-sm">
            <Image src="/logo.png" alt="Rudra Electricals" fill className="object-cover" />
          </div>
          <div>
            <span className="block text-xs font-bold tracking-tight text-white">RUDRA ELECTRICALS</span>
            <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-400 font-semibold">
              <Zap className="h-2.5 w-2.5" /> Non-GST Counter
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1 px-2.5 py-3">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <Link
                key={href}
                href={href}
                className={clsx(
                  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition',
                  active
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold shadow-sm'
                    : 'text-slate-400 hover:bg-emerald-950/40 hover:text-white'
                )}
              >
                <Icon
                  className={clsx('h-4 w-4', active ? 'text-emerald-400' : 'text-slate-400')}
                  strokeWidth={2}
                />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer */}
      <div className="border-t border-emerald-900/40 p-3 bg-emerald-950/30">
        <div className="flex items-center justify-between gap-2 px-1 mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                'flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs shadow-sm',
                currentRole === 'owner' ? 'bg-emerald-500 text-slate-950' : 'bg-cyan-500 text-slate-950'
              )}
            >
              {initials}
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-xs font-bold text-slate-200">{currentName}</p>
              {currentRole === 'owner' ? (
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
          className="flex w-full items-center justify-center gap-2 rounded-md border border-rose-900/50 bg-rose-950/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-900/40 hover:text-white transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
