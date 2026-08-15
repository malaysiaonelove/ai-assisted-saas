'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';
import type { Invoice, Plan, Subscription } from '@/lib/types';
import { formatDate, formatDateTime, formatMoney } from '@/lib/format';

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [plansData, subscriptionData, invoicesData] = await Promise.all([
        apiGet<Plan[]>('/plans'),
        apiGet<Subscription>('/subscriptions/me'),
        apiGet<Invoice[]>('/invoices'),
      ]);
      setPlans(plansData);
      setSubscription(subscriptionData);
      setInvoices(invoicesData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle returning from the Paystack checkout page (?reference=...)
  useEffect(() => {
    load();
    const params = new URLSearchParams(window.location.search);
    const reference = params.get('reference') ?? params.get('trxref');
    if (reference) {
      setNotice('Payment received — verifying with Paystack…');
      apiPost<Invoice>(`/payments/verify/reference/${reference}`)
        .then(() => {
          setNotice('Payment confirmed. Your plan is now active. 🎉');
          load();
        })
        .catch((err) => {
          setNotice(null);
          setError(
            err instanceof Error ? err.message : 'Could not verify payment. Try the Verify button below.',
          );
        })
        .finally(() => {
          window.history.replaceState({}, '', window.location.pathname);
        });
    }
  }, [load]);

  async function handleSubscribe(plan: Plan) {
    setBusy(plan.id);
    setError(null);
    setNotice(null);
    try {
      const result = await apiPost<{
        activated?: boolean;
        authorizationUrl?: string;
        reference?: string;
      }>('/subscriptions/checkout', { planId: plan.id });
      if (result.activated) {
        setNotice(`You are now on the ${plan.name} plan.`);
        await load();
      } else if (result.authorizationUrl) {
        setNotice('Redirecting to Paystack to complete payment…');
        window.location.href = result.authorizationUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
    } finally {
      setBusy(null);
    }
  }

  async function handleVerify(invoice: Invoice) {
    setBusy(invoice.id);
    setError(null);
    try {
      await apiPost<Invoice>(`/payments/${invoice.id}/verify`);
      setNotice(`Invoice ${invoice.invoiceNumber} is now paid.`);
      await load();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Verification failed — payment may not have completed.',
      );
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading billing…</p>;
  }

  const currentPlanId = subscription?.plan?.id;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Billing</h1>

      {notice && (
        <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </div>
      )}
      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-700">Current plan</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-xl font-bold">
            {subscription?.plan?.name ?? 'Free'}
          </p>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
            {subscription?.status}
          </span>
          {subscription?.cancelAtPeriodEnd && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Cancels at period end
            </span>
          )}
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {subscription?.currentPeriodStart
            ? `Period: ${formatDate(subscription.currentPeriodStart)} → ${formatDate(
                subscription.currentPeriodEnd,
              )}`
            : 'No subscription yet.'}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Choose a plan</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`flex flex-col rounded-xl border bg-white p-5 ${
                  isCurrent ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'
                }`}
              >
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="mt-1 text-sm text-slate-500">{plan.description}</p>
                <p className="mt-3 text-2xl font-bold">
                  {plan.price === 0 ? 'Free' : formatMoney(plan.price)}
                  {plan.price > 0 && (
                    <span className="text-sm font-normal text-slate-500">/month</span>
                  )}
                </p>
                <ul className="mt-4 flex-1 space-y-1.5 text-sm text-slate-600">
                  {plan.limits.customers == null ? (
                    <li>Unlimited customers</li>
                  ) : (
                    <li>Up to {plan.limits.customers} customers</li>
                  )}
                  {plan.limits.products == null ? (
                    <li>Unlimited products</li>
                  ) : (
                    <li>Up to {plan.limits.products} products</li>
                  )}
                  {plan.limits.monthlySales == null ? (
                    <li>Unlimited sales per month</li>
                  ) : (
                    <li>Up to {plan.limits.monthlySales} sales / month</li>
                  )}
                  <li>
                    {String(plan.features.reports) === 'true' ? 'Reports included' : 'No reports'}
                  </li>
                </ul>
                <button
                  onClick={() => handleSubscribe(plan)}
                  disabled={isCurrent || busy !== null}
                  className={`mt-4 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 ${
                    isCurrent
                      ? 'bg-slate-100 text-slate-500'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {busy === plan.id
                    ? 'Processing…'
                    : isCurrent
                      ? 'Current plan'
                      : plan.price === 0
                        ? 'Switch to free'
                        : 'Upgrade'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      <section className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700">
          Invoices & receipts
        </h2>
        {invoices.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No invoices yet.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Plan</th>
                <th className="px-4 py-2.5">Amount</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map((invoice) => (
                <tr key={invoice.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {invoice.invoiceNumber}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{invoice.plan.name}</td>
                  <td className="px-4 py-2.5 font-semibold">{formatMoney(invoice.amount)}</td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {formatDate(invoice.periodStart)} → {formatDate(invoice.periodEnd)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        invoice.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : invoice.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDateTime(invoice.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    {invoice.status === 'PENDING' && (
                      <button
                        onClick={() => handleVerify(invoice)}
                        disabled={busy !== null}
                        className="text-sm font-medium text-slate-900 underline disabled:opacity-50"
                      >
                        {busy === invoice.id ? 'Checking…' : 'Verify payment'}
                      </button>
                    )}
                    {invoice.status === 'PAID' && invoice.receiptUrl && (
                      <a
                        href={invoice.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm font-medium text-slate-900 underline"
                      >
                        Receipt
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
