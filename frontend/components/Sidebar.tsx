'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { AuthUser } from '@/lib/types';

const links = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/customers', label: 'Customers' },
  { href: '/products', label: 'Products' },
  { href: '/sales', label: 'Sales' },
  { href: '/billing', label: 'Billing' },
];

export function Sidebar({
  user,
  onLogout,
}: {
  user: AuthUser;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white">
      <div className="flex h-14 items-center border-b border-slate-200 px-4">
        <Link href="/dashboard" className="text-lg font-bold text-slate-900">
          SalesBook
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`block rounded-md px-3 py-2 text-sm font-medium ${
                active
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-slate-200 p-3">
        <p className="truncate text-sm font-medium text-slate-800">
          {user.username}
        </p>
        <p className="truncate text-xs text-slate-500">{user.email}</p>
        <button
          onClick={() => {
            onLogout();
            router.replace('/login');
          }}
          className="mt-2 w-full rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
