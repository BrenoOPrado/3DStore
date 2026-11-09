import type {
  Address,
  Card,
  CartSnapshot,
  ChartData,
  Coupon,
  CouponType,
  Customer,
  CustomerStatus,
  Order,
  OrderStatus,
  PublicUser,
  StoreNotification,
} from "../data/commerce";
import type { CategoryId, Product } from "../data/products";

export type Snapshot = {
  user: PublicUser | null;
  catalog: Product[];
  adminCatalog?: Product[];
  categories: { id: CategoryId; label: string; icon: string; tint: string }[];
  customers: Customer[];
  orders: Order[];
  coupons: Coupon[];
  myOrders: Order[];
  myCoupons: Coupon[];
  myUsedCoupons: Coupon[];
  lastOrderId: string | null;
  cart?: CartSnapshot;
  notifications?: StoreNotification[];
  logs?: {
    id: string;
    at: string;
    userEmail: string;
    action: string;
    entity: string;
    payload: unknown;
  }[];
};

export type QuoteResult = {
  subtotal: number;
  discount: number;
  couponSum: number;
  couponExcess: number;
  freightNote: string;
  options: { id: "pac" | "sedex" | "retirada"; name: string; days: string; price: number }[];
  shipping: { id: "pac" | "sedex" | "retirada"; name: string; days: string; price: number } | null;
  shippingPrice: number;
  total: number;
};

export type { Address, Card, CartSnapshot, ChartData, Coupon, CouponType, Customer, CustomerStatus, Order, OrderStatus, PublicUser, Product, StoreNotification };
