import { addDoc, collection, doc, getDocs, orderBy, query, serverTimestamp, updateDoc, type Timestamp } from "firebase/firestore";
import { getFirebaseAuth, getFirebaseDb } from "@/lib/firebase/client";
import { z } from "zod";

export const revisionSchema = z.object({
  kind: z.enum(["rule", "source"]),
  targetId: z.string().min(1).max(80),
  title: z.string().trim().min(4).max(180),
  proposedChange: z.string().trim().min(15).max(2000),
  sourceUrl: z.url({ protocol: /^https$/ }).max(512),
  version: z.string().trim().regex(/^[A-Za-z0-9._-]{3,60}$/),
});

type Revision = z.infer<typeof revisionSchema>;
export type StoredRevision = Revision & {
  id: string;
  status: "BORRADOR" | "APROBADA";
  createdAt?: Timestamp;
};

function catalog() {
  const db = getFirebaseDb();
  const user = getFirebaseAuth()?.currentUser;
  if (!db || !user) throw new Error("Inicia sesión.");
  return { db, user };
}

export async function listRevisions() {
  const { db } = catalog();
  const snapshot = await getDocs(query(collection(db, "catalog_revisions"), orderBy("createdAt", "desc")));
  return snapshot.docs.map((row) => ({ ...row.data(), id: row.id }) as StoredRevision);
}

export async function createRevision(revision: Revision) {
  const { db, user } = catalog();
  await addDoc(collection(db, "catalog_revisions"), {
    ...revisionSchema.parse(revision),
    status: "BORRADOR",
    createdAt: serverTimestamp(),
    createdBy: user.uid,
  });
}

export async function reviewRevision(id: string) {
  const { db, user } = catalog();
  await updateDoc(doc(db, "catalog_revisions", id), {
    status: "APROBADA",
    reviewedAt: serverTimestamp(),
    reviewedBy: user.uid,
  });
}
