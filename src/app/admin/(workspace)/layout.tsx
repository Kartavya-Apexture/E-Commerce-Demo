import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin";
export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();
  return <AdminShell>{children}</AdminShell>;
}
