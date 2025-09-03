import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import NotFound from "@/components/pages/not-found/not-found";
import { K_LOCALE } from "@/i18n/stored-locale";

const locale = localStorage.getItem(K_LOCALE) || "en-US";

export const Route = createRootRoute({
  component: RootComponent,
  notFoundComponent: NotFound,
});

export function RootComponent() {
  document.documentElement.lang = locale;
  return (
    <>
      <HeadContent />
      <Header />
      <Outlet />
      <Footer />
    </>
  );
}

export default RootComponent;
