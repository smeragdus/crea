import type { Metadata } from "next";
import { Study } from "@/features/research/study";

export const metadata: Metadata = { title: "Investigación UPN" };

export default function ResearchPage() {
  return <Study />;
}
