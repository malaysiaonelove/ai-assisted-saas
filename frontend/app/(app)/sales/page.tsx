'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { apiDelete, apiGet, apiPost } from '@/lib/api';
import type { Customer, Product, Sale } from '@/lib/types';
import { formatDate, formatMoney } from '@/lib/format';

interface LineItem {
  productId: string;
  quantity: number;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ productId: '', quantity: 1 }]);
  const [discount, setDiscount] = useState('');
  const [tax, setTax] = useState('');
  const [status, setStatus] = useState<'PAID' | 'PENDING'>('PAID');
  const [notes, setNotes] = useState('');

  const load = useCallback(async () => {
    try {
      const [salesData, customersData, productsData] = await Promise.all([
        apiGet<Sale[]>('/sales'),
        apiGet<Customer[]>('/customers'),
        apiGet<Product[]>('/products'),
      ]);
      setSales(salesData);
      setCustomers(customersData);
      setProducts(productsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await apiPost<Sale>('/sales', {
        customerId: customerId || undefined,
        items: items.map((it) => ({ productId: it.productId, quantity: it.quantity })),
        discount: discount ? Number(discount) : undefined,
        tax: tax ? Number(tax) : undefined,
        status,
        notes: notes || undefined,
      });
      setItems([{ productId: '', quantity: 1 }]);
      setDiscount('');
      setTax('');
      setNotes('');
      setCustomerId('');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record sale');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this sale?')) return;
    try {
      await apiDelete(`/sales/${id}`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete sale');
    }
  }

  const field =
    'w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none';

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Sales</h1>

      <form
        onSubmit={handleCreate}
        className="space-y-4 rounded-xl border border-slate-200 bg-white p-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Customer</label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className={field}
            >
              <option value="">Walk-in customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'PAID' | 'PENDING')}
              className={field}
            >
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Notes (optional)</label>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-600">Line items</p>
          {items.map((item, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={item.productId}
                onChange={(e) => updateItem(index, { productId: e.target.value })}
                required
                className={`${field} flex-1`}
              >
                <option value="" disabled>
                  Select product…
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatMoney(p.price)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                required
                className={`${field} w-24`}
              />
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                  className="rounded-md border border-slate-300 px-3 text-sm text-slate-500 hover:bg-slate-50"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setItems((prev) => [...prev, { productId: '', quantity: 1 }])}
            className="text-sm font-medium text-slate-900 underline"
          >
            + Add line item
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Discount (₦)</label>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">Tax (₦)</label>
            <input
              type="number"
              min={0}
              value={tax}
              onChange={(e) => setTax(e.target.value)}
              className={field}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting || items.some((it) => !it.productId)}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
        >
          {submitting ? 'Recording…' : 'Record sale'}
        </button>
      </form>

      {error && (
        <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading…</p>
        ) : sales.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">No sales yet. Record your first sale above.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2.5">Invoice</th>
                <th className="px-4 py-2.5">Customer</th>
                <th className="px-4 py-2.5">Items</th>
                <th className="px-4 py-2.5">Total</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((sale) => (
                <tr key={sale.id}>
                  <td className="px-4 py-2.5 font-medium text-slate-800">
                    {sale.invoiceNumber}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {sale.customer?.name ?? 'Walk-in'}
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">
                    {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-4 py-2.5 font-semibold">{formatMoney(sale.total)}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        sale.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {sale.status}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600">{formatDate(sale.createdAt)}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button
                      onClick={() => handleDelete(sale.id)}
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
