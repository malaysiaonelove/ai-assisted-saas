'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import type { Product } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/format';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', sku: '', price: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    try {
      setProducts(await apiGet<Product[]>('/products'));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products');
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
      await apiPost<Product>('/products', {
        name: form.name,
        sku: form.sku || undefined,
        price: Number(form.price),
      });
      setForm({ name: '', sku: '', price: '' });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this product? Sales history is kept.')) return;
    try {
      await apiDelete(`/products/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete product');
    }
  }

  const field =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Products</h1>

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
        <div className="min-w-36">
          <label className="mb-1 block text-xs font-medium text-slate-600">SKU (optional)</label>
          <input
            value={form.sku}
            onChange={(e) => setForm({ ...form, sku: e.target.value })}
            className={field}
          />
        </div>
        <div className="min-w-36">
          <label className="mb-1 block text-xs font-medium text-slate-600">Price (₦)</label>
          <input
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
            className={field}
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Adding…' : 'Add product'}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : products.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No products yet. Add your first one above.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Name</th>
                <th className="px-4 py-2.5">SKU</th>
                <th className="px-4 py-2.5">Price</th>
                <th className="px-4 py-2.5">Added</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">{p.name}</td>
                  <td className="px-4 py-2.5 text-slate-600">{p.sku ?? '—'}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatMoney(p.price)}</td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(p.id)}
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
