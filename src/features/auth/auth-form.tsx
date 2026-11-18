"use client";

import { ArrowRight, KeyRound } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { EmptyState, LinkButton, Notice, PageHeading } from "@/components/ui/primitives";
import { useSession } from "./session";

const emailSchema = z.email();
const errors: Record<string, string> = {
  "auth/invalid-credential": "Comprueba tu correo y contraseña.",
  "auth/email-already-in-use": "Ya existe una cuenta con este correo. Puedes ingresar o recuperar tu contraseña.",
  "auth/weak-password": "Elige una contraseña más segura.",
  "auth/network-request-failed": "Revisa tu conexión e inténtalo de nuevo.",
  "auth/too-many-requests": "Hay demasiados intentos seguidos. Espera unos minutos e intenta otra vez.",
  "auth/popup-closed-by-user": "Se cerró la ventana de Google. Puedes volver a intentarlo.",
  "auth/popup-blocked": "Permite las ventanas emergentes para ingresar con Google.",
  "auth/operation-not-allowed": "Este método de ingreso no está habilitado en el proyecto.",
  "auth/account-exists-with-different-credential": "Ya existe una cuenta para este correo. Ingresa con el método que usaste al registrarte.",
};

function authError(error: unknown) {
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  return errors[code] ?? "No pudimos completar la solicitud. Intenta de nuevo.";
}

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const candidate = useSearchParams().get("volver");
  const destination = candidate && ["/admin", "/investigacion", "/negocios", "/negocios?guardar=1"].includes(candidate) ? candidate : "/negocios";
  const session = useSession();
  const [screen, setScreen] = useState<"login" | "register" | "recover">(mode);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [invalid, setInvalid] = useState<"email" | "password" | "">("");

  async function submit(type: "form" | "google", data?: FormData) {
    setError("");
    setMessage("");
    setInvalid("");
    const address = email.trim();
    const password = String(data?.get("password") ?? "");
    if (type === "form" && !emailSchema.safeParse(address).success) {
      setInvalid("email");
      document.getElementById("email")?.focus();
      return;
    }
    if (type === "form" && screen !== "recover" && (!password || (screen === "register" && password.length < 8))) {
      setInvalid("password");
      document.getElementById("password")?.focus();
      return;
    }
    setBusy(true);
    try {
      const [sdk, client] = await Promise.all([import("firebase/auth"), import("@/lib/firebase/client")]);
      const auth = client.getFirebaseAuth();
      if (!auth) throw new Error("Firebase no configurado");
      if (type === "google") {
        await sdk.signInWithPopup(auth, client.getGoogleProvider());
      } else if (screen === "recover") {
        try {
          await sdk.sendPasswordResetEmail(auth, address);
        } catch (failure) {
          if (!(typeof failure === "object" && failure && "code" in failure && failure.code === "auth/user-not-found")) throw failure;
        }
        setMessage("Si existe una cuenta con este correo, recibirás el enlace para restablecer tu contraseña.");
        return;
      } else if (screen === "register") {
        await sdk.createUserWithEmailAndPassword(auth, address, password);
      } else {
        await sdk.signInWithEmailAndPassword(auth, address, password);
      }
      router.replace(destination);
    } catch (failure) {
      setError(authError(failure));
    } finally {
      setBusy(false);
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit("form", new FormData(event.currentTarget));
  }

  const isLogin = screen === "login";
  const recovering = screen === "recover";
  const title = recovering ? "Recupera tu acceso" : isLogin ? "Ingresa a CREA" : "Crea tu cuenta";
  const intro = recovering ? "Te enviaremos un enlace al correo de tu cuenta."
    : destination === "/negocios?guardar=1" ? "Usa tu cuenta para guardar la evaluación que acabas de completar."
      : destination === "/investigacion" ? "Usa la cuenta vinculada a tu participación en el estudio."
        : destination === "/admin" ? "Usa tu cuenta de administración del catálogo."
          : "Accede a tus evaluaciones guardadas desde otros dispositivos.";
  return <div className="container-site page-shell">
    <div className="mx-auto max-w-lg">
      <PageHeading title={title} description={session.mode === "firebase" && !session.user ? intro : undefined} />
        {session.loading ? <p role="status">Comprobando tu sesión…</p>
        : session.mode !== "firebase" ? <EmptyState title={session.mode === "demo" ? "Modo demostración" : "Cuentas sin conexión"}>
          {session.mode === "demo" ? "Puedes explorar la evaluación y las guías sin una cuenta. Los datos de la prueba quedan en esta pestaña." : "El acceso a cuentas no está disponible. Puedes evaluar tu restaurante y consultar las guías en esta pestaña."}
          {session.mode === "demo" && <div className="mt-3"><Link className="hero-secondary" href="/negocios">Explorar una evaluación de demostración</Link></div>}
        </EmptyState>
        : session.user ? <div className="grid justify-items-start gap-4"><p className="text-muted-foreground">Sesión activa con {session.user.email}.</p><LinkButton href={destination}>Continuar <ArrowRight aria-hidden="true" /></LinkButton></div>
        : <>
          <form onSubmit={onSubmit} noValidate className="grid gap-4 border-t border-border pt-5" aria-busy={busy}>
            <Field id="email" label="Correo electrónico" error={invalid === "email" ? "Ingresa un correo electrónico válido." : undefined}>
              <Input id="email" name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)}
                aria-invalid={invalid === "email"} aria-describedby={invalid === "email" ? "email-error" : undefined} />
            </Field>
            {!recovering && <Field id="password" label="Contraseña" hint={!isLogin ? "Usa al menos 8 caracteres." : undefined} error={invalid === "password" ? isLogin ? "Escribe tu contraseña." : "Usa al menos 8 caracteres." : undefined}>
              <Input id="password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"}
                aria-invalid={invalid === "password"} aria-describedby={invalid === "password" ? "password-error" : !isLogin ? "password-hint" : undefined} />
            </Field>}
            {error && <Notice tone="error">{error}</Notice>}
            {message && <Notice tone="success">{message}</Notice>}
            <Button type="submit" disabled={busy}>{busy ? "Procesando…" : recovering ? "Enviar enlace" : isLogin ? "Ingresar" : "Crear cuenta"} <ArrowRight aria-hidden="true" /></Button>
            {!recovering && <Button type="button" variant="outline" disabled={busy} onClick={() => void submit("google")}>Continuar con Google</Button>}
          </form>
          <div className="mt-4 grid items-start gap-2 text-sm">
            {isLogin && <Button className="justify-start px-0" variant="ghost" onClick={() => { setScreen("recover"); setError(""); setInvalid(""); }}><KeyRound aria-hidden="true" /> Olvidé mi contraseña</Button>}
            {recovering ? <Button className="justify-start px-0" variant="ghost" onClick={() => { setScreen("login"); setError(""); setMessage(""); setInvalid(""); }}>Volver al ingreso</Button> : <div className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
              {isLogin ? "¿Primera vez en CREA?" : "¿Ya tienes cuenta?"}
              <Link className="inline-flex min-h-11 items-center font-bold text-primary underline underline-offset-4" href={(isLogin ? "/registro" : "/ingresar") + (candidate ? "?volver=" + encodeURIComponent(destination) : "")}>{isLogin ? "Crear cuenta" : "Ingresar"}</Link>
            </div>}
          </div>
        </>}
    </div>
  </div>;
}
