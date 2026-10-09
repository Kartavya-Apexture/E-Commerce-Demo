import { redirect } from "next/navigation";
import { isAdmin } from "@/lib/auth";
import { LoginForm } from "@/components/admin";
export const metadata = { title: "Admin sign in" };
export default async function Page() {
  if (await isAdmin()) redirect("/admin");
  return <LoginForm />;
}
