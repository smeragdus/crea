"use client";

import type { User } from "firebase/auth";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const demo = process.env.NEXT_PUBLIC_CREA_DEMO === "true";
const config = [
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
];
const configured = config.every((value) => value && !value.startsWith("tu_") && !value.startsWith("tu-"));
const mode = demo ? "demo" : configured ? "firebase" : "offline";

type SessionState = { user: User | null; loading: boolean; admin: boolean; researcher: boolean; error: boolean };
const anonymous = { user: null, loading: false, admin: false, researcher: false, error: false };
const SessionContext = createContext<SessionState & { mode: typeof mode; signOut: () => Promise<void> }>({
  ...anonymous, mode, signOut: async () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ ...anonymous, loading: mode === "firebase" });
  useEffect(() => {
    if (mode !== "firebase") return;
    let subscribed = true;
    let unsubscribe: (() => void) | undefined;
    let revision = 0;
    Promise.all([import("firebase/auth"), import("@/lib/firebase/client")]).then(([sdk, client]) => {
      if (!subscribed) return;
      const auth = client.getFirebaseAuth();
      if (!auth) throw new Error("Firebase no configurado");
      unsubscribe = sdk.onIdTokenChanged(auth, async (user) => {
        const current = ++revision;
        if (!user) {
          setState(anonymous);
          return;
        }
        try {
          const { claims } = await user.getIdTokenResult();
          if (subscribed && current === revision) {
            setState({ user, loading: false, admin: claims.admin === true, researcher: claims.researcher === true || claims.admin === true, error: false });
          }
        } catch {
          if (subscribed && current === revision) setState({ ...anonymous, error: true });
        }
      }, () => setState({ ...anonymous, error: true }));
    }).catch(() => {
      if (subscribed) setState({ ...anonymous, error: true });
    });
    return () => {
      subscribed = false;
      unsubscribe?.();
    };
  }, []);

  async function signOut() {
    const [sdk, client] = await Promise.all([import("firebase/auth"), import("@/lib/firebase/client")]);
    const auth = client.getFirebaseAuth();
    if (auth) {
      const uid = auth.currentUser?.uid;
      await sdk.signOut(auth);
      if (uid) (await import("@/features/evaluation/session-storage")).clearAssessment(uid);
    }
  }

  return <SessionContext.Provider value={{ ...state, mode, signOut }}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
