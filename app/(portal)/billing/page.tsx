"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  Plus,
  Trash2,
  Printer,
  CreditCard,
  Banknote,
  QrCode,
  FileText,
  User,
  ShoppingBag,
  Building,
  Eye,
  CheckCircle2,
  PackagePlus,
  Percent,
  BadgePercent,
  Receipt,
  FileSpreadsheet,
  Zap,
} from "lucide-react";
import clsx from "clsx";
import { numberToWordsINR } from "@/lib/utils/numberToWords";
import {
  NonGstProduct,
  getStoredNonGstProducts,
  addNonGstProductToStorage,
  adjustNonGstProductStock,
} from "@/lib/storage/nonGstInventoryStorage";
import {
  NonGstBillItem,
  addNonGstInvoiceToStorage,
  getNextNonGstBillNumber,
} from "@/lib/storage/nonGstInvoiceStorage";
import {
  NonGstCustomerAccount,
  getStoredNonGstCustomers,
  recordNonGstCustomerBill,
} from "@/lib/storage/nonGstCustomerStorage";

interface NonGstCartItem {
  id: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  currentStock: number;
  qty: number;
  mrp: number;
  discountPercent: number;
  discountAmount: number;
  netRate: number;
  totalAmount: number;
  serialNumber?: string;
  serialNumbers?: string[];
}

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function NonGstBillingPage() {
  const [products, setProducts] = useState<NonGstProduct[]>([]);
  const [customers, setCustomers] = useState<NonGstCustomerAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<NonGstCartItem[]>([]);
  const [billSuccessMessage, setBillSuccessMessage] = useState<string | null>(null);

  // Bill Meta
  const [billType, setBillType] = useState<"Cash Memo" | "Estimate" | "Retail Slip">("Cash Memo");
  const [billNumber, setBillNumber] = useState<string>("CM-2026/1001");
  const [billDate, setBillDate] = useState(
    new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
  );
  const [paymentMode, setPaymentMode] = useState<string>("CASH");
  const [paymentStatus, setPaymentStatus] = useState<"Paid" | "Pending / Khata" | "Partial">("Paid");
  const [notes, setNotes] = useState("");

  // Customer Selection & Details
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("walkin");
  const [buyerName, setBuyerName] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerAddress, setBuyerAddress] = useState("Garadpur, Kendrapara");

  // Quick Add Product Modal state
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [qName, setQName] = useState("");
  const [qBrand, setQBrand] = useState("");
  const [qCategory, setQCategory] = useState("Wires & Cables");
  const [qUnit, setQUnit] = useState("Pcs");
  const [qMrp, setQMrp] = useState("");
  const [qSellingPrice, setQSellingPrice] = useState("");
  const [qStock, setQStock] = useState("");

  // Modals
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [printSize, setPrintSize] = useState<"A4" | "A5" | "POS">("A4");

  useEffect(() => {
    setProducts(getStoredNonGstProducts());
    setCustomers(getStoredNonGstCustomers());
    setBillNumber(getNextNonGstBillNumber(billType));

    function reloadProducts() {
      setProducts(getStoredNonGstProducts());
    }
    function reloadCustomers() {
      setCustomers(getStoredNonGstCustomers());
    }
    function reloadInvoices() {
      setBillNumber(getNextNonGstBillNumber(billType));
    }

    window.addEventListener("nongst-inventory-updated", reloadProducts);
    window.addEventListener("nongst-customers-updated", reloadCustomers);
    window.addEventListener("nongst-invoices-updated", reloadInvoices);
    return () => {
      window.removeEventListener("nongst-inventory-updated", reloadProducts);
      window.removeEventListener("nongst-customers-updated", reloadCustomers);
      window.removeEventListener("nongst-invoices-updated", reloadInvoices);
    };
  }, [billType]);

  function handleCustomerSelect(id: string) {
    setSelectedCustomerId(id);
    if (id === "walkin") {
      setBuyerName("");
      setBuyerPhone("");
      setBuyerAddress("Garadpur, Kendrapara");
      return;
    }

    const c = customers.find((cust) => cust.id === id);
    if (c) {
      setBuyerName(c.name);
      setBuyerPhone(c.phone || "");
      setBuyerAddress(c.address || "Garadpur, Kendrapara");
    }
  }

  function calculateItemMetrics(
    p: NonGstProduct | NonGstCartItem,
    qty: number,
    customMrp?: number,
    discountPercent = 0,
    customNetRate?: number
  ): NonGstCartItem {
    const fallbackPrice = "sellingPrice" in p ? p.sellingPrice : "netRate" in p ? p.netRate : 100;
    const itemMrp = customMrp !== undefined ? customMrp : (p.mrp || fallbackPrice || 100);

    let discPercent = discountPercent;
    let discAmount = 0;
    let netRate = 0;

    if (customNetRate !== undefined) {
      netRate = Math.max(0, customNetRate);
      discAmount = Math.max(0, +(itemMrp - netRate).toFixed(2));
      discPercent = itemMrp > 0 ? +((discAmount / itemMrp) * 100).toFixed(2) : 0;
    } else {
      discPercent = discountPercent;
      discAmount = +(itemMrp * (discPercent / 100)).toFixed(2);
      netRate = Math.max(0, +(itemMrp - discAmount).toFixed(2));
    }

    const totalAmount = +(netRate * qty).toFixed(2);

    const existingSerials = (p as NonGstCartItem).serialNumbers
      ? [...(p as NonGstCartItem).serialNumbers!]
      : p.serialNumber
      ? p.serialNumber.split(",").map((s: string) => s.trim())
      : [];

    const updatedSerials: string[] = [];
    for (let i = 0; i < qty; i++) {
      updatedSerials.push(existingSerials[i] || "");
    }
    const joinedSerial = updatedSerials.filter((s) => s && s.trim().length > 0).join(", ");

    return {
      id: p.id,
      name: p.name,
      brand: p.brand || "Generic",
      category: p.category || "General",
      unit: p.unit || "Pcs",
      currentStock: p.currentStock || 0,
      qty,
      mrp: itemMrp,
      discountPercent: discPercent,
      discountAmount: discAmount,
      netRate,
      totalAmount,
      serialNumbers: updatedSerials,
      serialNumber: joinedSerial || undefined,
    };
  }

  function addToCart(p: NonGstProduct) {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === p.id);
      if (existing) {
        return prev.map((item) =>
          item.id === p.id
            ? calculateItemMetrics(item, item.qty + 1, item.mrp, item.discountPercent)
            : item
        );
      }
      const initialMrp = p.mrp || p.sellingPrice || 100;
      const initialDiscountPercent =
        p.mrp && p.mrp > p.sellingPrice ? +(((p.mrp - p.sellingPrice) / p.mrp) * 100).toFixed(1) : 0;

      return [...prev, calculateItemMetrics(p, 1, initialMrp, initialDiscountPercent)];
    });
  }

  function updateQty(id: string, qty: number) {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? calculateItemMetrics(item, qty, item.mrp, item.discountPercent) : item
      )
    );
  }

  function updateItemMrp(id: string, newMrp: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? calculateItemMetrics(item, item.qty, newMrp, item.discountPercent) : item
      )
    );
  }

  function updateDiscountPercent(id: string, discPercent: number) {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id
          ? calculateItemMetrics(item, item.qty, item.mrp, Number(discPercent) || 0)
          : item
      )
    );
  }

  function updateNetRate(id: string, newRate: number) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const itemMrp = item.mrp || 100;
          const rate = Math.max(0, Number(newRate) || 0);
          const discAmt = Math.max(0, itemMrp - rate);
          const discPercent = itemMrp > 0 ? +((discAmt / itemMrp) * 100).toFixed(2) : 0;
          return calculateItemMetrics(item, item.qty, itemMrp, discPercent, rate);
        }
        return item;
      })
    );
  }

  function updateItemUnitSerialNumber(id: string, unitIndex: number, serialNumber: string) {
    setCart((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const serials = [...(item.serialNumbers || Array(item.qty).fill(""))];
          while (serials.length < item.qty) serials.push("");
          serials[unitIndex] = serialNumber;
          const joined = serials.filter((s) => s && s.trim().length > 0).join(", ");
          return {
            ...item,
            serialNumbers: serials,
            serialNumber: joined || undefined,
          };
        }
        return item;
      })
    );
  }

  function removeFromCart(id: string) {
    setCart((prev) => prev.filter((item) => item.id !== id));
  }

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!qName.trim() || !qMrp) return;

    const baseSku = `${qBrand ? qBrand.slice(0, 3).toUpperCase() : "ITM"}-${Math.floor(1000 + Math.random() * 9000)}`;
    const parsedMrp = Number(qMrp) || 0;
    const parsedSelling = Number(qSellingPrice) || parsedMrp;

    const newProd = addNonGstProductToStorage({
      name: qName.trim(),
      brand: qBrand.trim() || "Generic",
      category: qCategory,
      sku: baseSku,
      unit: qUnit,
      purchasePrice: 0,
      sellingPrice: parsedSelling,
      mrp: parsedMrp,
      currentStock: Number(qStock) || 0,
      minimumStock: 5,
    });

    setProducts(getStoredNonGstProducts());
    addToCart(newProd);
    setIsQuickAddOpen(false);

    setQName("");
    setQBrand("");
    setQMrp("");
    setQSellingPrice("");
    setQStock("");
  }

  // Final totals calculations
  const totalMrpAmount = cart.reduce((sum, i) => sum + i.mrp * i.qty, 0);
  const totalSavings = cart.reduce((sum, i) => sum + i.discountAmount * i.qty, 0);
  const rawSubtotal = cart.reduce((sum, i) => sum + i.totalAmount, 0);
  const grandTotal = Math.round(rawSubtotal);
  const roundOff = +(grandTotal - rawSubtotal).toFixed(2);

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function finalizeBill(openPrintModal = true) {
    if (cart.length === 0) return;

    // 1. Save Non-GST Invoice to storage
    addNonGstInvoiceToStorage({
      billNumber,
      billType,
      billDate,
      customerName: buyerName.trim() || "Walk-in Customer",
      customerPhone: buyerPhone.trim() || undefined,
      customerAddress: buyerAddress.trim() || undefined,
      subtotal: totalMrpAmount,
      discountTotal: totalSavings,
      grandTotal,
      paymentMode,
      paymentStatus,
      paidAmount: paymentStatus === "Paid" ? grandTotal : 0,
      dueAmount: paymentStatus === "Pending / Khata" ? grandTotal : 0,
      notes: notes || `${billType} issued at shop counter`,
      itemsCount: cart.length,
      items: cart.map((i) => ({
        name: i.name,
        qty: i.qty,
        unit: i.unit,
        mrp: i.mrp,
        discountPercent: i.discountPercent,
        discountAmount: i.discountAmount,
        netRate: i.netRate,
        totalAmount: i.totalAmount,
        serialNumber: i.serialNumber,
      })),
    });

    // 2. Deduct Non-GST inventory stock
    cart.forEach((item) => {
      adjustNonGstProductStock(item.id, -item.qty);
    });

    // 3. If customer selected from Khata, record transaction in Non-GST customer ledger
    if (selectedCustomerId && selectedCustomerId !== "walkin") {
      recordNonGstCustomerBill(
        selectedCustomerId,
        billNumber,
        grandTotal,
        paymentStatus === "Paid" ? grandTotal : 0,
        paymentMode,
        `${billType} - ${cart.length} items`
      );
    }

    // 4. Reload Non-GST products
    setProducts(getStoredNonGstProducts());

    // 5. Success message
    setBillSuccessMessage(`✅ ${billType} ${billNumber} generated! Total: ₹${grandTotal.toLocaleString("en-IN")}`);
    setTimeout(() => setBillSuccessMessage(null), 6000);

    if (openPrintModal) {
      setIsPreviewOpen(true);
    } else {
      setCart([]);
      setBillNumber(getNextNonGstBillNumber(billType));
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div>
      {/* POS Screen (Hidden when printing) */}
      <div className="no-print space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-full border-2 border-emerald-500 shadow-md">
              <Image src="/logo.png" alt="Rudra Electricals" fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-ink-900">
                  Non-GST Retail & Estimate Billing Desk
                </h1>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-500/30">
                  <FileSpreadsheet className="h-3 w-3" /> Non-GST Mode
                </span>
              </div>
              <p className="text-xs text-ink-600">
                M/S RUDRA ELECTRICALS • Garadpur, Kendrapara, Odisha (Cash Memo / Estimate Format)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsQuickAddOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-xs font-semibold text-ink-800 hover:bg-ink-50 transition shadow-xs"
            >
              <Plus className="h-4 w-4 text-emerald-600" /> + Add Item
            </button>
            <button
              onClick={() => setIsPreviewOpen(true)}
              disabled={cart.length === 0}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50 transition shadow-md shadow-emerald-600/20"
            >
              <Eye className="h-4 w-4" /> View & Print Cash Memo
            </button>
          </div>
        </div>

        {billSuccessMessage && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-900 shadow-sm animate-fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{billSuccessMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Product Search & Quick Add (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
                <input
                  type="text"
                  placeholder="Search item name, brand, or SKU..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-ink-700/20 bg-canvas/60 pl-9 pr-4 py-2 text-xs text-ink-900 focus:border-emerald-500 focus:outline-none font-medium"
                />
              </div>

              {products.length === 0 ? (
                <div className="rounded-lg border border-dashed border-ink-200 bg-canvas/30 p-8 text-center">
                  <PackagePlus className="mx-auto h-8 w-8 text-emerald-500 mb-2" />
                  <h4 className="text-xs font-bold text-ink-900">No products found</h4>
                  <p className="text-[11px] text-ink-500 mt-1 mb-3">
                    Add items with MRP, selling rate, and stock count.
                  </p>
                  <button
                    onClick={() => setIsQuickAddOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <Plus className="h-3.5 w-3.5" /> Add Product
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-ink-500">
                  No matching product found for "{searchTerm}".
                </div>
              ) : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      onClick={() => addToCart(p)}
                      className="group flex items-center justify-between rounded-lg border border-ink-700/10 bg-white p-2.5 hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer transition shadow-xs"
                    >
                      <div>
                        <h3 className="text-xs font-bold text-ink-900 group-hover:text-emerald-700">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-2 text-[10px] text-ink-500 mt-0.5">
                          <span className="font-semibold text-ink-700 bg-ink-100 px-1.5 py-0.2 rounded">
                            {p.brand || "Generic"}
                          </span>
                          <span>Stock: {p.currentStock} {p.unit}</span>
                          <span className="text-emerald-700 font-bold font-mono">
                            Rate: ₹{p.sellingPrice}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold text-ink-900 font-mono">
                          MRP {formatINR(p.mrp || p.sellingPrice)}
                        </div>
                        <span className="text-[9.5px] text-emerald-700 font-semibold block">
                          + Add to Bill
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Customer Info, Cart & Non-GST Pricing (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-xl border border-ink-700/10 bg-white p-5 shadow-panel space-y-4">
              
              {/* 1. BILL TYPE & CUSTOMER SELECTION */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-500/10 via-canvas to-canvas p-4 text-xs space-y-3 border-2 border-emerald-500/30 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-700/10 pb-2">
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] font-bold text-ink-800 uppercase">Bill Type:</label>
                    <div className="inline-flex rounded-lg border border-ink-700/20 bg-white p-0.5">
                      {(["Cash Memo", "Estimate", "Retail Slip"] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setBillType(t)}
                          className={clsx(
                            "px-2.5 py-1 text-[11px] font-bold rounded-md transition",
                            billType === t
                              ? "bg-emerald-600 text-white shadow-xs"
                              : "text-ink-600 hover:text-ink-900"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    No: {billNumber}
                  </span>
                </div>

                {/* Optional Customer Selector */}
                {customers.length > 0 && (
                  <div>
                    <label className="block text-[10px] font-bold text-ink-700 uppercase mb-1">
                      Pick Customer from Khata (Optional):
                    </label>
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => handleCustomerSelect(e.target.value)}
                      className="w-full rounded-lg border border-ink-700/20 bg-white p-2 text-xs font-bold text-ink-900 focus:border-emerald-500 focus:outline-none shadow-xs"
                    >
                      <option value="walkin">Direct Manual Entry / Counter Walk-in</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          👤 {c.name} {c.phone ? `(${c.phone})` : ""} {c.address ? `• ${c.address}` : ""} {c.outstandingBalance > 0 ? `[Due: ₹${c.outstandingBalance}]` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Customer Details Form */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-ink-900 mb-1">
                      Customer / Buyer Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="Enter Customer Name (e.g. Ramesh Sahoo / Pradeep Contractor)"
                      className="w-full rounded-lg border-2 border-emerald-400 bg-white p-2 text-sm font-black text-ink-950 placeholder:font-normal placeholder:text-ink-400 focus:border-emerald-600 focus:outline-none shadow-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-ink-700 mb-0.5">
                        Mobile Phone Number
                      </label>
                      <input
                        type="text"
                        value={buyerPhone}
                        onChange={(e) => setBuyerPhone(e.target.value)}
                        placeholder="e.g. 9876543210"
                        className="w-full rounded border border-ink-700/20 bg-white p-1.5 font-mono text-xs text-ink-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-ink-700 mb-0.5">
                        Village / Town / Address
                      </label>
                      <input
                        type="text"
                        value={buyerAddress}
                        onChange={(e) => setBuyerAddress(e.target.value)}
                        placeholder="e.g. Patkura, Garadpur, Kendrapara"
                        className="w-full rounded border border-ink-700/20 bg-white p-1.5 text-xs text-ink-900 focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. CART ITEMS (MRP, DISC %, NET RATE) */}
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 text-xs">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-xs text-ink-500 border border-dashed border-ink-200 rounded-lg">
                    <ShoppingBag className="mx-auto h-8 w-8 text-ink-300 mb-2" />
                    Cart is empty. Click items on the left catalog to add to bill.
                  </div>
                ) : (
                  cart.map((item, idx) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-ink-700/15 bg-canvas/30 p-3 space-y-2.5 shadow-xs"
                    >
                      {/* Item Header */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-emerald-700 mr-1.5">#{idx + 1}</span>
                          <strong className="text-ink-900 text-xs">{item.name}</strong>
                          <span className="text-[10px] text-ink-500 ml-2 font-mono">
                            {item.brand} • {item.unit}
                          </span>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-ink-400 hover:text-red-500 p-1"
                          title="Remove Item"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Pricing Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center bg-white p-2.5 rounded-lg border border-ink-700/10">
                        {/* Qty */}
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-ink-600 uppercase">Qty:</label>
                          <div className="flex items-center gap-1 mt-0.5">
                            <button
                              onClick={() => updateQty(item.id, item.qty - 1)}
                              className="h-5 w-5 rounded border border-ink-700/20 bg-ink-50 font-bold text-xs"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-mono font-bold text-ink-900 text-xs">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => updateQty(item.id, item.qty + 1)}
                              className="h-5 w-5 rounded border border-ink-700/20 bg-ink-50 font-bold text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* MRP */}
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-ink-700 uppercase">
                            MRP (₹):
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.mrp}
                            onChange={(e) => updateItemMrp(item.id, Number(e.target.value) || 0)}
                            className="w-full rounded border border-ink-700/20 bg-white px-1.5 py-0.5 font-mono font-bold text-xs text-ink-900 focus:border-emerald-500 focus:outline-none"
                          />
                        </div>

                        {/* Discount % */}
                        <div className="sm:col-span-3">
                          <label className="block text-[9px] font-bold text-emerald-700 uppercase flex items-center gap-0.5">
                            <BadgePercent className="h-3 w-3 text-emerald-600" /> Disc %:
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0%"
                            value={item.discountPercent || ""}
                            onChange={(e) => updateDiscountPercent(item.id, Number(e.target.value) || 0)}
                            className="w-full rounded border border-emerald-400 bg-emerald-50/20 px-1.5 py-0.5 font-mono text-xs text-ink-900 text-center font-bold"
                          />
                        </div>

                        {/* Net Rate */}
                        <div className="sm:col-span-3 text-right">
                          <label className="block text-[9px] font-bold text-ink-500 uppercase">Net Rate:</label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.netRate}
                            onChange={(e) => updateNetRate(item.id, Number(e.target.value) || 0)}
                            className="w-full text-right rounded border border-ink-700/20 px-1 py-0.5 font-mono font-bold text-xs text-ink-900"
                          />
                          <span className="block text-[10px] font-mono font-black text-ink-900 mt-0.5">
                            Total: {formatINR(item.totalAmount)}
                          </span>
                        </div>
                      </div>

                      {/* Optional Serial Numbers */}
                      <div className="pt-1.5 border-t border-ink-700/10">
                        {item.qty === 1 ? (
                          <input
                            type="text"
                            placeholder="Serial / Model No (Optional for warranty)"
                            value={item.serialNumbers?.[0] || item.serialNumber || ""}
                            onChange={(e) => updateItemUnitSerialNumber(item.id, 0, e.target.value)}
                            className="w-full rounded border border-ink-700/20 bg-white px-2 py-1 font-mono text-[10.5px] text-ink-900 focus:border-emerald-500 focus:outline-none"
                          />
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-canvas/60 p-1.5 rounded">
                            {Array.from({ length: item.qty }).map((_, uIdx) => (
                              <div key={uIdx} className="flex items-center gap-1">
                                <span className="text-[9px] font-mono text-emerald-700 shrink-0">#{uIdx + 1}</span>
                                <input
                                  type="text"
                                  placeholder={`Unit ${uIdx + 1} Serial / Batch`}
                                  value={item.serialNumbers?.[uIdx] || ""}
                                  onChange={(e) => updateItemUnitSerialNumber(item.id, uIdx, e.target.value)}
                                  className="w-full rounded border border-ink-700/20 bg-white px-1.5 py-0.5 font-mono text-[10px]"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* 3. TOTALS, PAYMENT & SUBMIT */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-ink-700/15 space-y-4">
                  {/* Payment Mode Selector */}
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-ink-700 uppercase">Payment Mode:</label>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                      {[
                        { id: "CASH", label: "Cash", icon: Banknote },
                        { id: "UPI / QR", label: "UPI / QR", icon: QrCode },
                        { id: "KHATA (CREDIT)", label: "Khata (Due)", icon: FileText },
                        { id: "CARD", label: "Card", icon: CreditCard },
                        { id: "BANK TRANSFER", label: "Bank", icon: Building },
                      ].map((p) => {
                        const Icon = p.icon;
                        const isSelected = paymentMode === p.id;
                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setPaymentMode(p.id);
                              if (p.id === "KHATA (CREDIT)") {
                                setPaymentStatus("Pending / Khata");
                              } else {
                                setPaymentStatus("Paid");
                              }
                            }}
                            className={clsx(
                              "flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg border text-xs font-bold transition",
                              isSelected
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                                : "bg-white text-ink-700 border-ink-700/20 hover:bg-ink-50"
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" />
                            <span>{p.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Box */}
                  <div className="rounded-xl bg-ink-950 text-canvas p-4 space-y-2">
                    <div className="flex justify-between text-xs text-ink-400">
                      <span>Total MRP Amount ({cart.reduce((s, i) => s + i.qty, 0)} Units):</span>
                      <span className="font-mono">{formatINR(totalMrpAmount)}</span>
                    </div>
                    {totalSavings > 0 && (
                      <div className="flex justify-between text-xs text-emerald-400 font-bold">
                        <span>Total Customer Savings (Discount):</span>
                        <span className="font-mono">- {formatINR(totalSavings)}</span>
                      </div>
                    )}
                    {roundOff !== 0 && (
                      <div className="flex justify-between text-xs text-ink-400">
                        <span>Round Off:</span>
                        <span className="font-mono">{roundOff > 0 ? `+${roundOff}` : roundOff}</span>
                      </div>
                    )}
                    <div className="border-t border-ink-800 pt-2 flex justify-between items-baseline">
                      <span className="text-sm font-black text-canvas uppercase tracking-wider">
                        Net Grand Total:
                      </span>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        {formatINR(grandTotal)}
                      </span>
                    </div>
                    <div className="text-[10.5px] text-ink-400 italic">
                      Amount in words: {numberToWordsINR(grandTotal)}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => finalizeBill(true)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 py-3 text-xs font-bold text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition"
                    >
                      <Printer className="h-4 w-4" /> Save & Print {billType}
                    </button>
                    <button
                      type="button"
                      onClick={() => finalizeBill(false)}
                      className="flex items-center justify-center gap-2 rounded-lg border border-ink-700/30 bg-white py-3 text-xs font-bold text-ink-800 hover:bg-ink-50 transition"
                    >
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Save {billType} (Next Bill)
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Add Modal */}
      {isQuickAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs no-print">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-ink-700/20 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-ink-900">Quick Add Product</h3>
              <button
                onClick={() => setIsQuickAddOpen(false)}
                className="text-ink-500 hover:text-ink-900 text-sm font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleQuickAdd} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={qName}
                  onChange={(e) => setQName(e.target.value)}
                  placeholder="e.g. Havells 1.5 sq mm Wire / Anchor Switch"
                  className="w-full rounded border p-2 text-xs text-ink-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={qBrand}
                    onChange={(e) => setQBrand(e.target.value)}
                    placeholder="e.g. Havells / Anchor / Finolex"
                    className="w-full rounded border p-2 text-xs text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Unit</label>
                  <select
                    value={qUnit}
                    onChange={(e) => setQUnit(e.target.value)}
                    className="w-full rounded border p-2 text-xs text-ink-900"
                  >
                    <option value="Pcs">Pcs</option>
                    <option value="Nos">Nos</option>
                    <option value="Coil">Coil</option>
                    <option value="Mtr">Mtr</option>
                    <option value="Set">Set</option>
                    <option value="Box">Box</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Printed MRP *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={qMrp}
                    onChange={(e) => setQMrp(e.target.value)}
                    placeholder="100"
                    className="w-full rounded border p-2 text-xs font-mono font-bold text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Selling Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={qSellingPrice}
                    onChange={(e) => setQSellingPrice(e.target.value)}
                    placeholder="85"
                    className="w-full rounded border p-2 text-xs font-mono font-bold text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={qStock}
                    onChange={(e) => setQStock(e.target.value)}
                    placeholder="50"
                    className="w-full rounded border p-2 text-xs font-mono text-ink-900"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsQuickAddOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Save & Add to Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. PRINT MODAL & CLEAN NON-GST CASH MEMO FORMAT */}
      <div
        className={clsx(
          isPreviewOpen
            ? "fixed inset-0 z-50 flex items-center justify-center bg-ink-950/80 p-2 sm:p-6 overflow-y-auto backdrop-blur-xs print:static print:p-0 print:m-0 print:bg-transparent print:block print:overflow-visible"
            : "hidden print:block"
        )}
      >
        <div className="relative w-full max-w-3xl rounded-xl bg-white p-6 shadow-2xl my-auto text-ink-950 font-sans border border-ink-300 print:static print:p-0 print:m-0 print:border-none print:shadow-none print:w-full print:max-w-none print:rounded-none">
          {/* Modal Actions (No print) */}
          <div className="no-print mb-4 flex items-center justify-between border-b pb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-ink-900">
                Print Preview: {billType} ({billNumber})
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
              >
                <Printer className="h-3.5 w-3.5" /> Print Now
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPreviewOpen(false);
                  setCart([]);
                  setBillNumber(getNextNonGstBillNumber(billType));
                }}
                className="rounded-lg border px-3 py-1.5 text-xs font-bold text-ink-700 hover:bg-ink-100"
              >
                Close & New Bill
              </button>
            </div>
          </div>

          {/* PRINTABLE BILL CANVAS */}
          <div className="printable-bill bg-white p-4 text-[11px] leading-tight text-ink-950 border border-ink-950">
            {/* Receipt Header with Official Logo */}
            <div className="border-b-2 border-ink-950 pb-2 mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo.png"
                  alt="Rudra Electricals"
                  width={46}
                  height={46}
                  className="logo-img h-11 w-11 shrink-0 rounded-full border border-ink-400 object-cover shadow-xs"
                  style={{ width: "46px", height: "46px", minWidth: "46px", minHeight: "46px" }}
                />
                <div>
                  <h2 className="text-base font-black tracking-tight uppercase text-ink-950">
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
                  {billType.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Bill Details & Customer Details */}
            <div className="grid grid-cols-2 gap-4 pb-2 border-b border-ink-900 text-[11px]">
              <div>
                <p>
                  <span className="font-bold text-ink-700">Customer Name:</span>{" "}
                  <strong className="font-black text-ink-950">{buyerName || "Walk-in Customer"}</strong>
                </p>
                {buyerPhone && (
                  <p>
                    <span className="font-bold text-ink-700">Phone:</span>{" "}
                    <span className="font-mono">{buyerPhone}</span>
                  </p>
                )}
                {buyerAddress && (
                  <p>
                    <span className="font-bold text-ink-700">Address:</span> {buyerAddress}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p>
                  <span className="font-bold text-ink-700">Bill No:</span>{" "}
                  <strong className="font-mono font-bold text-ink-950">{billNumber}</strong>
                </p>
                <p>
                  <span className="font-bold text-ink-700">Date:</span> {billDate}
                </p>
                <p>
                  <span className="font-bold text-ink-700">Payment:</span>{" "}
                  <strong className="uppercase">{paymentMode} ({paymentStatus})</strong>
                </p>
              </div>
            </div>

            {/* Items Table */}
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
                {cart.map((item, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="py-1 px-1 text-center font-mono text-[10.5px]">{idx + 1}</td>
                    <td className="py-1 px-2">
                      <div className="font-bold text-ink-950">{item.name}</div>
                      {item.serialNumber && (
                        <div className="text-[9.5px] text-ink-600 font-mono">
                          SN: {item.serialNumber}
                        </div>
                      )}
                    </td>
                    <td className="py-1 px-1 text-center font-mono font-semibold">
                      {item.qty} {item.unit}
                    </td>
                    <td className="py-1 px-1 text-right font-mono">₹{item.mrp.toFixed(2)}</td>
                    <td className="py-1 px-1 text-center font-mono">
                      {item.discountPercent > 0 ? `${item.discountPercent}%` : "-"}
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

            {/* Total & Summary Block */}
            <div className="border-t-2 border-ink-950 pt-2 space-y-1">
              <div className="flex justify-between text-[11px]">
                <span>Total Items: <strong>{cart.length}</strong> ({cart.reduce((s, i) => s + i.qty, 0)} Units)</span>
                <div className="space-y-0.5 text-right font-mono">
                  <div className="flex justify-end gap-6 text-[10.5px]">
                    <span>Total MRP:</span>
                    <span>₹{totalMrpAmount.toFixed(2)}</span>
                  </div>
                  {totalSavings > 0 && (
                    <div className="flex justify-end gap-6 text-emerald-800 font-bold text-[10.5px]">
                      <span>Discount Savings:</span>
                      <span>- ₹{totalSavings.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-end gap-6 font-black text-sm pt-1 border-t border-ink-400">
                    <span>NET AMOUNT:</span>
                    <span className="text-base font-bold">₹{grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-1.5 border-t border-ink-300">
                <p className="text-[10.5px] italic">
                  <strong>Rupees in words:</strong> {numberToWordsINR(grandTotal)}
                </p>
              </div>
            </div>

            {/* Signatures & Footer Note */}
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
      </div>
    </div>
  );
}
