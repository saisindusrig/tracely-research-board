import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import AuthLayout from "@/components/AuthLayout";
import RegisterForm from "./RegisterForm";

export const metadata: Metadata = {
  title: "Create your account",
  description: "Create a free Warrant account and start mapping claims, sources and evidence.",
};

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <AuthLayout title="Create your account" subtitle="One notebook for everything you are figuring out." note="free, and it stays yours">
      <RegisterForm />
    </AuthLayout>
  );
}
