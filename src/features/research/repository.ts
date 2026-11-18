import { collection, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch, type Timestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { isValidParticipantCode, scoreAnswers, splitInstrument, type AnswerKey, type ApprovedInstrument, type PairedScore, type ParticipantInstrument, type StudyStage } from "@/lib/research-engine";

export type ParticipantRole = "PROPIETARIO" | "ADMINISTRADOR";
type Enrollment = { code: string; version: string };
type Consent = { version: string; consentVersion: string; role: ParticipantRole; acceptedAt: Timestamp };
type Intervention = { version: string; modules: string[]; confirmedAt: Timestamp };
type Response = { stage: StudyStage; version: string; answers: number[]; submittedAt: Timestamp };

export type ParticipantProgress = {
  code: string;
  consent: Consent | null;
  pretest: Response | null;
  intervention: Intervention | null;
  postest: Response | null;
  result: PairedScore | null;
};

function connection() {
  const db = getFirebaseDb();
  const user = getFirebaseAuth()?.currentUser;
  if (!db || !user) throw new Error("Inicia sesión.");
  return { db, uid: user.uid };
}

async function progress(code: string, researcher = false): Promise<ParticipantProgress> {
  const { db } = connection();
  const [consent, pretest, intervention, postest, result] = await Promise.all([
    getDoc(doc(db, "research_participant_consents", code)),
    getDoc(doc(db, "research_responses", code, "stages", "pretest")),
    getDoc(doc(db, "research_interventions", code)),
    getDoc(doc(db, "research_responses", code, "stages", "postest")),
    researcher ? getDoc(doc(db, "research_results", code)) : Promise.resolve(null),
  ]);
  return {
    code,
    consent: (consent.data() as Consent | undefined) ?? null,
    pretest: (pretest.data() as Response | undefined) ?? null,
    intervention: (intervention.data() as Intervention | undefined) ?? null,
    postest: (postest.data() as Response | undefined) ?? null,
    result: (result?.data() as PairedScore | undefined) ?? null,
  };
}

export async function loadParticipant() {
  const { db, uid } = connection();
  const enrollment = (await getDoc(doc(db, "research_enrollments", uid))).data() as Enrollment | undefined;
  if (!enrollment) return null;
  const [instrument, state] = await Promise.all([
    getDoc(doc(db, "research_instruments", enrollment.version)),
    progress(enrollment.code),
  ]);
  if (!instrument.exists()) throw new Error("No encontramos la versión asignada.");
  return { instrument: instrument.data() as ParticipantInstrument, state };
}

export async function recordConsent(code: string, instrument: ParticipantInstrument, role: ParticipantRole) {
  const { db } = connection();
  await setDoc(doc(db, "research_participant_consents", code), {
    version: instrument.version,
    consentVersion: instrument.consentVersion,
    role,
    acceptedAt: serverTimestamp(),
  });
}

export async function submitResponses(code: string, stage: StudyStage, version: string, answers: number[]) {
  const { db } = connection();
  await setDoc(doc(db, "research_responses", code, "stages", stage), { stage, version, answers, submittedAt: serverTimestamp() });
}

export async function studyVersion() {
  const { db } = connection();
  const metadata = await getDoc(doc(db, "research_study", "active"));
  return metadata.exists() ? metadata.data().version as string : null;
}

export async function publishInstrument(input: ApprovedInstrument) {
  const { db, uid } = connection();
  const { participant, key } = splitInstrument(input);
  const version = participant.version;
  const batch = writeBatch(db);
  batch.set(doc(db, "research_instruments", version), participant);
  batch.set(doc(db, "research_answer_keys", version), key);
  batch.set(doc(db, "research_study", "active"), { version, publishedAt: serverTimestamp(), publishedBy: uid });
  await batch.commit();
}

export async function enrollParticipant(uid: string, code: string, version: string) {
  if (!uid || uid.length > 128 || uid.includes("/") || !isValidParticipantCode(code)) throw new Error("UID o código inválido.");
  const { db } = connection();
  const batch = writeBatch(db);
  batch.set(doc(db, "research_enrollments", uid), { code, version });
  batch.set(doc(db, "research_slots", code), { uid, version });
  await batch.commit();
}

export async function getStudyProgress() {
  const { db } = connection();
  const snapshot = await getDocs(collection(db, "research_slots"));
  const records = await Promise.all(snapshot.docs.map((item) => progress(item.id, true)));
  return records.sort((left, right) => left.code.localeCompare(right.code));
}

export async function confirmIntervention(code: string, version: string, modules: string[]) {
  const { db } = connection();
  await setDoc(doc(db, "research_interventions", code), { version, modules, confirmedAt: serverTimestamp() });
}

export async function savePairedScore(record: ParticipantProgress) {
  const { db } = connection();
  if (!record.pretest || !record.postest || record.pretest.version !== record.postest.version) {
    throw new Error("Se requieren dos evaluaciones con la misma versión.");
  }
  const version = record.pretest.version;
  const storedKey = await getDoc(doc(db, "research_answer_keys", version));
  if (!storedKey.exists()) throw new Error("Falta la clave del instrumento.");
  const key = storedKey.data() as AnswerKey;
  const score: PairedScore = {
    participantCode: record.code,
    version,
    pretest: scoreAnswers(record.pretest.answers, key),
    postest: scoreAnswers(record.postest.answers, key),
    maximum: Math.round(key.points.reduce((sum, value) => sum + value, 0) * 1e6) / 1e6,
  };
  await setDoc(doc(db, "research_results", record.code), score);
  return score;
}
