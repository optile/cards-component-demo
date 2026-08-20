import { create } from "zustand";
import type { Book } from "@/features/expressCheckout/types/express";

export const CURRENCY = "USD";
const FREE_SHIPPING_THRESHOLD = 50;
const FLAT_SHIPPING = 5;

export interface CartItem extends Book {
  quantity: number;
}

export interface PlacedOrder {
  items: CartItem[];
  total: number;
  id: string;
}

interface ExpressCartState {
  items: CartItem[];
  lastOrder: PlacedOrder | null;
  // True when `lastOrder` came from the cart checkout (→ the cart should be emptied once the receipt
  // shows), false for a PDP "buy it now" (→ leave the shopper's cart untouched). The Success page
  // reads this on mount to decide whether to clear; we deliberately DON'T clear inside `placeOrder`,
  // because emptying the cart while still on the checkout route trips its empty-cart bounce and steals
  // the navigation to the success page.
  lastOrderFromCart: boolean;
  add: (book: Book, qty?: number) => void;
  updateQty: (id: number, delta: number) => void;
  removeItem: (id: number) => void;
  clear: () => void;
  // Snapshots the current cart into `lastOrder` for the receipt (marks it a cart order). Does NOT
  // clear the cart — the Success page does that on mount so leaving the receipt any way can't strand
  // the purchased items, and so it happens off the checkout route (no empty-cart bounce).
  placeOrder: () => PlacedOrder;
  // Snapshots an ARBITRARY item list into `lastOrder` WITHOUT mutating the cart (PDP "buy it now"),
  // so a single-book purchase leaves the shopper's cart untouched.
  placeOrderFor: (items: CartItem[]) => PlacedOrder;
}

export const useExpressCartStore = create<ExpressCartState>((set, get) => ({
  items: [],
  lastOrder: null,
  lastOrderFromCart: false,

  add: (book, qty = 1) =>
    set((state) => {
      const existing = state.items.find((i) => i.id === book.id);
      if (existing) {
        return {
          items: state.items.map((i) =>
            i.id === book.id ? { ...i, quantity: i.quantity + qty } : i
          ),
        };
      }
      return { items: [...state.items, { ...book, quantity: qty }] };
    }),

  updateQty: (id, delta) =>
    set((state) => ({
      items: state.items.map((i) =>
        i.id === id ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
      ),
    })),

  removeItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

  clear: () => set({ items: [] }),

  // Snapshot ANY item list into a receipt without touching the cart. Used by the PDP buy-now (which
  // leaves the cart alone) and reused by placeOrder for the cart flow.
  placeOrderFor: (items) => {
    const snapshot = items.slice();
    const order: PlacedOrder = {
      items: snapshot,
      total: totalOf(snapshot),
      id: "#PT-" + String(Math.floor(1000 + Math.random() * 9000)),
    };
    set({ lastOrder: order, lastOrderFromCart: false });
    return order;
  },

  placeOrder: () => {
    const order = get().placeOrderFor(get().items);
    set({ lastOrderFromCart: true });
    return order;
  },
}));

// Pure cart math (design parity). Kept as functions so components subscribe to `items` and recompute.
// Demo simplification: money is a JS float here and stringified via `toFixed(2)` at the express seam
// (see ExpressDropInProps). A production integration should use minor-unit integers (cents) to avoid
// float rounding.
export const subtotalOf = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.price * i.quantity, 0);

export const shippingOf = (items: CartItem[]): number =>
  subtotalOf(items) > FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING;

export const totalOf = (items: CartItem[]): number => subtotalOf(items) + shippingOf(items);

export const countOf = (items: CartItem[]): number =>
  items.reduce((sum, i) => sum + i.quantity, 0);
