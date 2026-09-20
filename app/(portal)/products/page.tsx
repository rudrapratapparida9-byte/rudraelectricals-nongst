"use client";

import { useState, useEffect } from "react";
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Boxes,
  AlertTriangle,
  CheckCircle2,
  Tag,
  DollarSign,
} from "lucide-react";
import clsx from "clsx";
import {
  NonGstProduct,
  getStoredNonGstProducts,
  addNonGstProductToStorage,
  updateNonGstProductInStorage,
  deleteNonGstProductFromStorage,
} from "@/lib/storage/nonGstInventoryStorage";

function formatINR(n: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
}

export default function NonGstProductsPage() {
  const [products, setProducts] = useState<NonGstProduct[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<NonGstProduct | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("Wires & Cables");
  const [unit, setUnit] = useState("Pcs");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [mrp, setMrp] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("10");

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

  function handleOpenAdd() {
    setEditingProduct(null);
    setName("");
    setBrand("");
    setCategory("Wires & Cables");
    setUnit("Pcs");
    setPurchasePrice("");
    setSellingPrice("");
    setMrp("");
    setStock("");
    setMinStock("10");
    setIsModalOpen(true);
  }

  function handleOpenEdit(p: NonGstProduct) {
    setEditingProduct(p);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setUnit(p.unit);
    setPurchasePrice(p.purchasePrice.toString());
    setSellingPrice(p.sellingPrice.toString());
    setMrp(p.mrp.toString());
    setStock(p.currentStock.toString());
    setMinStock(p.minimumStock.toString());
    setIsModalOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    const baseSku = editingProduct
      ? editingProduct.sku
      : `${brand ? brand.slice(0, 3).toUpperCase() : "ITM"}-${Math.floor(1000 + Math.random() * 9000)}`;

    const parsedMrp = Number(mrp) || 0;
    const parsedSelling = Number(sellingPrice) || parsedMrp;

    if (editingProduct) {
      updateNonGstProductInStorage(editingProduct.id, {
        name: name.trim(),
        brand: brand.trim() || "Generic",
        category,
        unit,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: parsedSelling,
        mrp: parsedMrp,
        currentStock: Number(stock) || 0,
        minimumStock: Number(minStock) || 5,
      });
    } else {
      addNonGstProductToStorage({
        name: name.trim(),
        brand: brand.trim() || "Generic",
        category,
        sku: baseSku,
        unit,
        purchasePrice: Number(purchasePrice) || 0,
        sellingPrice: parsedSelling,
        mrp: parsedMrp,
        currentStock: Number(stock) || 0,
        minimumStock: Number(minStock) || 5,
      });
    }

    setProducts(getStoredNonGstProducts());
    setIsModalOpen(false);
  }

  function handleDelete(id: string) {
    if (confirm("Are you sure you want to delete this product from Non-GST catalog?")) {
      deleteNonGstProductFromStorage(id);
      setProducts(getStoredNonGstProducts());
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink-900">
            Non-GST Product Catalog
          </h1>
          <p className="text-xs text-ink-600">
            Manage your separate Non-GST inventory, counter selling rates, and printed MRPs.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500 shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="h-4 w-4" /> Add Non-GST Product
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total Items</span>
          <p className="text-lg font-black text-ink-900 font-mono mt-1">{products.length}</p>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total Units in Stock</span>
          <p className="text-lg font-black text-emerald-700 font-mono mt-1">
            {products.reduce((s, p) => s + p.currentStock, 0)}
          </p>
        </div>
        <div className="rounded-xl border border-ink-700/10 bg-white p-4 shadow-panel">
          <span className="text-[11px] font-bold text-ink-500 uppercase">Total Retail MRP Value</span>
          <p className="text-lg font-black text-blue-700 font-mono mt-1">
            {formatINR(products.reduce((s, p) => s + p.mrp * p.currentStock, 0))}
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
            placeholder="Search Non-GST products by name, brand, or SKU..."
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

      {/* Product Table */}
      <div className="rounded-xl border border-ink-700/10 bg-white shadow-panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-ink-700/10 bg-canvas/60 text-ink-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="py-3 px-4">Item & Brand</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-right">Printed MRP</th>
                <th className="py-3 px-4 text-right">Selling Rate</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-700/10 font-medium">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-ink-500">
                    No Non-GST products found.
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
                        <span className="bg-ink-100 text-ink-700 px-2 py-0.5 rounded text-[10.5px] font-semibold">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-ink-900">
                        {formatINR(p.mrp)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 text-sm">
                        {formatINR(p.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={clsx(
                            "inline-flex items-center gap-1 font-mono font-bold text-xs px-2 py-0.5 rounded",
                            isLow
                              ? "bg-amber-100 text-amber-800"
                              : "bg-emerald-100 text-emerald-800"
                          )}
                        >
                          {p.currentStock} {p.unit}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 rounded hover:bg-ink-100 text-ink-600 hover:text-ink-900"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 rounded hover:bg-red-50 text-ink-400 hover:text-red-600"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Add / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-ink-700/20 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-ink-900">
                {editingProduct ? "Edit Non-GST Product" : "Add New Non-GST Product"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-ink-500 hover:text-ink-900 font-bold"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-ink-700 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Havells 1.5 sq mm Wire"
                  className="w-full rounded border p-2 text-xs text-ink-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Havells / Anchor"
                    className="w-full rounded border p-2 text-xs text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded border p-2 text-xs text-ink-900"
                  >
                    <option value="Wires & Cables">Wires & Cables</option>
                    <option value="Switches & Sockets">Switches & Sockets</option>
                    <option value="Lighting & Luminaires">Lighting & Luminaires</option>
                    <option value="Fans & Air Movement">Fans & Air Movement</option>
                    <option value="Switchgear & MCB">Switchgear & MCB</option>
                    <option value="Conduits & Pipes">Conduits & Pipes</option>
                    <option value="General Electrical">General Electrical</option>
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
                    value={mrp}
                    onChange={(e) => setMrp(e.target.value)}
                    placeholder="100"
                    className="w-full rounded border p-2 text-xs font-mono font-bold text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Selling Rate *</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(e.target.value)}
                    placeholder="85"
                    className="w-full rounded border p-2 text-xs font-mono font-bold text-emerald-700"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Purchase Cost</label>
                  <input
                    type="number"
                    step="0.01"
                    value={purchasePrice}
                    onChange={(e) => setPurchasePrice(e.target.value)}
                    placeholder="70"
                    className="w-full rounded border p-2 text-xs font-mono text-ink-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    className="w-full rounded border p-2 text-xs font-mono text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Min Alert Qty</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(e.target.value)}
                    placeholder="10"
                    className="w-full rounded border p-2 text-xs font-mono text-ink-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-ink-700 mb-1">Unit</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
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

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded px-3 py-1.5 text-xs text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 shadow-sm"
                >
                  {editingProduct ? "Update Product" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
