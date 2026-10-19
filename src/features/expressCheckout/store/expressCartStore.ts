import { create } from "zustand";
import { getBook } from "@/features/expressCheckout/constants/books";
import type { Book } from "@/features/expressCheckout/types/express";

const CART_STORAGE_KEY = "pageturner.cart.v1";

const MAX_LINE_QUANTITY = 99;
const clampQuantity = (q: number) => Math.min(Math.max(1, q), MAX_LINE_QUANTITY);

type PersistedLine = { id: number; quantity: number };

function isPersistedLine(row: unknown): row is PersistedLine {
  if (!row || typeof row !== "object") return false;
  const { id, quantity } = row as Record<string, unknown>;
  return (
    Number.isSafeInteger(id) &&
    typeof quantity === "number" &&
    Number.isFinite(quantity) &&
    quantity >= 1
  );
}

// Reading `localStorage` itself throws when site data is blocked, so every access stays in a try.
function itemsFromStorageValue(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const byId = new Map<number, CartItem>();
    for (const row of parsed) {
      if (!isPersistedLine(row)) continue;
      const book = getBook(row.id);
      if (!book) continue;
      const quantity = Math.min(
        (byId.get(row.id)?.quantity ?? 0) + Math.floor(row.quantity),
        MAX_LINE_QUANTITY,
      );
      byId.set(row.id, { ...book, quantity });
    }
    return [...byId.values()];
  } catch {
    return [];
  }
}

function loadPersistedItems(): CartItem[] {
  try {
    return itemsFromStorageValue(localStorage.getItem(CART_STORAGE_KEY));
  } catch {
    return [];
  }
}

function persistItems(items: CartItem[]): void {
  const payload: PersistedLine[] = items.map((i) => ({ id: i.id, quantity: i.quantity }));
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota / blocked storage — the cart still works in memory for this tab.
  }
}

export const CURRENCY = "USD";
export const FREE_SHIPPING_THRESHOLD = 50;
const FLAT_SHIPPING = 5;

export interface CartItem extends Book {
  quantity: number;
}

// Commerce-only receipt overrides sourced from the wallet's `final` ExpressOrderDetails. No buyer PII
// (address/name/email) - the SDK does not expose it; fetch it server-side from the CHARGE if needed.
export interface ExpressOrderOverrides {
  total: number;
  shippingAmount?: number;
  shippingLabel?: string;
  /** Estimated tax included in `total` (card/demo orders). */
  taxAmount?: number;
  /** The receipt shows the live cart, whose total differs from what was charged. */
  cartChanged?: boolean;
}

export interface PlacedOrder {
  items: CartItem[];
  total: number;
  id: string;
  expressOverrides?: ExpressOrderOverrides;
}

interface ExpressCartState {
  items: CartItem[];
  lastOrder: PlacedOrder | null;
  // True when `lastOrder` came from the cart checkout (-> the cart should be emptied once the receipt
  // shows), false for a PDP "buy it now" (-> leave the shopper's cart untouched). The Success page
  // reads this on mount to decide whether to clear; we deliberately DON'T clear inside `placeOrder`,
  // because emptying the cart while still on the checkout route trips its empty-cart bounce and steals
  // the navigation to the success page.
  lastOrderFromCart: boolean;
  add: (book: Book, qty?: number) => void;
  updateQty: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clear: () => void;
  placeOrder: (expressOverrides?: ExpressOrderOverrides, items?: CartItem[]) => PlacedOrder;
  placeOrderFor: (items: CartItem[], expressOverrides?: ExpressOrderOverrides) => PlacedOrder;
}

export const useExpressCartStore = create<ExpressCartState>((set, get) => ({
  items: loadPersistedItems(),
  lastOrder: null,
  lastOrderFromCart: false,

  add: (book, qty = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === book.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === book.id ? { ...i, quantity: clampQuantity(i.quantity + qty) } : i
          ),
        };
      }
      return { items: [...state.items, { ...book, quantity: clampQuantity(qty) }] };
    }),

  updateQty: (id, delta) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: clampQuantity(i.quantity + delta) } : i
      ),
    })),

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  clear: () => set({ items: [] }),

  placeOrderFor: (items, expressOverrides?) => {
    const snapshot = items.slice();
    const order: PlacedOrder = {
      items: snapshot,
      total: expressOverrides?.total ?? totalOf(snapshot),
      id: "#PT-" + String(Math.floor(1000 + Math.random() * 9000)),
      ...(expressOverrides ? { expressOverrides } : {}),
    };
    set({ lastOrder: order, lastOrderFromCart: false });
    return order;
  },

  placeOrder: (expressOverrides?, items?) => {
    const order = get().placeOrderFor(items ?? get().items, expressOverrides);
    set({ lastOrderFromCart: true });
    return order;
  },
}));

let applyingStorageEvent = false;

useExpressCartStore.subscribe((state, prev) => {
  if (state.items === prev.items || applyingStorageEvent) return;
  persistItems(state.items);
});

// Another tab changed the cart (e.g. paid and cleared it): adopt its copy so this tab cannot write
// stale lines back.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== CART_STORAGE_KEY) return;
    applyingStorageEvent = true;
    try {
      useExpressCartStore.setState({ items: itemsFromStorageValue(e.newValue) });
    } finally {
      applyingStorageEvent = false;
    }
  });
}

// Pure cart math (design parity). Kept as functions so components subscribe to `items` and recompute.
// Demo simplification: money is a JS float here and stringified via `toFixed(2)` at the express seam
// (see ExpressDropInProps). The card LIST totals round through integer cents (utils/cardTotals.ts); a
// production integration should keep all money in minor units.
export const subtotalOf = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const shippingOf = (items: CartItem[]): number =>
  subtotalOf(items) > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

export const totalOf = (items: CartItem[]): number => subtotalOf(items) + shippingOf(items);

export const countOf = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.quantity, 0);
