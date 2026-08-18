import { create } from "zustand";

interface ExpressShopState {
  currentBookId: string | null;
  quantity: number;
  currency: string;
  setBook: (id: string) => void;
  setQuantity: (q: number) => void;
  getBookPrice: (price: number) => number;
}

export const useExpressShopStore = create<ExpressShopState>((set, get) => ({
  currentBookId: null,
  quantity: 1,
  currency: "USD",
  setBook: (id) => set({ currentBookId: id, quantity: 1 }),
  setQuantity: (q) => set({ quantity: Math.max(1, Math.floor(q) || 1) }),
  getBookPrice: (price) => price * get().quantity,
}));
