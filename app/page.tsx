import Image from "next/image";
import Link from "next/link";
import { CreamCard } from "@/components/woodland/CreamCard";
import { WoodButton } from "@/components/woodland/WoodButton";

// SPEC-NOTE: placeholder until Phase 1 builds the real treehouse entrance (§9.5). The CTAs and
// login/signup links already go where the spec says.
export default function Home() {
  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-end overflow-hidden pt-safe pb-safe">
      <Image
        src="/assets/treehouse/treehouse-main.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_40%]"
      />
      <CreamCard className="relative m-4 mb-8 flex w-[calc(100%-2rem)] max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="font-display text-5xl text-bark">Tree Dorm</h1>
        <p>Little shops run by students, tucked into the campus woods.</p>
        <WoodButton href="/market" size="lg" className="w-full">
          Enter the village
        </WoodButton>
        <WoodButton href="/signup?intent=business" variant="secondary" className="w-full">
          Open your treehouse
        </WoodButton>
        <p className="text-sm">
          <Link href="/login" className="font-bold text-bark underline underline-offset-2">
            Log in
          </Link>
          {" · "}
          <Link href="/signup" className="font-bold text-bark underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </CreamCard>
    </main>
  );
}
