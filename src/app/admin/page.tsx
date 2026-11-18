import type { Metadata } from "next";
import { AdminConsole } from "@/features/admin/admin-console";

export const metadata: Metadata = { title: "Administración del catálogo" };

export default function AdminPage() {
  return <AdminConsole />;
}
