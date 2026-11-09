import { createContext, useContext, useMemo, type ReactNode } from "react";
import { type Product } from "../data/products";
import { useStore } from "./StoreContext";

export type CartItem = {
  productId: string;
  quantity: number;
  color: string;
};

type CartContextValue = {
  items: CartItem[];
  expired: CartItem[];
  add: (productId: string, color: string, quantity?: number) => Promise<string | null>;
  remove: (productId: string, color: string) => Promise<string | null>;
  setQty: (productId: string, color: string, quantity: number) => Promise<string | null>;
  clear: () => Promise<string | null>;
  dismissExpired: () => Promise<string | null>;
  count: number;
  subtotal: number;
  error: string | null;
  buyDisabled: boolean;
  expiresAt: string | null;
  warnAt: string | null;
  detailed: { product: Product; quantity: number; color: string; line: number; stock: number }[];
  expiredDetailed: { product: Product; quantity: number; color: string; line: number }[];
};

const CartContext = createContext<CartContextValue | null>(null);

function stockOf(product: Product | undefined) {
  if (!product) return 0;
  return typeof product.stock === "number" ? product.stock : 20;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const {
    catalog,
    user,
    cart,
    addToCart,
    setCartQty,
    removeCartItem,
    clearCart,
    dismissExpiredCart,
  } = useStore();

  const value = useMemo<CartContextValue>(() => {
    const items = cart?.items ?? [];
    const expired = cart?.expired ?? [];
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
    const expiredDetailed = expired
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
      .filter(Boolean) as CartContextValue["expiredDetailed"];

    return {
      items,
      expired,
      add: async (productId, color, quantity = 1) => {
        if (!user) return "Entre para adicionar itens ao carrinho.";
        return addToCart(productId, color, quantity);
      },
      remove: (productId, color) => removeCartItem(productId, color),
      setQty: (productId, color, quantity) => setCartQty(productId, color, quantity),
      clear: () => clearCart(),
      dismissExpired: () => dismissExpiredCart(),
      count: items.reduce((a, b) => a + b.quantity, 0),
      subtotal: detailed.reduce((a, b) => a + b.line, 0),
      error: null,
      buyDisabled: Boolean(cart?.buyDisabled),
      expiresAt: cart?.expiresAt ?? null,
      warnAt: cart?.warnAt ?? null,
      detailed,
      expiredDetailed,
    };
  }, [
    addToCart,
    cart,
    catalog,
    clearCart,
    dismissExpiredCart,
    removeCartItem,
    setCartQty,
    user,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
