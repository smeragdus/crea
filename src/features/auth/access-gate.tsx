"use client";

import type { ReactNode } from "react";
import { EmptyState, LinkButton, Notice } from "@/components/ui/primitives";
import { useSession } from "./session";

export function AccessGate({ section, role, children }: { section: "/admin" | "/investigacion"; role?: "admin"; children: ReactNode }) {
  const session = useSession();
  if (session.loading) return <p role="status">Comprobando tu acceso…</p>;
  if (session.error) return <Notice tone="error">No se pudo comprobar la sesión. Actualiza la página e inténtalo nuevamente.</Notice>;
  if (session.mode !== "firebase") return <EmptyState title={session.mode === "demo" ? "Disponible con una cuenta real" : "Acceso a cuentas no disponible"} action={false}>
    {session.mode === "demo" ? "Esta sección requiere una cuenta autorizada. En la demostración puedes explorar la evaluación tributaria." : "El servicio de cuentas no está disponible en este momento."}
  </EmptyState>;
  if (!session.user) return <EmptyState title="Ingresa para continuar" action={false}><LinkButton href={"/ingresar?volver=" + encodeURIComponent(section)}>Ingresar</LinkButton></EmptyState>;
  if (role === "admin" && !session.admin) return <EmptyState title="Se requiere permiso de administración" action={false}>Tu cuenta no tiene el rol para gestionar el catálogo.</EmptyState>;
  return children;
}
