// Hand-written types matching schema.sql. Once the project is running,
// regenerate this from the live database with:
//   npx supabase gen types typescript --project-id <ref> > types/database.ts

export type UserRole = "owner" | "billing_staff" | "stock_manager";
export type ProductStatus = "active" | "inactive";
export type PaymentMode = "cash" | "upi" | "card" | "bank_transfer" | "credit";
export type InvoicePaymentStatus = "paid" | "partial" | "unpaid";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  sku: string | null;
  barcode: string | null;
  name: string;
  category_id: string | null;
  brand_id: string | null;
  model: string | null;
  unit: string;
  purchase_price: number;
  selling_price: number;
  mrp: number | null;
  gst_percent: number;
  opening_stock: number;
  current_stock: number;
  minimum_stock: number;
  supplier_id: string | null;
  description: string | null;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  gstin: string | null;
  email: string | null;
  outstanding_amount: number;
  is_walk_in: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  customer_id: string | null;
  invoice_date: string;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  grand_total: number;
  payment_status: InvoicePaymentStatus;
  is_voided: boolean;
  created_by: string | null;
  created_at: string;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  product_id: string;
  qty: number;
  rate: number;
  gst_percent: number;
  amount: number;
}

// Minimal Database type so createBrowserClient/createServerClient
// can be generic without pulling in the full generated schema yet.
export type Database = Record<string, unknown>;
