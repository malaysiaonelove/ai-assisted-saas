export type UsageKey = 'customers' | 'products' | 'monthlySales';

export interface UsageData {
  usage: Record<UsageKey, number>;
  limits: Record<UsageKey, number | null>;
  plan: { id: string; name: string; slug: string } | null;
}
