'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    const user = localStorage.getItem('rudra_nongst_current_user');
    if (user) {
      router.push('/billing');
    } else {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-300 font-mono text-sm">
      Redirecting to Rudra Electricals Non-GST Billing Desk...
    </div>
  );
}
