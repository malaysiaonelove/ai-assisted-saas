export type Role = 'OWNER' | 'MEMBER';
export type SubscriptionStatus =
  | 'PENDING'
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED';
export type InvoiceStatus = 'PENDING' | 'PAID' | 'FAILED' | 'CANCELED';
export type SaleStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: Role;
  organizationId: string;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  currency: string;
  billingPeriod: string;
  features: Record<string, unknown>;
  limits: Record<string, number | null>;
}

export interface Subscription {
  id: string | null;
  status: SubscriptionStatus;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
  plan: Plan | null;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  provider: string;
  providerReference: string | null;
  receiptUrl: string | null;
  periodStart: string;
  periodEnd: string;
  paidAt: string | null;
  createdAt: string;
  plan: Pick<Plan, 'id' | 'name' | 'slug' | 'price'>;
  subscription: { id: string; status: SubscriptionStatus };
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  createdAt: string;
  _count?: { sales: number };
}

export interface Product {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  createdAt: string;
}

export interface SaleItem {
  id: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customer: { id: string; name: string; email: string | null; phone: string | null } | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: SaleStatus;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  items: SaleItem[];
  createdBy: { id: string; username: string };
}

export interface UsageData {
  usage: { customers: number; products: number; monthlySales: number };
  limits: Record<string, number | null>;
  plan: { id: string; name: string; slug: string } | null;
}

export interface DashboardData {
  organization: {
    id: string;
    name: string;
    users: { id: string; username: string; email: string; role: Role }[];
  };
  subscription: Subscription;
  usage: UsageData;
  stats: { monthRevenue: number; monthSalesCount: number };
  recentSales: Sale[];
}
