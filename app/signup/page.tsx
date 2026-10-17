import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { listSchools } from "@/lib/collections";
import { demoLoginEnabled } from "@/lib/demo";

export const metadata: Metadata = { title: "Sign up · Tree Dorm" };
export const dynamic = "force-dynamic";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ intent?: string }> }) {
  const { intent } = await searchParams;
  return (
    <AuthShell>
      <AuthForm
        mode="signup"
        schools={await listSchools()}
        intent={intent === "business" ? "business" : undefined}
        demoLogin={demoLoginEnabled()}
      />
    </AuthShell>
  );
}
