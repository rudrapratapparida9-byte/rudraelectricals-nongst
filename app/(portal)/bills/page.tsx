"use client";

import { STORE_LOGO_BASE64 } from "@/lib/logoBase64";
import { useState, useEffect } from "react";
import {
  Search,
  Printer,
  Calendar,
  Eye,
  FileSpreadsheet,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle,
  Banknote,
  QrCode,
  FileText,
  Clock,
  Plus,
} from "lucide-react";
import Link from "next/link";
import clsx from "clsx";
import {
  NonGstInvoice,
  getStoredNonGstInvoices,
} from "@/lib/storage/nonGstInvoiceStorage";
import { numberToWordsINR } from "@/lib/utils/numberToWords";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function NonGstBillsPage() {
  const [bills, setBills] = useState<NonGstInvoice[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedBill, setSelectedBill] = useState<NonGstInvoice | null>(null);

  useEffect(() => {
    setBills(getStoredNonGstInvoices());
    function reload() {
      setBills(getStoredNonGstInvoices());
    }
    window.addEventListener("nongst-invoices-updated", reload);
    return () => window.removeEventListener("nongst-invoices-updated", reload);
  }, []);

  const filteredBills = bills.filter((b) => {
    const matchesSearch =
      b.billNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.customerPhone && b.customerPhone.includes(searchTerm));

    const matchesType = selectedType === "all" || b.billType === selectedType;

    return matchesSearch && matchesType;
  });

  const totalSales = filteredBills.reduce((s, b) => s + b.grandTotal, 0);
  const totalCash = filteredBills
    .filter((b) => b.paymentMode === "CASH")
    .reduce((s, b) => s + b.grandTotal, 0);
  const totalUpi = filteredBills
    .filter((b) => b.paymentMode.includes("UPI"))
    .reduce((s, b) => s + b.grandTotal, 0);
  const totalDue = filteredBills
    .filter((b) => b.paymentStatus === "Pending / Khata")
    .reduce((s, b) => s + b.grandTotal, 0);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="space-y-6">
      {/* Header (No print) */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-ink-900">
              Non-GST Bill Register & Cash Memos
            </h1>
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-500/30">
              <Clock className="h-3 w-3" /> Ledger
            </span>
          </div>
          <p className="text-xs text-ink-600">
            View, search, filter and reprint all retail cash memos and customer estimates.
          </p>
        </div>

        <Link
          href="/billing"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 transition shadow-md shadow-emerald-600/20"
        >
          <Plus className="h-4 w-4" /> + New Cash Memo / Estimate
        </Link>
      </div>

      {/* Stats Cards (No print) */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total Bills Value</span>
          <p className="text-lg font-black text-ink-900 font-mono mt-1">{formatINR(totalSales)}</p>
          <span className="text-[10px] text-ink-500 font-semibold">{filteredBills.length} Invoices</span>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Cash Collection</span>
          <p className="text-lg font-black text-emerald-700 font-mono mt-1">{formatINR(totalCash)}</p>
          <span className="text-[10px] text-ink-500 font-semibold">Instant Cash</span>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">UPI / QR Collection</span>
          <p className="text-lg font-black text-blue-700 font-mono mt-1">{formatINR(totalUpi)}</p>
          <span className="text-[10px] text-ink-500 font-semibold">Online Digital</span>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Khata / Due Amount</span>
          <p className="text-lg font-black text-amber-700 font-mono mt-1">{formatINR(totalDue)}</p>
          <span className="text-[10px] text-amber-600 font-semibold">Outstanding Credit</span>
        </div>
      </div>

      {/* Filter and Search Bar (No print) */}
      <div className="no-print flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search by Bill No (CM-2026/...), Customer Name, or Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-ink-700/20 bg-white pl-9 pr-4 py-2 text-xs text-ink-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <div className="flex gap-1.5 bg-white p-1 rounded-lg border border-ink-700/20">
          {(["all", "Cash Memo", "Estimate", "Retail Slip"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={clsx(
                "px-3 py-1 text-xs font-bold rounded-md transition",
                selectedType === t
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-ink-600 hover:text-ink-900"
              )}
            >
              {t === "all" ? "All Bills" : t}
            </button>
          ))}
        </div>
      </div>

      {/* Bills Table (No print) */}
      <div className="no-print rounded-xl border border-ink-700/10 bg-white shadow-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-700/10 bg-canvas/60 text-ink-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Bill No</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Items</th>
                <th className="py-3 px-4">Payment</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/10 font-medium">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-ink-500">
                    No Non-GST bills found.
                  </td>
                </tr>
              ) : (
                filteredBills.map((b) => (
                  <tr key={b.id} className="hover:bg-ink-50/60 transition">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-800">
                      {b.billNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={clsx(
                          "px-2 py-0.5 rounded text-[10.5px] font-bold",
                          b.billType === "Estimate"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        )}
                      >
                        {b.billType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-ink-600 font-mono">{b.billDate}</td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-ink-900">{b.customerName}</div>
                      {b.customerPhone && (
                        <div className="text-[10.5px] text-ink-500 font-mono">{b.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">{b.itemsCount} items</td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-ink-800 text-[11px] block">
                        {b.paymentMode}
                      </span>
                      <span
                        className={clsx(
                          "text-[9.5px] font-bold uppercase",
                          b.paymentStatus === "Paid" ? "text-emerald-600" : "text-amber-600"
                        )}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-ink-900 text-sm">
                      {formatINR(b.grandTotal)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedBill(b)}
                        className="inline-flex items-center gap-1 rounded bg-ink-100 hover:bg-emerald-100 hover:text-emerald-800 text-ink-800 px-2.5 py-1 text-xs font-bold transition"
                      >
                        <Eye className="h-3.5 w-3.5" /> View / Print
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill View / Re-Print Modal */}
      <div
        className={clsx(
          selectedBill
            ? "fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-2 sm:p-6 overflow-y-auto backdrop-blur-xs print:static print:p-0 print:m-0 print:bg-transparent print:block print:overflow-visible"
            : "hidden print:block"
        )}
      >
        {selectedBill && (
          <div className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl my-auto text-ink-950 font-sans border border-ink-300 print:static print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
            {/* Modal Actions (No print) */}
            <div className="no-print mb-4 flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-ink-900">
                {selectedBill.billType} Details: {selectedBill.billNumber}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Bill
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedBill(null)}
                  className="rounded-lg border px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* PRINTABLE BILL CANVAS */}
            <div className="printable-bill bg-white p-4 text-[11px] leading-tight text-ink-950 border border-ink-950">
              {/* Receipt Header with Official Logo */}
              <div className="border-b-2 border-ink-950 pb-2 mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={STORE_LOGO_BASE64}
                    alt="Rudra Electricals"
                    width={46}
                    height={46}
                    className="logo-img h-11 w-11 shrink-0 rounded-full border border-ink-400 object-cover shadow-xs"
                    style={{ width: "46px", height: "46px", minWidth: "46px", minHeight: "46px" }}
                  />
                  <div>
                    <h2 className="text-base font-black uppercase tracking-tight text-ink-950">
                      M/S RUDRA ELECTRICALS
                    </h2>
                    <p className="text-[9.5px] font-semibold text-ink-800">
                      Electrical Goods, House Wiring & Appliances
                    </p>
                    <p className="text-[9px] text-ink-600 font-mono">
                      Garadpur, Kendrapara, Odisha - 754228 • Mob: 7008690038, 8984038934
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="inline-block border-2 border-ink-950 py-1 px-3 font-black uppercase tracking-wider text-xs bg-ink-50">
                    {selectedBill.billType.toUpperCase()}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-2 border-b border-ink-900 text-[11px]">
                <div>
                  <p><span className="font-bold text-ink-700">Customer:</span> <strong className="text-ink-950">{selectedBill.customerName}</strong></p>
                  {selectedBill.customerPhone && <p><span className="font-bold text-ink-700">Phone:</span> <span className="font-mono">{selectedBill.customerPhone}</span></p>}
                  {selectedBill.customerAddress && <p><span className="font-bold text-ink-700">Address:</span> {selectedBill.customerAddress}</p>}
                </div>
                <div className="text-right">
                  <p><span className="font-bold text-ink-700">Bill No:</span> <strong className="font-mono font-bold text-ink-950">{selectedBill.billNumber}</strong></p>
                  <p><span className="font-bold text-ink-700">Date:</span> {selectedBill.billDate}</p>
                  <p><span className="font-bold text-ink-700">Payment:</span> <strong className="uppercase">{selectedBill.paymentMode} ({selectedBill.paymentStatus})</strong></p>
                </div>
              </div>

              <table className="w-full my-2 border-collapse text-left text-[10.5px]">
                <thead>
                  <tr className="border-y border-ink-950 bg-ink-50 font-bold text-[10.5px]">
                    <th className="py-1 px-1 text-center w-8">SL</th>
                    <th className="py-1 px-2">ITEM DESCRIPTION</th>
                    <th className="py-1 px-1 text-center w-12">QTY</th>
                    <th className="py-1 px-1 text-right w-16">MRP</th>
                    <th className="py-1 px-1 text-center w-14">DISC%</th>
                    <th className="py-1 px-1 text-right w-16">RATE</th>
                    <th className="py-1 px-2 text-right w-20">AMOUNT</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-300">
                  {selectedBill.items.map((item, idx) => (
                    <tr key={idx} className="align-top">
                      <td className="py-1 px-1 text-center font-mono text-[10.5px]">{idx + 1}</td>
                      <td className="py-1 px-2">
                        <div className="font-bold text-ink-950">{item.name}</div>
                        {item.serialNumber && (
                          <div className="text-[9.5px] text-ink-600 font-mono">SN: {item.serialNumber}</div>
                        )}
                      </td>
                      <td className="py-1 px-1 text-center font-mono font-semibold">
                        {item.qty} {item.unit || "Pcs"}
                      </td>
                      <td className="py-1 px-1 text-right font-mono">₹{item.mrp.toFixed(2)}</td>
                      <td className="py-1 px-1 text-center font-mono">
                        {item.discountPercent ? `${item.discountPercent}%` : "-"}
                      </td>
                      <td className="py-1 px-1 text-right font-mono font-bold">
                        ₹{item.netRate.toFixed(2)}
                      </td>
                      <td className="py-1 px-2 text-right font-mono font-black">
                        ₹{item.totalAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t-2 border-ink-950 pt-2 space-y-1">
                <div className="flex justify-between items-baseline text-[11px]">
                  <span className="italic">
                    <strong>Words:</strong> {numberToWordsINR(selectedBill.grandTotal)}
                  </span>
                  <div className="text-right font-mono">
                    <div className="text-base font-black text-ink-950">
                      GRAND TOTAL: ₹{selectedBill.grandTotal.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-ink-400 flex justify-between items-end text-[9.5px]">
                <div>
                  <p className="font-bold">Terms & Conditions:</p>
                  <p>1. Goods once sold can be exchanged within 7 days with original bill.</p>
                  <p>2. Warranty as per manufacturer terms & conditions.</p>
                </div>
                <div className="text-center">
                  <div className="h-8"></div>
                  <div className="border-t border-ink-950 pt-1 font-bold">
                    For M/S RUDRA ELECTRICALS
                    <div className="text-[8.5px] text-ink-600">Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
