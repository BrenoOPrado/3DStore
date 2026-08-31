import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Chatbot } from "./Chatbot";

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);

  return null;
}

export function Layout() {
  return (
    <div className="layout">
      <ScrollToTop />
      <Header />
      <main className="layout__main">
        <Outlet />
      </main>
      <Footer />
      <Chatbot />
    </div>
  );
}
