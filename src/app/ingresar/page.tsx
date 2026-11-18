import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage() {
  return <Suspense fallback={<div className="container-site page-shell"><p role="status">Cargando ingreso…</p></div>}><AuthForm mode="login" /></Suspense>;
}
