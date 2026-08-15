'use client';

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { Sidebar } from '@/components/Sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-slate-500">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar user={user} onLogout={logout} />
      <main className="flex-1 overflow-x-auto p-6 lg:p-8">{children}</main>
    </div>
  );
}
