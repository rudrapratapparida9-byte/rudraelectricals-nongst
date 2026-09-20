"use client";

export interface NonGstProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: string;
  unit: string;
  purchasePrice: number;
  sellingPrice: number; // Counter Selling Rate
  mrp: number; // Printed Maximum Retail Price
  currentStock: number;
  minimumStock: number;
  serialNumber?: string;
  created_at: string;
}

const NONGST_INVENTORY_KEY = "rudra_nongst_products_catalog";

export const INITIAL_NONGST_PRODUCTS: NonGstProduct[] = [
  {
    id: "ng-prod-01",
    sku: "HAV-WIR-1.5",
    name: "Havells LifeLine Plus 1.5 sq mm FR Wire (90m Coil, Red)",
    brand: "Havells",
    category: "Wires & Cables",
    unit: "Coil",
    purchasePrice: 1550,
    sellingPrice: 1850,
    mrp: 2450,
    currentStock: 35,
    minimumStock: 10,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-02",
    sku: "HAV-WIR-2.5",
    name: "Havells LifeLine Plus 2.5 sq mm FR Wire (90m Coil, Yellow)",
    brand: "Havells",
    category: "Wires & Cables",
    unit: "Coil",
    purchasePrice: 2400,
    sellingPrice: 2850,
    mrp: 3750,
    currentStock: 25,
    minimumStock: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-03",
    sku: "POL-WIR-4.0",
    name: "Polycab 4.0 sq mm Green Wires FRLS (90m Box)",
    brand: "Polycab",
    category: "Wires & Cables",
    unit: "Coil",
    purchasePrice: 3600,
    sellingPrice: 4200,
    mrp: 5400,
    currentStock: 15,
    minimumStock: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-04",
    sku: "ANC-SW-6A",
    name: "Anchor Roma 6A 1-Way Modular Switch White",
    brand: "Anchor",
    category: "Switches & Sockets",
    unit: "Nos",
    purchasePrice: 24,
    sellingPrice: 38,
    mrp: 65,
    currentStock: 200,
    minimumStock: 40,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-05",
    sku: "ANC-SCK-16A",
    name: "Anchor Roma 16A 3-Pin Modular Power Socket White",
    brand: "Anchor",
    category: "Switches & Sockets",
    unit: "Nos",
    purchasePrice: 85,
    sellingPrice: 125,
    mrp: 180,
    currentStock: 80,
    minimumStock: 20,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-06",
    sku: "PHI-LED-9W",
    name: "Philips Stellar Bright 9W Cool Daylight LED Bulb (B22)",
    brand: "Philips",
    category: "Lighting & Luminaires",
    unit: "Nos",
    purchasePrice: 70,
    sellingPrice: 110,
    mrp: 175,
    currentStock: 120,
    minimumStock: 25,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-07",
    sku: "CRO-FAN-1200",
    name: "Crompton Aura Prime 1200mm High Speed Ceiling Fan (Brown)",
    brand: "Crompton",
    category: "Fans & Air Movement",
    unit: "Set",
    purchasePrice: 1850,
    sellingPrice: 2250,
    mrp: 2990,
    currentStock: 14,
    minimumStock: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-08",
    sku: "SCH-MCB-32A",
    name: "Schneider Acti9 32A C-Curve Double Pole MCB",
    brand: "Schneider",
    category: "Switchgear & MCB",
    unit: "Nos",
    purchasePrice: 390,
    sellingPrice: 540,
    mrp: 720,
    currentStock: 30,
    minimumStock: 8,
    created_at: new Date().toISOString(),
  },
  {
    id: "ng-prod-09",
    sku: "SUP-PVC-25",
    name: "Supreme 25mm Heavy Duty PVC Conduit Pipe (3m Length)",
    brand: "Supreme",
    category: "Conduits & Pipes",
    unit: "Nos",
    purchasePrice: 65,
    sellingPrice: 95,
    mrp: 130,
    currentStock: 150,
    minimumStock: 50,
    created_at: new Date().toISOString(),
  },
];

export function getStoredNonGstProducts(): NonGstProduct[] {
  if (typeof window === "undefined") return INITIAL_NONGST_PRODUCTS;
  try {
    const raw = localStorage.getItem(NONGST_INVENTORY_KEY);
    if (!raw) {
      localStorage.setItem(NONGST_INVENTORY_KEY, JSON.stringify(INITIAL_NONGST_PRODUCTS));
      return INITIAL_NONGST_PRODUCTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NONGST_PRODUCTS;
  }
}

export function saveNonGstProducts(products: NonGstProduct[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(NONGST_INVENTORY_KEY, JSON.stringify(products));
    window.dispatchEvent(new Event("nongst-inventory-updated"));
  } catch (err) {
    console.error("Failed to save Non-GST products:", err);
  }
}

export function addNonGstProductToStorage(
  prod: Omit<NonGstProduct, "id" | "created_at">
): NonGstProduct {
  const all = getStoredNonGstProducts();
  const newProduct: NonGstProduct = {
    ...prod,
    id: `ng-prod-${Date.now()}`,
    created_at: new Date().toISOString(),
  };

  const updated = [newProduct, ...all];
  saveNonGstProducts(updated);
  return newProduct;
}

export function updateNonGstProductInStorage(
  id: string,
  updates: Partial<NonGstProduct>
): NonGstProduct | null {
  const all = getStoredNonGstProducts();
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return null;

  all[index] = { ...all[index], ...updates };
  saveNonGstProducts(all);
  return all[index];
}

export function deleteNonGstProductFromStorage(id: string): void {
  const all = getStoredNonGstProducts();
  const filtered = all.filter((p) => p.id !== id);
  saveNonGstProducts(filtered);
}

export function adjustNonGstProductStock(id: string, deltaQty: number): void {
  const all = getStoredNonGstProducts();
  const index = all.findIndex((p) => p.id === id);
  if (index === -1) return;

  all[index].currentStock = Math.max(0, (all[index].currentStock || 0) + deltaQty);
  saveNonGstProducts(all);
}
