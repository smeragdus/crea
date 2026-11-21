import type { BusinessContext } from "@/lib/types";
import type { AssessmentDraft, AssessmentField } from "./assessment";

export type AssessmentSnapshot = { id?: string; saved?: boolean; date: string; context: BusinessContext; demo?: boolean };
export type DraftSnapshot = { answers: AssessmentDraft; step: number; question?: AssessmentField };
const changed = "crea:assessment-changed";

export function subscribeToAssessment(callback: () => void) {
  window.addEventListener(changed, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(changed, callback);
    window.removeEventListener("storage", callback);
  };
}

function key(uid?: string) {
  return "crea:assessment:v2:" + (uid || "guest");
}

function draftKey(uid?: string) {
  return "crea:draft:v2:" + (uid || "guest");
}

export function readDraft(uid?: string): DraftSnapshot | null {
  try {
    const raw = sessionStorage.getItem(draftKey(uid));
    if (!raw) return null;
    const draft = JSON.parse(raw) as DraftSnapshot;
    return Number.isInteger(draft?.step) && draft.step >= 0 && draft.answers
      && Object.values(draft.answers).every((value) => typeof value === "string") ? draft : null;
  } catch {
    return null;
  }
}

export function storeDraft(draft: DraftSnapshot | null, uid?: string) {
  try {
    if (draft) sessionStorage.setItem(draftKey(uid), JSON.stringify(draft));
    else sessionStorage.removeItem(draftKey(uid));
    window.dispatchEvent(new Event(changed));
  } catch { /* La evaluación aún se puede completar en el formulario. */ }
}

export function readAssessment(uid?: string): AssessmentSnapshot | null {
  try {
    const raw = sessionStorage.getItem(key(uid));
    if (!raw) return null;
    const result = JSON.parse(raw) as AssessmentSnapshot;
    return typeof result.date === "string" && typeof result.context?.legalPerson === "string" ? result : null;
  } catch {
    return null;
  }
}

export function saveAssessment(snapshot: AssessmentSnapshot, uid?: string) {
  sessionStorage.setItem(key(uid), JSON.stringify(snapshot));
  window.dispatchEvent(new Event(changed));
}

export function clearAssessment(uid: string) {
  try {
    sessionStorage.removeItem(key(uid));
    sessionStorage.removeItem(draftKey(uid));
    window.dispatchEvent(new Event(changed));
  } catch { /* El navegador puede bloquear el almacenamiento. */ }
}

export function limaDay(date: Date) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const get = (part: string) => parts.find(({ type }) => type === part)?.value;
  return [get("year"), get("month"), get("day")].join("-");
}
