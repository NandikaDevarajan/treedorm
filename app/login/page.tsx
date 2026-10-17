import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/AuthForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { listSchools } from "@/lib/collections";
import { demoLoginEnabled } from "@/lib/demo";

export const metadata: Metadata = { title: "Log in · Tree Dorm" };
export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="login" schools={await listSchools()} next={next} demoLogin={demoLoginEnabled()} />
    </AuthShell>
  );
}
