import type { Metadata } from "next";
import "@fontsource-variable/nunito";
import "@fontsource-variable/newsreader/wght.css";
import { SessionProvider } from "@/features/auth/session";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CREA · Orientación tributaria para restaurantes", template: "%s · CREA" },
  description: "Evalúa el régimen tributario de tu restaurante en Cajamarca y consulta las reglas y obligaciones de SUNAT.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-PE" data-scroll-behavior="smooth">
      <body>
        <SessionProvider>
          <SiteHeader />
          <main id="contenido" tabIndex={-1}>{children}</main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  );
}
