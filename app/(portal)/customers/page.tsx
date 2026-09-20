"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Plus,
  Search,
  Phone,
  MapPin,
  FileText,
  DollarSign,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from "lucide-react";
import clsx from "clsx";
import {
  NonGstCustomerAccount,
  getStoredNonGstCustomers,
  addNonGstCustomerToStorage,
  recordNonGstCustomerPayment,
} from "@/lib/storage/nonGstCustomerStorage";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function NonGstCustomersPage() {
  const [customers, setCustomers] = useState<NonGstCustomerAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<NonGstCustomerAccount | null>(null);

  // New Customer Form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddress, setNewAddress] = useState("");

  // Payment Form
  const [payAmount, setPayAmount] = useState("");
  const [payMode, setPayMode] = useState("CASH");
  const [payNotes, setPayNotes] = useState("Khata balance received");

  useEffect(() => {
    setCustomers(getStoredNonGstCustomers());
    function reload() {
      setCustomers(getStoredNonGstCustomers());
    }
    window.addEventListener("nongst-customers-updated", reload);
    return () => window.removeEventListener("nongst-customers-updated", reload);
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalOutstanding = customers.reduce((s, c) => s + c.outstandingBalance, 0);
  const totalPurchases = customers.reduce((s, c) => s + c.totalPurchases, 0);
  const totalPaid = customers.reduce((s, c) => s + c.totalPaid, 0);

  function handleAddCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;

    addNonGstCustomerToStorage({
      name: newName.trim(),
      phone: newPhone.trim() || "0000000000",
      address: newAddress.trim() || "Garadpur, Kendrapara",
    });

    setCustomers(getStoredNonGstCustomers());
    setIsAddModalOpen(false);
    setNewName("");
    setNewPhone("");
    setNewAddress("");
  }

  function handlePaymentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCustomer || !payAmount) return;

    recordNonGstCustomerPayment(
      selectedCustomer.id,
      Number(payAmount) || 0,
      payMode,
      payNotes
    );

    const updated = getStoredNonGstCustomers();
    setCustomers(updated);
    setSelectedCustomer(updated.find((c) => c.id === selectedCustomer.id) || null);
    setIsPayModalOpen(false);
    setPayAmount("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">
            Non-GST Customer Khata Ledger
          </h1>
          <p className="text-xs text-ink-600">
            Track customer accounts, credit balances, and payment receipts independently from GST.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="h-4 w-4" /> Add Khata Customer
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-amber-700 uppercase">Total Khata Due Balance</span>
          <p className="text-xl font-black text-amber-700 font-mono mt-1">
            {formatINR(totalOutstanding)}
          </p>
          <span className="text-[10px] text-ink-500 font-semibold">
            {customers.filter((c) => c.outstandingBalance > 0).length} customers with pending balance
          </span>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total Sales Issued</span>
          <p className="text-xl font-black text-ink-900 font-mono mt-1">{formatINR(totalPurchases)}</p>
          <span className="text-[10px] text-ink-500 font-semibold">Non-GST Counter Sales</span>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-emerald-700 uppercase">Total Payments Collected</span>
          <p className="text-xl font-black text-emerald-700 font-mono mt-1">{formatINR(totalPaid)}</p>
          <span className="text-[10px] text-ink-500 font-semibold">Cash & Digital Receipts</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search Non-GST customers by name, phone, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-ink-700/20 bg-white pl-9 pr-4 py-2 text-xs text-ink-900 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Customers List & Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Customer Accounts (5 cols) */}
        <div className="lg:col-span-5 space-y-2">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-ink-700/10 text-xs text-ink-500">
              No Non-GST customers found. Click + Add Khata Customer above.
            </div>
          ) : (
            filteredCustomers.map((c) => {
              const isSelected = selectedCustomer?.id === c.id;
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className={clsx(
                    "p-3 rounded-xl border transition cursor-pointer bg-white shadow-xs space-y-1",
                    isSelected
                      ? "border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-500"
                      : "border-ink-700/10 hover:border-emerald-300"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-ink-900">{c.name}</h3>
                      <p className="text-[11px] text-ink-500 font-mono">{c.phone}</p>
                    </div>
                    <div className="text-right">
                      {c.outstandingBalance > 0 ? (
                        <span className="inline-block font-mono font-black text-amber-700 text-xs bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Due: {formatINR(c.outstandingBalance)}
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          Cleared
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-ink-600 truncate">{c.address}</p>
                </div>
              );
            })
          )}
        </div>

        {/* Khata Ledger Statements (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCustomer ? (
            <div className="bg-white rounded-xl border border-ink-700/10 p-5 shadow-panel space-y-4">
              <div className="flex items-start justify-between border-b pb-3">
                <div>
                  <h2 className="text-sm font-bold text-ink-900">{selectedCustomer.name}</h2>
                  <p className="text-xs text-ink-600 font-mono">{selectedCustomer.phone}</p>
                  <p className="text-[11px] text-ink-500">{selectedCustomer.address}</p>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-ink-500 uppercase block">
                      Balance Due
                    </span>
                    <span className="text-lg font-black font-mono text-amber-700">
                      {formatINR(selectedCustomer.outstandingBalance)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPayModalOpen(true)}
                    className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-xs"
                  >
                    + Record Payment
                  </button>
                </div>
              </div>

              {/* Transactions Statement */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-ink-800 uppercase tracking-wider">
                  Transaction History & Bills
                </h4>
                {selectedCustomer.transactions.length === 0 ? (
                  <p className="text-xs text-ink-500 py-4 text-center">
                    No transactions recorded for this customer yet.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
                    {selectedCustomer.transactions.map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-ink-700/10 bg-canvas/30 text-xs"
                      >
                        <div>
                          <div className="font-bold text-ink-900 flex items-center gap-1.5">
                            {tx.totalAmount > 0 ? (
                              <ArrowUpRight className="h-3.5 w-3.5 text-amber-600" />
                            ) : (
                              <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-600" />
                            )}
                            <span>{tx.billNumber}</span>
                            <span className="text-[10px] text-ink-500 font-mono font-normal">
                              ({tx.paymentMode})
                            </span>
                          </div>
                          <div className="text-[10px] text-ink-500">{tx.date} • {tx.notes}</div>
                        </div>

                        <div className="text-right font-mono">
                          {tx.totalAmount > 0 && (
                            <div className="text-ink-900 font-bold">
                              Bill: {formatINR(tx.totalAmount)}
                            </div>
                          )}
                          <div className="text-emerald-700 font-bold">
                            Paid: {formatINR(tx.paidAmount)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-dashed border-ink-200 p-12 text-center text-xs text-ink-500">
              <Users className="mx-auto h-8 w-8 text-ink-300 mb-2" />
              Select a customer on the left to view their Non-GST Khata statement & record payments.
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl space-y-4 border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-ink-900">Add Non-GST Khata Customer</h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-ink-500 hover:text-ink-900 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddCustomer} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">
                  Customer Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Ramesh Sahoo (Electrician)"
                  className="w-full rounded border p-2 text-xs text-ink-900"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="e.g. 9861234567"
                  className="w-full rounded border p-2 text-xs text-ink-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">
                  Village / Town Address
                </label>
                <input
                  type="text"
                  value={newAddress}
                  onChange={(e) => setNewAddress(e.target.value)}
                  placeholder="e.g. Garadpur Bazaar, Kendrapara"
                  className="w-full rounded border p-2 text-xs text-ink-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {isPayModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl space-y-4 border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-ink-900">
                Receive Khata Payment - {selectedCustomer.name}
              </h3>
              <button
                onClick={() => setIsPayModalOpen(false)}
                className="text-ink-500 hover:text-ink-900 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handlePaymentSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">
                  Payment Amount (₹) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  placeholder={`Due: ₹${selectedCustomer.outstandingBalance}`}
                  className="w-full rounded border p-2 text-sm font-mono font-bold text-emerald-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value)}
                  className="w-full rounded border p-2 text-xs text-ink-900"
                >
                  <option value="CASH">Cash</option>
                  <option value="UPI / QR">UPI / QR (PhonePe/GooglePay)</option>
                  <option value="BANK TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">
                  Notes / Receipt Remark
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full rounded border p-2 text-xs text-ink-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
