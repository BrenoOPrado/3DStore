import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, ApiError, apiMutate } from "../api/client";
import type { QuoteResult, Snapshot } from "../api/types";
import type {
  Address,
  Card,
  ChartData,
  Coupon,
  CouponType,
  Customer,
  CustomerStatus,
  Order,
  OrderStatus,
  PublicUser,
} from "../data/commerce";
import type { CustomerFilter } from "../data/customerRules";
import { type Product } from "../data/products";

type PlaceOrderInput = {
  addressId?: string;
  address?: Omit<Address, "id"> & { id?: string };
  saveAddress?: boolean;
  shippingId: string;
  couponCodes: string[];
  payments: { cardId: string; amount: number }[];
  items: { productId: string; color: string; quantity: number }[];
};

const emptySnapshot: Snapshot = {
  user: null,
  catalog: [],
  categories: [],
  customers: [],
  orders: [],
  coupons: [],
  myOrders: [],
  myCoupons: [],
  myUsedCoupons: [],
  lastOrderId: null,
};

type StoreValue = {
  ready: boolean;
  user: PublicUser | null;
  customers: PublicUser[];
  orders: Order[];
  coupons: Coupon[];
  catalog: Product[];
  login: (email: string, password: string) => Promise<string | null>;
  signup: (data: {
    name: string;
    email: string;
    password: string;
    passwordConfirm: string;
    cpf: string;
    gender: string;
    birthDate: string;
    phoneType: string;
    phoneDdd: string;
    phoneNumber: string;
    address: Omit<Address, "id">;
  }) => Promise<string | null>;
  logout: () => Promise<void>;
  updateProfile: (
    data: Partial<Pick<Customer, "name" | "phone" | "gender" | "birthDate" | "cpf" | "phoneType" | "phoneDdd" | "phoneNumber">>
  ) => Promise<string | null>;
  changePassword: (currentPassword: string, next: string, confirm: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  setCustomerStatus: (id: string, status: CustomerStatus) => Promise<string | null>;
  addAddress: (address: Omit<Address, "id">) => Promise<Address | { error: string }>;
  updateAddress: (address: Address) => Promise<string | null>;
  removeAddress: (id: string) => Promise<string | null>;
  addCard: (
    card: Omit<Card, "id" | "last4" | "brand" | "preferred"> & {
      brand?: string;
      number: string;
      cvv?: string;
      preferred?: boolean;
    }
  ) => Promise<Card | { error: string }>;
  removeCard: (id: string) => Promise<void>;
  setPreferredCard: (id: string) => Promise<string | null>;
  addProduct: (data: Omit<Product, "id" | "rating" | "reviews"> & Partial<Pick<Product, "rating" | "reviews">>) =>
    Promise<string | { error: string }>;
  updateProduct: (product: Product) => Promise<string | null>;
  deleteProduct: (id: string) => Promise<string | null>;
  addCoupon: (data: {
    code: string;
    value: number;
    description: string;
    type?: CouponType;
    ownerEmail?: string;
  }) => Promise<string | { error: string }>;
  removeCoupon: (id: string) => Promise<string | null>;
  myOrders: Order[];
  myCoupons: Coupon[];
  myUsedCoupons: Coupon[];
  quoteCheckout: (input: {
    items: { productId: string; color: string; quantity: number }[];
    couponCodes: string[];
    shippingId?: string;
    cep: string;
  }) => Promise<QuoteResult | { error: string }>;
  placeOrder: (input: PlaceOrderInput) => Promise<string | { error: string }>;
  cancelOrder: (id: string) => Promise<string | null>;
  confirmReceipt: (id: string) => Promise<string | null>;
  requestExchange: (orderId: string, itemId: string, qty: number) => Promise<string | null>;
  dispatchExchangeItem: (orderId: string) => Promise<string | null>;
  adminSetStatus: (orderId: string, status: OrderStatus) => Promise<string | null>;
  loadChart: (categoryIds?: string[]) => Promise<ChartData | { error: string }>;
  searchCustomers: (filter: CustomerFilter) => Promise<Customer[]>;
  lastOrderId: string | null;
};

const StoreContext = createContext<StoreValue | null>(null);

function pickSnapshot(data: Record<string, unknown>): Snapshot {
  return {
    user: (data.user as PublicUser | null) ?? null,
    catalog: (data.catalog as Product[]) ?? [],
    categories: (data.categories as Snapshot["categories"]) ?? [],
    customers: (data.customers as Customer[]) ?? [],
    orders: (data.orders as Order[]) ?? [],
    coupons: (data.coupons as Coupon[]) ?? [],
    myOrders: (data.myOrders as Order[]) ?? [],
    myCoupons: (data.myCoupons as Coupon[]) ?? [],
    myUsedCoupons: (data.myUsedCoupons as Coupon[]) ?? [],
    lastOrderId: (data.lastOrderId as string | null) ?? null,
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Snapshot>(emptySnapshot);
  const [ready, setReady] = useState(false);

  const apply = useCallback((data: Record<string, unknown>) => {
    setState(pickSnapshot(data));
  }, []);

  const refresh = useCallback(async () => {
    const data = await api<Snapshot>("/api/bootstrap");
    setState(data);
  }, []);

  useEffect(() => {
    refresh()
      .catch(() => setState(emptySnapshot))
      .finally(() => setReady(true));
  }, [refresh]);

  const value = useMemo<StoreValue>(() => {
    const errOf = (data: Record<string, unknown>) =>
      typeof data.error === "string" ? data.error : null;

    const mutate = async (path: string, init?: RequestInit) => {
      const data = await apiMutate(path, init);
      const error = errOf(data);
      if (!error) apply(data);
      return { data, error };
    };

    const login = async (email: string, password: string) => {
      try {
        const data = await api<Snapshot>("/api/auth/login", {
          method: "POST",
          body: JSON.stringify({ email, password }),
        });
        apply(data);
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "E-mail ou senha inválidos.";
      }
    };

    const signup: StoreValue["signup"] = async (payload) => {
      try {
        const data = await api<Snapshot>("/api/auth/signup", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        apply(data);
        return null;
      } catch (err) {
        return err instanceof ApiError ? err.message : "Não foi possível cadastrar.";
      }
    };

    const logout = async () => {
      const data = await api<Snapshot>("/api/auth/logout", { method: "POST" });
      apply(data);
    };

    const updateProfile: StoreValue["updateProfile"] = async (payload) => {
      const { error } = await mutate("/api/account", { method: "PATCH", body: JSON.stringify(payload) });
      return error;
    };

    const changePassword: StoreValue["changePassword"] = async (currentPassword, next, confirm) => {
      const { error } = await mutate("/api/account/password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, next, confirm }),
      });
      return error;
    };

    const deleteAccount = async () => {
      const { error } = await mutate("/api/account", { method: "DELETE" });
      return error;
    };

    const setCustomerStatus: StoreValue["setCustomerStatus"] = async (id, status) => {
      const { error } = await mutate(`/api/admin/customers/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return error;
    };

    const addAddress: StoreValue["addAddress"] = async (address) => {
      const { data, error } = await mutate("/api/account/addresses", {
        method: "POST",
        body: JSON.stringify(address),
      });
      if (error) return { error };
      return (data.address as Address) ?? { error: "Não foi possível salvar o endereço." };
    };

    const updateAddress: StoreValue["updateAddress"] = async (address) => {
      const { error } = await mutate(`/api/account/addresses/${address.id}`, {
        method: "PUT",
        body: JSON.stringify(address),
      });
      return error;
    };

    const removeAddress: StoreValue["removeAddress"] = async (id) => {
      const { error } = await mutate(`/api/account/addresses/${id}`, { method: "DELETE" });
      return error;
    };

    const addCard: StoreValue["addCard"] = async (card) => {
      const { data, error } = await mutate("/api/account/cards", {
        method: "POST",
        body: JSON.stringify(card),
      });
      if (error) return { error };
      return (data.card as Card) ?? { error: "Não foi possível salvar o cartão." };
    };

    const removeCard: StoreValue["removeCard"] = async (id) => {
      await mutate(`/api/account/cards/${id}`, { method: "DELETE" });
    };

    const setPreferredCard: StoreValue["setPreferredCard"] = async (id) => {
      const { error } = await mutate(`/api/account/cards/${id}/preferred`, { method: "POST" });
      return error;
    };

    const addProduct: StoreValue["addProduct"] = async (payload) => {
      const { data, error } = await mutate("/api/admin/products", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (error) return { error };
      return String(data.id ?? "");
    };

    const updateProduct: StoreValue["updateProduct"] = async (product) => {
      const { error } = await mutate(`/api/admin/products/${product.id}`, {
        method: "PUT",
        body: JSON.stringify(product),
      });
      return error;
    };

    const deleteProduct: StoreValue["deleteProduct"] = async (id) => {
      const { error } = await mutate(`/api/admin/products/${id}`, { method: "DELETE" });
      return error;
    };

    const addCoupon: StoreValue["addCoupon"] = async (payload) => {
      const { data, error } = await mutate("/api/admin/coupons", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (error) return { error };
      return String(data.id ?? "");
    };

    const removeCoupon: StoreValue["removeCoupon"] = async (id) => {
      const { error } = await mutate(`/api/admin/coupons/${id}`, { method: "DELETE" });
      return error;
    };

    const quoteCheckout: StoreValue["quoteCheckout"] = async (input) => {
      try {
        return await api<QuoteResult>("/api/checkout/quote", {
          method: "POST",
          body: JSON.stringify(input),
        });
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : "Não foi possível calcular o pedido." };
      }
    };

    const placeOrder: StoreValue["placeOrder"] = async (input) => {
      const { data, error } = await mutate("/api/orders", {
        method: "POST",
        body: JSON.stringify(input),
      });
      if (error) return { error };
      return String(data.id ?? "");
    };

    const cancelOrder: StoreValue["cancelOrder"] = async (id) => {
      const { error } = await mutate(`/api/orders/${id}/cancel`, { method: "POST" });
      return error;
    };

    const confirmReceipt: StoreValue["confirmReceipt"] = async (id) => {
      const { error } = await mutate(`/api/orders/${id}/confirm-receipt`, { method: "POST" });
      return error;
    };

    const requestExchange: StoreValue["requestExchange"] = async (orderId, itemId, qty) => {
      const { error } = await mutate(`/api/orders/${orderId}/exchange`, {
        method: "POST",
        body: JSON.stringify({ itemId, qty }),
      });
      return error;
    };

    const dispatchExchangeItem: StoreValue["dispatchExchangeItem"] = async (orderId) => {
      const { error } = await mutate(`/api/orders/${orderId}/dispatch-item`, { method: "POST" });
      return error;
    };

    const adminSetStatus: StoreValue["adminSetStatus"] = async (orderId, status) => {
      const { error } = await mutate(`/api/admin/orders/${orderId}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      return error;
    };

    const loadChart: StoreValue["loadChart"] = async (categoryIds = []) => {
      try {
        const qs = categoryIds.length ? `?categories=${categoryIds.join(",")}` : "";
        return await api<ChartData>(`/api/admin/chart${qs}`);
      } catch (err) {
        return { error: err instanceof ApiError ? err.message : "Não foi possível carregar o gráfico." };
      }
    };

    const searchCustomers: StoreValue["searchCustomers"] = async (filter) => {
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value) params.set(key, value);
      });
      const data = await api<{ customers: Customer[] }>(`/api/admin/customers?${params.toString()}`);
      return data.customers;
    };

    return {
      ready,
      user: state.user,
      customers: state.customers,
      orders: state.orders,
      coupons: state.coupons,
      catalog: state.catalog,
      login,
      signup,
      logout,
      updateProfile,
      changePassword,
      deleteAccount,
      setCustomerStatus,
      addAddress,
      updateAddress,
      removeAddress,
      addCard,
      removeCard,
      setPreferredCard,
      addProduct,
      updateProduct,
      deleteProduct,
      addCoupon,
      removeCoupon,
      myOrders: state.myOrders,
      myCoupons: state.myCoupons,
      myUsedCoupons: state.myUsedCoupons,
      quoteCheckout,
      placeOrder,
      cancelOrder,
      confirmReceipt,
      requestExchange,
      dispatchExchangeItem,
      adminSetStatus,
      loadChart,
      searchCustomers,
      lastOrderId: state.lastOrderId,
    };
  }, [apply, ready, state]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}

export function useAuth() {
  const { user, login, signup, logout } = useStore();
  return { user, login, signup, logout };
}
