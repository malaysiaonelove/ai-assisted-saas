'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';
import type { DashboardData } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/format';

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<DashboardData>('/organizations/me')
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load dashboard'));
  }, []);

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }
  if (!data) {
    return <p className="text-sm text-slate-500">Loading dashboard…</p>;
  }

  const { organization, subscription, usage, stats, recentSales } = data;
  const planName = usage.plan?.name ?? '—';

  const bars: { label: string; used: number; limit: number | null }[] = [
    { label: 'Customers', used: usage.usage.customers, limit: usage.limits.customers ?? null },
    { label: 'Products', used: usage.usage.products, limit: usage.limits.products ?? null },
    { label: 'Sales this month', used: usage.usage.monthlySales, limit: usage.limits.monthlySales ?? null },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{organization.name}</h1>
          <p className="text-sm text-slate-500">
            Here's how your business is doing.
          </p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-medium text-white">
          {planName} plan
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue this month" value={formatMoney(stats.monthRevenue)} />
        <StatCard label="Sales this month" value={String(stats.monthSalesCount)} />
        <StatCard label="Customers" value={String(usage.usage.customers)} />
        <StatCard label="Products" value={String(usage.usage.products)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold text-slate-700">
            Plan usage
          </h2>
          <div className="space-y-4">
            {bars.map((bar) => {
              const pct =
                bar.limit == null
                  ? 0
                  : Math.min(100, Math.round((bar.used / Math.max(1, bar.limit)) * 100));
              return (
                <div key={bar.label}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-slate-600">{bar.label}</span>
                    <span className="text-slate-500">
                      {bar.used}
                      {bar.limit != null ? ` / ${bar.limit}` : ' / unlimited'}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        pct >= 100 ? 'bg-red-500' : 'bg-slate-900'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/billing"
            className="mt-4 inline-block text-sm font-medium text-slate-900 underline"
          >
            Manage plan →
          </Link>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">Recent sales</h2>
            <Link
              href="/sales"
              className="text-sm font-medium text-slate-900 underline"
            >
              View all →
            </Link>
          </div>
          {recentSales.length === 0 ? (
            <p className="text-sm text-slate-500">
              No sales yet.{' '}
              <Link href="/sales" className="underline">
                Record your first sale
              </Link>
              .
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {sale.invoiceNumber}
                    </p>
                    <p className="text-xs text-slate-500">
                      {sale.customer?.name ?? 'Walk-in customer'} · {formatDate(sale.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatMoney(sale.total)}</p>
                    <p
                      className={`text-xs ${
                        sale.status === 'PAID' ? 'text-emerald-600' : 'text-amber-600'
                      }`}
                    >
                      {sale.status}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <p className="text-xs text-slate-400">
        Subscription status: {subscription.status} · Renews{' '}
        {formatDate(subscription.currentPeriodEnd)}
      </p>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
