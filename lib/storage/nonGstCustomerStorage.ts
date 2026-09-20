"use client";

export interface NonGstCustomerTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  billNumber: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMode: string;
  notes?: string;
  created_at: string;
}

export interface NonGstCustomerAccount {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalPurchases: number;
  totalPaid: number;
  outstandingBalance: number;
  transactions: NonGstCustomerTransaction[];
  created_at: string;
}

const NONGST_CUSTOMER_KEY = "rudra_nongst_customers_khata";

export const INITIAL_NONGST_CUSTOMERS: NonGstCustomerAccount[] = [
  {
    id: "ng-cust-01",
    name: "Ramesh Sahoo (Electrician)",
    phone: "9861234567",
    address: "Garadpur Bazaar, Kendrapara",
    totalPurchases: 24500,
    totalPaid: 20000,
    outstandingBalance: 4500,
    created_at: new Date().toISOString(),
    transactions: [
      {
        id: "ng-tx-01",
        customerId: "ng-cust-01",
        customerName: "Ramesh Sahoo (Electrician)",
        date: new Date().toISOString().slice(0, 10),
        billNumber: "CM-2026/1001",
        totalAmount: 4500,
        paidAmount: 0,
        remainingAmount: 4500,
        paymentMode: "KHATA (CREDIT)",
        notes: "Wiring materials taken on credit",
        created_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: "ng-cust-02",
    name: "Pradeep Contractor",
    phone: "9437123987",
    address: "Patkura, Kendrapara",
    totalPurchases: 38000,
    totalPaid: 38000,
    outstandingBalance: 0,
    created_at: new Date().toISOString(),
    transactions: [
      {
        id: "ng-tx-02",
        customerId: "ng-cust-02",
        customerName: "Pradeep Contractor",
        date: new Date().toISOString().slice(0, 10),
        billNumber: "EST-2026/1002",
        totalAmount: 4400,
        paidAmount: 4400,
        remainingAmount: 0,
        paymentMode: "UPI / QR",
        notes: "House wiring estimate - paid via UPI",
        created_at: new Date().toISOString(),
      },
    ],
  },
];

export function getStoredNonGstCustomers(): NonGstCustomerAccount[] {
  if (typeof window === "undefined") return INITIAL_NONGST_CUSTOMERS;
  try {
    const raw = localStorage.getItem(NONGST_CUSTOMER_KEY);
    if (!raw) {
      localStorage.setItem(NONGST_CUSTOMER_KEY, JSON.stringify(INITIAL_NONGST_CUSTOMERS));
      return INITIAL_NONGST_CUSTOMERS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NONGST_CUSTOMERS;
  }
}

export function saveNonGstCustomers(customers: NonGstCustomerAccount[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NONGST_CUSTOMER_KEY, JSON.stringify(customers));
    window.dispatchEvent(new Event("nongst-customers-updated"));
  } catch (err) {
    console.error("Failed to save Non-GST customers:", err);
  }
}

export function addNonGstCustomerToStorage(
  cust: Omit<NonGstCustomerAccount, "id" | "totalPurchases" | "totalPaid" | "outstandingBalance" | "transactions" | "created_at">
): NonGstCustomerAccount {
  const all = getStoredNonGstCustomers();
  const newCust: NonGstCustomerAccount = {
    ...cust,
    id: `ng-cust-${Date.now()}`,
    totalPurchases: 0,
    totalPaid: 0,
    outstandingBalance: 0,
    transactions: [],
    created_at: new Date().toISOString(),
  };

  const updated = [newCust, ...all];
  saveNonGstCustomers(updated);
  return newCust;
}

export function recordNonGstCustomerBill(
  customerId: string,
  billNumber: string,
  totalAmount: number,
  paidAmount: number,
  paymentMode: string,
  notes?: string
): void {
  const all = getStoredNonGstCustomers();
  const index = all.findIndex((c) => c.id === customerId);
  if (index === -1) return;

  const due = Math.max(0, totalAmount - paidAmount);
  const newTx: NonGstCustomerTransaction = {
    id: `ng-tx-${Date.now()}`,
    customerId,
    customerName: all[index].name,
    date: new Date().toISOString().slice(0, 10),
    billNumber,
    totalAmount,
    paidAmount,
    remainingAmount: due,
    paymentMode,
    notes,
    created_at: new Date().toISOString(),
  };

  all[index].totalPurchases += totalAmount;
  all[index].totalPaid += paidAmount;
  all[index].outstandingBalance += due;
  all[index].transactions = [newTx, ...all[index].transactions];

  saveNonGstCustomers(all);
}

export function recordNonGstCustomerPayment(
  customerId: string,
  amount: number,
  paymentMode = "CASH",
  notes = "Payment received"
): void {
  const all = getStoredNonGstCustomers();
  const index = all.findIndex((c) => c.id === customerId);
  if (index === -1) return;

  const newTx: NonGstCustomerTransaction = {
    id: `ng-tx-${Date.now()}`,
    customerId,
    customerName: all[index].name,
    date: new Date().toISOString().slice(0, 10),
    billNumber: `PAY-${Date.now().toString().slice(-4)}`,
    totalAmount: 0,
    paidAmount: amount,
    remainingAmount: Math.max(0, all[index].outstandingBalance - amount),
    paymentMode,
    notes,
    created_at: new Date().toISOString(),
  };

  all[index].totalPaid += amount;
  all[index].outstandingBalance = Math.max(0, all[index].outstandingBalance - amount);
  all[index].transactions = [newTx, ...all[index].transactions];

  saveNonGstCustomers(all);
}
