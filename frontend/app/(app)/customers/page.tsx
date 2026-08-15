'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { formatDate } from '@/lib/format';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', email: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setCustomers(await apiGet<Customer[]>('/customers'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost<Customer>('/customers', {
        name: form.name,
        phone: form.phone || undefined,
        email: form.email || undefined,
      });
      setForm({ name: '', phone: '', email: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this customer?')) return;
    try {
      await apiDelete(`/customers/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete customer');
    }
  }

  const field =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Customers</h1>

      <form
        onSubmit={handleCreate}
        className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className={field}
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className={field}
          />
        </div>
        <div className="min-w-40 flex-1">
          <label className="mb-1 block text-xs font-medium text-slate-600">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className={field}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add customer'}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : customers.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No customers yet. Add your first one above.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">Phone</th>
                <th className="px-4 py-2.5">Email</th>
                <th className="px-4 py-2.5">Sales</th>
                <th className="px-4 py-2.5">Added</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.phone ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c.email ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{c._count?.sales ?? 0}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(c.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
