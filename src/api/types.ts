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
import type { CategoryId, Product } from "../data/products";

export type Snapshot = {
  user: PublicUser | null;
  catalog: Product[];
  categories: { id: CategoryId; label: string; icon: string; tint: string }[];
  customers: Customer[];
  orders: Order[];
  coupons: Coupon[];
  myOrders: Order[];
  myCoupons: Coupon[];
  myUsedCoupons: Coupon[];
  lastOrderId: string | null;
};

export type QuoteResult = {
  subtotal: number;
  discount: number;
  discountPercent: number;
  options: { id: "pac" | "sedex" | "retirada"; name: string; days: string; price: number }[];
  shipping: { id: "pac" | "sedex" | "retirada"; name: string; days: string; price: number } | null;
  shippingPrice: number;
  total: number;
};

export type { Address, Card, ChartData, Coupon, CouponType, Customer, CustomerStatus, Order, OrderStatus, PublicUser, Product };
