import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { githubEnabled } from "@/lib/env";
import AuthLayout from "@/components/AuthLayout";
import FlashToast from "@/components/FlashToast";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to Warrant to continue your research.",
};

const OAUTH_ERRORS: Record<string, string> = {
  OAuthAccountNotLinked: "That email is already registered. Log in with your password instead.",
  AccessDenied: "GitHub sign-in was cancelled or your GitHub email is private.",
  CredentialsSignin: "Incorrect email or password.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string; registered?: string }>;
}) {
  const { callbackUrl, error, registered } = await searchParams;
  // Only allow relative callback URLs so the form can't be used as an open redirect.
  const safeCallback = callbackUrl?.startsWith("/") && !callbackUrl.startsWith("//") ? callbackUrl : "/dashboard";

  if (await getCurrentUser()) redirect(safeCallback);

  return (
    <AuthLayout title="Welcome back" subtitle="Your desk is where you left it." note="the evidence is waiting">
      {registered && (
        <Suspense>
          <FlashToast message="Account created. Log in to get started." param="registered" />
        </Suspense>
      )}
      <LoginForm
        callbackUrl={safeCallback}
        githubEnabled={githubEnabled}
        initialError={error ? (OAUTH_ERRORS[error] ?? "Sign-in failed. Please try again.") : ""}
      />
    </AuthLayout>
  );
}
