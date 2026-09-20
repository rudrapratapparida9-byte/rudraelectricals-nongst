export interface NonGstBillItem {
  id?: string;
  name: string;
  qty: number;
  unit?: string;
  mrp: number;
  discountPercent?: number;
  discountAmount?: number;
  netRate: number;
  totalAmount: number;
  serialNumber?: string;
}

export interface NonGstInvoice {
  id: string;
  billNumber: string; // e.g. "EST-2026/101" or "CM-2026/101"
  billType: "Cash Memo" | "Estimate" | "Retail Slip" | "Challan";
  billDate: string;
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  subtotal: number;
  discountTotal: number;
  grandTotal: number;
  paymentMode: string;
  paymentStatus: "Paid" | "Pending / Khata" | "Partial";
  paidAmount?: number;
  dueAmount?: number;
  notes?: string;
  itemsCount: number;
  items: NonGstBillItem[];
  createdAt: string;
}

const STORAGE_KEY = "rudra_nongst_invoices";

const DEFAULT_NONGST_INVOICES: NonGstInvoice[] = [
  {
    id: "ng-inv-1",
    billNumber: "CM-2026/1001",
    billType: "Cash Memo",
    billDate: "20 Sep 2026",
    customerName: "Ramesh Sahoo",
    customerPhone: "9861234567",
    customerAddress: "Garadpur Bazaar, Kendrapara",
    subtotal: 1850,
    discountTotal: 150,
    grandTotal: 1700,
    paymentMode: "CASH",
    paymentStatus: "Paid",
    paidAmount: 1700,
    dueAmount: 0,
    notes: "Counter Cash Sale - Complete",
    itemsCount: 2,
    items: [
      {
        name: "Havells 1.5 sq mm Wire (Red - 90m)",
        qty: 1,
        unit: "Coil",
        mrp: 1450,
        discountPercent: 10,
        discountAmount: 145,
        netRate: 1305,
        totalAmount: 1305,
      },
      {
        name: "Anchor 6A 1-Way Modular Switch",
        qty: 10,
        unit: "Pcs",
        mrp: 40,
        discountPercent: 1.25,
        discountAmount: 0.5,
        netRate: 39.5,
        totalAmount: 395,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "ng-inv-2",
    billNumber: "EST-2026/1002",
    billType: "Estimate",
    billDate: "20 Sep 2026",
    customerName: "Pradeep Contractor",
    customerPhone: "9437123987",
    customerAddress: "Patkura, Kendrapara",
    subtotal: 4800,
    discountTotal: 400,
    grandTotal: 4400,
    paymentMode: "UPI / QR",
    paymentStatus: "Paid",
    paidAmount: 4400,
    dueAmount: 0,
    notes: "House wiring estimate - paid via PhonePe",
    itemsCount: 1,
    items: [
      {
        name: "Finolex 2.5 sq mm Wire (Blue - 90m)",
        qty: 2,
        unit: "Coil",
        mrp: 2400,
        discountPercent: 8.33,
        discountAmount: 200,
        netRate: 2200,
        totalAmount: 4400,
      },
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
];

export function getStoredNonGstInvoices(): NonGstInvoice[] {
  if (typeof window === "undefined") return DEFAULT_NONGST_INVOICES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_NONGST_INVOICES));
      return DEFAULT_NONGST_INVOICES;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_NONGST_INVOICES;
  }
}

export function saveNonGstInvoices(invoices: NonGstInvoice[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
    window.dispatchEvent(new Event("nongst-invoices-updated"));
  } catch (err) {
    console.error("Failed to save Non-GST invoices:", err);
  }
}

export function addNonGstInvoiceToStorage(
  invoice: Omit<NonGstInvoice, "id" | "createdAt">
): NonGstInvoice {
  const all = getStoredNonGstInvoices();
  const newInvoice: NonGstInvoice = {
    ...invoice,
    id: `ng-inv-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newInvoice, ...all];
  saveNonGstInvoices(updated);
  return newInvoice;
}

export function getNextNonGstBillNumber(type: "Cash Memo" | "Estimate" | "Retail Slip" = "Cash Memo"): string {
  const all = getStoredNonGstInvoices();
  const year = new Date().getFullYear();
  const prefix = type === "Estimate" ? "EST" : "CM";
  
  const relevantBills = all.filter((i) => i.billNumber.startsWith(prefix));
  const maxSeq = relevantBills.reduce((max, i) => {
    const parts = i.billNumber.split("/");
    const num = parseInt(parts[parts.length - 1], 10);
    return !isNaN(num) && num > max ? num : max;
  }, 1000);

  return `${prefix}-${year}/${maxSeq + 1}`;
}
