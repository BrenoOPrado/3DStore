import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { type Product } from "../data/products";
import { useStore } from "./StoreContext";

export type CartItem = {
  productId: string;
  quantity: number;
  color: string;
};

type CartContextValue = {
  items: CartItem[];
  add: (productId: string, color: string, quantity?: number) => boolean;
  remove: (productId: string, color: string) => void;
  setQty: (productId: string, color: string, quantity: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  detailed: { product: Product; quantity: number; color: string; line: number }[];
};

const CartContext = createContext<CartContextValue | null>(null);

function cartKey(userId: string | null) {
  return userId ? `3dstore-cart:${userId}` : "3dstore-cart:guest";
}

function load(userId: string | null): CartItem[] {
  try {
    const raw = localStorage.getItem(cartKey(userId));
    if (raw) return JSON.parse(raw) as CartItem[];
    if (!userId) {
      const legacy = localStorage.getItem("3dstore-cart");
      return legacy ? (JSON.parse(legacy) as CartItem[]) : [];
    }
    return [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { catalog, user } = useStore();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<CartItem[]>(() => load(userId));

  useEffect(() => {
    setItems(load(userId));
  }, [userId]);

  const persist = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(cartKey(userId), JSON.stringify(next));
  };

  const value = useMemo<CartContextValue>(() => {
    const add = (productId: string, color: string, quantity = 1) => {
      if (!user) return false;
      const next = [...items];
      const i = next.findIndex((x) => x.productId === productId && x.color === color);
      if (i >= 0) next[i] = { ...next[i], quantity: next[i].quantity + quantity };
      else next.push({ productId, color, quantity });
      persist(next);
      return true;
    };
    const remove = (productId: string, color: string) =>
      persist(items.filter((x) => !(x.productId === productId && x.color === color)));
    const setQty = (productId: string, color: string, quantity: number) => {
      if (quantity <= 0) return remove(productId, color);
      persist(
        items.map((x) =>
          x.productId === productId && x.color === color ? { ...x, quantity } : x
        )
      );
    };
    const detailed = items
      .map((item) => {
        const product = catalog.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          product,
          quantity: item.quantity,
          color: item.color,
          line: product.price * item.quantity,
        };
      })
      .filter(Boolean) as CartContextValue["detailed"];

    return {
      items,
      add,
      remove,
      setQty,
      clear: () => persist([]),
      count: items.reduce((a, b) => a + b.quantity, 0),
      subtotal: detailed.reduce((a, b) => a + b.line, 0),
      detailed,
    };
  }, [catalog, items, user, userId]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
