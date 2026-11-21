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

  if (pathname === "/") return <>
    <a href="#contenido" className="skip-link">Saltar al contenido</a>
    <header className="bg-[#edf5fb] px-4 pt-5 font-[Arial,Helvetica,sans-serif] sm:px-6">
      <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 rounded-t-[28px] bg-white px-6 py-6 sm:px-14">
        <Link href="/" aria-label="CREA, inicio" className="text-4xl font-black tracking-tight text-[#0a318c] sm:text-5xl">Crea</Link>
        <nav aria-label="Navegación principal" className="order-last flex w-full flex-wrap items-center gap-x-5 gap-y-1 text-sm font-semibold text-slate-700 lg:order-none lg:w-auto lg:gap-8">
          <a href="#inicio" className="border-b-2 border-[#1464f6] py-3 text-[#071c56]">Inicio</a>
          <a href="#como-funciona" className="py-3 hover:text-[#0a4db7]">¿Cómo funciona?</a>
          <a href="#beneficios" className="py-3 hover:text-[#0a4db7]">Beneficios</a>
          <a href="#preguntas" className="py-3 hover:text-[#0a4db7]">Preguntas frecuentes</a>
        </nav>
        <div className="flex flex-wrap gap-2 text-sm font-bold">
          {user ? <>
            <Link href="/negocios" className="rounded-xl bg-[#1464f6] px-4 py-3 text-white">Mis evaluaciones</Link>
            <Button variant="ghost" onClick={logout}>Salir <LogOut aria-hidden="true" /></Button>
          </> : <>
            <Link href="/ingresar" className="rounded-xl border border-[#1464f6] px-4 py-3 text-[#0a4db7]">Iniciar sesión</Link>
            <Link href="/registro" className="rounded-xl bg-[#1464f6] px-4 py-3 text-white">Crear cuenta</Link>
          </>}
        </div>
        {error && <p role="alert" className="w-full text-sm text-destructive">No pudimos cerrar tu sesión. Intenta de nuevo.</p>}
      </div>
    </header>
  </>;

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
