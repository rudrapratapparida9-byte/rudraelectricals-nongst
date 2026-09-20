"use client";

import { useState, useEffect } from "react";
import {
  Boxes,
  Search,
  Plus,
  Minus,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  Package,
} from "lucide-react";
import clsx from "clsx";
import {
  NonGstProduct,
  getStoredNonGstProducts,
  adjustNonGstProductStock,
} from "@/lib/storage/nonGstInventoryStorage";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function NonGstStockPage() {
  const [products, setProducts] = useState<NonGstProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [adjustingProd, setAdjustingProd] = useState<NonGstProduct | null>(null);
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustType, setAdjustType] = useState<"ADD" | "DEDUCT">("ADD");

  useEffect(() => {
    setProducts(getStoredNonGstProducts());
    function reload() {
      setProducts(getStoredNonGstProducts());
    }
    window.addEventListener("nongst-inventory-updated", reload);
    return () => window.removeEventListener("nongst-inventory-updated", reload);
  }, []);

  const categories = ["all", ...Array.from(new Set(products.map((p) => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === "all" || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  function handleAdjustSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adjustingProd || !adjustQty) return;

    const delta = (adjustType === "ADD" ? 1 : -1) * (Number(adjustQty) || 0);
    adjustNonGstProductStock(adjustingProd.id, delta);

    setProducts(getStoredNonGstProducts());
    setAdjustingProd(null);
    setAdjustQty("");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">
            Non-GST Stock Ledger
          </h1>
          <p className="text-xs text-ink-600">
            Monitor stock inventory counts, adjust item quantities, and manage low stock alerts.
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total Tracked Items</span>
          <p className="text-lg font-black text-ink-900 font-mono mt-1">{products.length}</p>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total In-Stock Units</span>
          <p className="text-lg font-black text-emerald-700 font-mono mt-1">
            {products.reduce((s, p) => s + p.currentStock, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total Inventory Value</span>
          <p className="text-lg font-black text-blue-700 font-mono mt-1">
            {formatINR(products.reduce((s, p) => s + p.sellingPrice * p.currentStock, 0))}
          </p>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Low Stock Alerts</span>
          <p className="text-lg font-black text-amber-700 font-mono mt-1">
            {products.filter((p) => p.currentStock <= p.minimumStock).length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <input
            type="text"
            placeholder="Search Non-GST stock by item, brand, or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-ink-700/20 bg-white pl-9 pr-4 py-2 text-xs text-ink-900 focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="rounded-lg border border-ink-700/20 bg-white px-3 py-2 text-xs font-bold text-ink-800 focus:border-emerald-500 focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Stock Table */}
      <div className="rounded-xl border border-ink-700/10 bg-white shadow-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-700/10 bg-canvas/60 text-ink-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Item & Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Min Stock Alert</th>
                <th className="py-3 px-4 text-center">Available Stock</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-center">Quick Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/10 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-500">
                    No items found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isLow = p.currentStock <= p.minimumStock;
                  return (
                    <tr key={p.id} className="hover:bg-ink-50/60 transition">
                      <td className="py-3 px-4">
                        <div className="font-bold text-ink-900">{p.name}</div>
                        <div className="text-[10px] text-ink-500 font-mono">
                          {p.brand} • SKU: {p.sku}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="bg-ink-100 text-ink-700 px-2 py-0.5 rounded text-[10.5px]">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-ink-600">
                        {p.minimumStock} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 font-mono font-black text-xs px-2.5 py-1 rounded",
                            isLow
                              ? "bg-amber-100 text-amber-900 border border-amber-300"
                              : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                          )}
                        >
                          {isLow && <AlertTriangle className="h-3 w-3 text-amber-600" />}
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink-900">
                        {formatINR(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => {
                            setAdjustingProd(p);
                            setAdjustQty("");
                            setAdjustType("ADD");
                          }}
                          className="inline-flex items-center gap-1 rounded bg-ink-100 hover:bg-emerald-100 hover:text-emerald-800 text-ink-800 px-2.5 py-1 text-xs font-bold transition"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Modal */}
      {adjustingProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-2xl space-y-4 border">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-ink-900">Adjust Stock Count</h3>
              <button
                onClick={() => setAdjustingProd(null)}
                className="text-ink-500 hover:text-ink-900 font-bold"
              >
                ✕
              </button>
            </div>
            <div>
              <h4 className="text-xs font-bold text-ink-900">{adjustingProd.name}</h4>
              <p className="text-[11px] text-ink-500 font-mono mt-0.5">
                Current Stock: <strong>{adjustingProd.currentStock} {adjustingProd.unit}</strong>
              </p>
            </div>
            <form onSubmit={handleAdjustSubmit} className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType("ADD")}
                  className={clsx(
                    "flex-1 py-1.5 text-xs font-bold rounded border transition",
                    adjustType === "ADD"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-ink-700"
                  )}
                >
                  + Add Stock
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType("DEDUCT")}
                  className={clsx(
                    "flex-1 py-1.5 text-xs font-bold rounded border transition",
                    adjustType === "DEDUCT"
                      ? "bg-amber-600 text-white border-amber-600"
                      : "bg-white text-ink-700"
                  )}
                >
                  - Deduct Stock
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">
                  Quantity ({adjustingProd.unit}) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full rounded border p-2 text-xs font-mono font-bold text-ink-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setAdjustingProd(null)}
                  className="rounded px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
