import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function RegisterPage() {
  return <Suspense fallback={<div className="container-site page-shell"><p role="status">Cargando registro…</p></div>}><AuthForm mode="register" /></Suspense>;
}
