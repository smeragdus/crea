"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice, PageHeading } from "@/components/ui/primitives";
import { AccessGate } from "@/features/auth/access-gate";
import { useSession } from "@/features/auth/session";
import { QUESTION_COUNT, RESEARCH_SAMPLE_SIZE } from "@/lib/research-engine";

const ResearchConsole = dynamic(() => import("./research-console").then((module) => module.ResearchConsole), { loading: () => <p role="status">Cargando panel…</p> });
const Participant = dynamic(() => import("./participant").then((module) => module.Participant), { loading: () => <p role="status">Cargando participación…</p> });

export function Study() {
  return <div className="container-site page-shell">
    <PageHeading label="Investigación · Universidad Privada del Norte" title="Estudio con restaurantes de Cajamarca"
      description={RESEARCH_SAMPLE_SIZE + " restaurantes en un solo grupo. El estudio aplica el mismo test de " + QUESTION_COUNT + " preguntas antes y después de usar CREA."} />
    <AccessGate section="/investigacion"><StudySession /></AccessGate>
  </div>;
}

function StudySession() {
  const { user, researcher } = useSession();
  if (researcher) return <ResearchConsole key={user?.uid} />;
  if (user && !user.emailVerified) return <VerifyEmail key={user.uid} />;
  return <Participant key={user?.uid} />;
}

function VerifyEmail() {
  const { user } = useSession();
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function verify(check: boolean) {
    if (!user || busy) return;
    setBusy(true);
    setMessage("");
    setError(false);
    try {
      if (check) {
        await user.reload();
        await user.getIdToken(true);
        if (!user.emailVerified) setMessage("Aún falta confirmar el correo. Revisa tu bandeja de entrada.");
      } else {
        const { sendEmailVerification } = await import("firebase/auth");
        await sendEmailVerification(user);
        setMessage("Enviamos un enlace de verificación a tu correo.");
      }
    } catch {
      setError(true);
      setMessage("No pudimos comprobar tu correo. Intenta nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  return <Card className="grid max-w-xl gap-4 p-5 sm:p-7" aria-busy={busy}>
    <h2 className="text-2xl font-bold">Verifica tu correo</h2>
    <p className="text-muted-foreground">Confirma el correo vinculado a tu cuenta para abrir las etapas del estudio.</p>
    {message && <Notice tone={error ? "error" : "info"}>{message}</Notice>}
    <div className="flex flex-wrap gap-2"><Button disabled={busy} onClick={() => void verify(false)}>Enviar enlace</Button>
      <Button disabled={busy} variant="outline" onClick={() => void verify(true)}>Ya confirmé mi correo</Button></div>
  </Card>;
}
