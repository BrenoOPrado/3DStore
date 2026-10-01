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
  add: (productId: string, color: string, quantity?: number) => string | null;
  remove: (productId: string, color: string) => void;
  setQty: (productId: string, color: string, quantity: number) => string | null;
  clear: () => void;
  count: number;
  subtotal: number;
  error: string | null;
  detailed: { product: Product; quantity: number; color: string; line: number; stock: number }[];
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

function stockOf(product: Product | undefined) {
  if (!product) return 0;
  return typeof product.stock === "number" ? product.stock : 20;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { catalog, user } = useStore();
  const userId = user?.id ?? null;
  const [items, setItems] = useState<CartItem[]>(() => load(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(load(userId));
    setError(null);
  }, [userId]);

  const persist = (next: CartItem[]) => {
    setItems(next);
    localStorage.setItem(cartKey(userId), JSON.stringify(next));
  };

  const value = useMemo<CartContextValue>(() => {
    const qtyOf = (list: CartItem[], productId: string) =>
      list.filter((x) => x.productId === productId).reduce((sum, x) => sum + x.quantity, 0);

    const add = (productId: string, color: string, quantity = 1) => {
      if (!user) return "Entre para adicionar itens ao carrinho.";
      const product = catalog.find((p) => p.id === productId);
      const stock = stockOf(product);
      if (!product || stock <= 0) {
        const msg = "Produto indisponível em estoque.";
        setError(msg);
        return msg;
      }
      const next = [...items];
      const i = next.findIndex((x) => x.productId === productId && x.color === color);
      const proposed = qtyOf(items, productId) + quantity;
      if (proposed > stock) {
        const msg = `Quantidade acima do estoque (${stock}).`;
        setError(msg);
        return msg;
      }
      if (i >= 0) next[i] = { ...next[i], quantity: next[i].quantity + quantity };
      else next.push({ productId, color, quantity });
      setError(null);
      persist(next);
      return null;
    };
    const remove = (productId: string, color: string) => {
      setError(null);
      persist(items.filter((x) => !(x.productId === productId && x.color === color)));
    };
    const setQty = (productId: string, color: string, quantity: number) => {
      if (quantity <= 0) {
        remove(productId, color);
        return null;
      }
      const product = catalog.find((p) => p.id === productId);
      const stock = stockOf(product);
      const others = items
        .filter((x) => x.productId === productId && x.color !== color)
        .reduce((sum, x) => sum + x.quantity, 0);
      if (others + quantity > stock) {
        const msg = `Quantidade acima do estoque (${stock}).`;
        setError(msg);
        return msg;
      }
      setError(null);
      persist(
        items.map((x) => (x.productId === productId && x.color === color ? { ...x, quantity } : x))
      );
      return null;
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
          stock: stockOf(product),
        };
      })
      .filter(Boolean) as CartContextValue["detailed"];

    return {
      items,
      add,
      remove,
      setQty,
      clear: () => {
        setError(null);
        persist([]);
      },
      count: items.reduce((a, b) => a + b.quantity, 0),
      subtotal: detailed.reduce((a, b) => a + b.line, 0),
      error,
      detailed,
    };
  }, [catalog, items, user, userId, error]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
