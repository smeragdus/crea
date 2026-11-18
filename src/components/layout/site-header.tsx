"use client";

import { ArrowUpRight, LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "@/features/auth/session";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/primitives";
import { useActiveAssessment } from "@/features/evaluation/assessment-entry";
import { Brand } from "./brand";

const pages = [
  { path: "/", label: "Inicio" },
  { path: "/comparar", label: "Comparar regímenes" },
  { path: "/obligaciones", label: "Consultar obligaciones" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [menuPath, setMenuPath] = useState<string | null>(null);
  const menuOpen = menuPath === pathname;
  const { user, signOut, mode } = useSession();
  const active = useActiveAssessment();
  const workspaceLabel = user ? "Mis evaluaciones" : active ? "Mi diagnóstico" : undefined;
  const [error, setError] = useState(false);
  const modeLabel = mode === "demo" ? "Modo demostración" : mode === "offline" ? "Cuentas sin conexión" : null;

  async function logout() {
    try {
      await signOut();
      setError(false);
    } catch {
      setError(true);
    }
  }

  return <>
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <header className="site-header">
      <div className="container-site header-inner">
        <Brand />
        {modeLabel && <span className="mode-label mobile-mode">{modeLabel}</span>}
        <Button size="icon" variant="outline" className="mobile-menu" aria-expanded={menuOpen} aria-controls="site-menu" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} onClick={() => setMenuPath(menuOpen ? null : pathname)}>
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
        <div id="site-menu" className="site-menu" data-open={menuOpen} onKeyDown={(event) => {
          if (event.key === "Escape" && menuOpen) {
            setMenuPath(null);
            document.querySelector<HTMLButtonElement>(".mobile-menu")?.focus();
          }
        }}>
          <nav className="primary-nav" aria-label="Navegación principal">
            {pages.map(({ path, label }) => <Link key={path} href={path} aria-current={pathname === path ? "page" : undefined} onClick={() => setMenuPath(null)}>{label}</Link>)}
            {workspaceLabel && <Link href="/negocios" aria-current={pathname === "/negocios" ? "page" : undefined} onClick={() => setMenuPath(null)}>{workspaceLabel}</Link>}
          </nav>
          <div className="header-actions">
            {modeLabel && <span className="mode-label">{modeLabel}</span>}
            {user
              ? <Button variant="ghost" onClick={logout}>Salir <LogOut aria-hidden="true" /></Button>
              : <LinkButton href="/ingresar" variant="outline" onClick={() => setMenuPath(null)}>Ingresar <ArrowUpRight aria-hidden="true" /></LinkButton>}
          </div>
        </div>
      </div>
      {error && <p role="alert" className="container-site pb-2 text-sm text-destructive">No pudimos cerrar tu sesión. Intenta de nuevo.</p>}
    </header>
  </>;
}
