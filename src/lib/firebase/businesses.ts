import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, where, type Timestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "./client";
import type { BusinessContext } from "@/lib/types";

export interface StoredBusiness {
  id: string;
  owner_id: string;
  name: string;
  context: BusinessContext;
  evaluationDate?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

function connection() {
  const db = getFirebaseDb();
  const owner = getFirebaseAuth()?.currentUser;
  if (!db || !owner) throw new Error("Inicia sesión para acceder a tus evaluaciones.");
  return { db, uid: owner.uid };
}

export async function saveBusinessToFirestore(id: string, context: BusinessContext, evaluationDate: string) {
  const { db, uid } = connection();
  const ref = doc(db, "businesses", id);
  const data = {
    owner_id: uid,
    name: context.businessName || "Mi restaurante",
    purpose: context.purpose,
    department: context.department,
    province: context.province,
    district: context.district,
    context: JSON.parse(JSON.stringify(context)) as BusinessContext,
    evaluationDate,
    updatedAt: serverTimestamp(),
  };
  await runTransaction(db, async (transaction) => {
    const current = await transaction.get(ref);
    if (current.exists()) transaction.update(ref, data);
    else transaction.set(ref, { ...data, createdAt: serverTimestamp() });
  });
}

export async function getUserBusinesses(): Promise<StoredBusiness[]> {
  const { db, uid } = connection();
  const snapshot = await getDocs(query(collection(db, "businesses"), where("owner_id", "==", uid)));
  return snapshot.docs.map((item) => ({ ...item.data() as Omit<StoredBusiness, "id">, id: item.id }))
    .sort((left, right) => ((right.updatedAt ?? right.createdAt)?.toMillis() ?? 0) - ((left.updatedAt ?? left.createdAt)?.toMillis() ?? 0));
}

export async function getBusinessById(id: string): Promise<StoredBusiness | null> {
  const { db } = connection();
  const snapshot = await getDoc(doc(db, "businesses", id));
  return snapshot.exists() ? { ...snapshot.data() as Omit<StoredBusiness, "id">, id: snapshot.id } : null;
}

export async function readTaskStatus(id: string, period: string, regime: string): Promise<string[]> {
  const { db } = connection();
  const snapshot = await getDoc(doc(db, "businesses", id, "task_status", period + "-" + regime));
  const completed: unknown = snapshot.data()?.completed;
  return Array.isArray(completed) ? completed.filter((item): item is string => typeof item === "string") : [];
}

export async function writeTaskStatus(id: string, period: string, regime: string, task: string, checked: boolean) {
  const { db } = connection();
  await setDoc(doc(db, "businesses", id, "task_status", period + "-" + regime), { completed: checked ? arrayUnion(task) : arrayRemove(task) }, { merge: true });
}
