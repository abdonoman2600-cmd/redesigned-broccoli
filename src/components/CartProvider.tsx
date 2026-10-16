"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react";
import { calcShipping } from "@/lib/format";
import { useSite } from "./SiteProvider";

export type CartItem = {
  key: string; // productId::optionLabel
  productId: number;
  slug: string;
  name: string;
  image: string;
  unit: string;
  unitPrice: number;
  optionLabel: string | null;
  variant: string | null;
  color: string | null;
  size: string | null;
  quantity: number;
  minQty: number;
  step: number;
};

type State = { items: CartItem[]; hydrated: boolean };

type Action =
  | { type: "hydrate"; items: CartItem[] }
  | { type: "add"; item: CartItem }
  | { type: "setQty"; key: string; quantity: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

const STORAGE_KEY = "rashid-cart-v1";

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { items: action.items, hydrated: true };
    case "add": {
      const existing = state.items.find((i) => i.key === action.item.key);
      if (existing) {
        return {
          ...state,
          items: state.items.map((i) =>
            i.key === action.item.key
              ? { ...i, quantity: i.quantity + action.item.quantity }
              : i,
          ),
        };
      }
      return { ...state, items: [...state.items, action.item] };
    }
    case "setQty":
      return {
        ...state,
        items: state.items.map((i) =>
          i.key === action.key
            ? { ...i, quantity: Math.max(i.minQty, action.quantity) }
            : i,
        ),
      };
    case "remove":
      return { ...state, items: state.items.filter((i) => i.key !== action.key) };
    case "clear":
      return { ...state, items: [] };
  }
}

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem, open?: boolean) => void;
  setQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function cartKey(productId: number, optionLabel: string | null, variant = "") {
  return `${productId}::${optionLabel ?? ""}::${variant}`;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { items: [], hydrated: false });
  const [isOpen, setIsOpen] = useState(false);
  const site = useSite();

  // hydrate from localStorage
  useEffect(() => {
    let items: CartItem[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) items = parsed.map((i: CartItem) => ({ ...i, variant: i.variant ?? null, color: i.color ?? null, size: i.size ?? null }));
      }
    } catch {
      /* ignore */
    }
    dispatch({ type: "hydrate", items });
  }, []);

  // persist
  useEffect(() => {
    if (!state.hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items));
    } catch {
      /* ignore */
    }
  }, [state.items, state.hydrated]);

  // sync across tabs
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue ? JSON.parse(e.newValue) : [];
        if (Array.isArray(parsed)) dispatch({ type: "hydrate", items: parsed });
      } catch {
        /* ignore */
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // lock scroll + esc when drawer open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const addItem = useCallback((item: CartItem, open = true) => {
    dispatch({ type: "add", item });
    if (open) setIsOpen(true);
  }, []);
  const setQuantity = useCallback(
    (key: string, quantity: number) => dispatch({ type: "setQty", key, quantity }),
    [],
  );
  const removeItem = useCallback((key: string) => dispatch({ type: "remove", key }), []);
  const clear = useCallback(() => dispatch({ type: "clear" }), []);
  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = state.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const shipping = calcShipping(subtotal, site.shipFee, site.shipFreeOver);
    return {
      items: state.items,
      hydrated: state.hydrated,
      count: state.items.length,
      subtotal,
      shipping,
      total: subtotal + shipping,
      isOpen,
      openCart,
      closeCart,
      addItem,
      setQuantity,
      removeItem,
      clear,
    };
  }, [state, isOpen, site.shipFee, site.shipFreeOver, openCart, closeCart, addItem, setQuantity, removeItem, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
