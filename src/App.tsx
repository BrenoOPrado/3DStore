import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { StoreProvider } from "./context/StoreContext";
import { CartProvider } from "./context/CartContext";
import { Layout } from "./components/Layout";
import { HomePage } from "./pages/HomePage";
import { CatalogPage } from "./pages/CatalogPage";
import { ReleasesPage } from "./pages/ReleasesPage";
import { AboutPage } from "./pages/AboutPage";
import { ProductPage } from "./pages/ProductPage";
import { CartPage } from "./pages/CartPage";
import { CheckoutPage } from "./pages/CheckoutPage";
import { OrderSuccessPage } from "./pages/OrderSuccessPage";
import { LoginPage, SignupPage } from "./pages/AuthPages";
import { AccountLayout } from "./pages/account/AccountLayout";
import { AccountProfilePage } from "./pages/account/AccountProfilePage";
import { AccountPasswordPage } from "./pages/account/AccountPasswordPage";
import { AccountAddressesPage } from "./pages/account/AccountAddressesPage";
import { AccountCardsPage } from "./pages/account/AccountCardsPage";
import { AccountCouponsPage } from "./pages/account/AccountCouponsPage";
import { AccountOrdersPage } from "./pages/account/AccountOrdersPage";
import { AccountOrderDetailPage } from "./pages/account/AccountOrderDetailPage";
import { AdminLayout } from "./pages/admin/AdminLayout";
import { AdminChartPage } from "./pages/admin/AdminChartPage";
import { AdminCustomersPage } from "./pages/admin/AdminCustomersPage";
import { AdminCustomerRoute, AdminOrderDetailPage, AdminOrdersPage } from "./pages/admin/AdminOrdersPage";
import { AdminProductsPage } from "./pages/admin/AdminProductsPage";
import { AdminCouponsPage } from "./pages/admin/AdminCouponsPage";

export default function App() {
  return (
    <StoreProvider>
      <CartProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/catalogo" element={<CatalogPage />} />
              <Route path="/lancamentos" element={<ReleasesPage />} />
              <Route path="/sobre" element={<AboutPage />} />
              <Route path="/produto/:id" element={<ProductPage />} />
              <Route path="/carrinho" element={<CartPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/pedido-confirmado" element={<OrderSuccessPage />} />
              <Route path="/entrar" element={<LoginPage />} />
              <Route path="/cadastro" element={<SignupPage />} />
              <Route path="/conta" element={<AccountLayout />}>
                <Route index element={<AccountProfilePage />} />
                <Route path="senha" element={<AccountPasswordPage />} />
                <Route path="enderecos" element={<AccountAddressesPage />} />
                <Route path="cartoes" element={<AccountCardsPage />} />
                <Route path="cupons" element={<AccountCouponsPage />} />
                <Route path="pedidos" element={<AccountOrdersPage />} />
                <Route path="pedidos/:id" element={<AccountOrderDetailPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminChartPage />} />
              <Route path="clientes" element={<AdminCustomersPage />} />
              <Route path="clientes/:id" element={<AdminCustomerRoute />} />
              <Route path="pedidos" element={<AdminOrdersPage />} />
              <Route path="pedidos/:id" element={<AdminOrderDetailPage />} />
              <Route path="produtos" element={<AdminProductsPage />} />
              <Route path="cupons" element={<AdminCouponsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CartProvider>
    </StoreProvider>
  );
}
