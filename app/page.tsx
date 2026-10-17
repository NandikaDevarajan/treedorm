import Image from "next/image";
import { CreamCard } from "@/components/woodland/CreamCard";
import { WoodButton } from "@/components/woodland/WoodButton";

// SPEC-NOTE: placeholder until Phase 1 builds the real treehouse entrance (§9.5).
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
      <CreamCard className="relative m-4 mb-8 flex max-w-sm flex-col items-center gap-3 text-center">
        <h1 className="font-display text-5xl text-bark">Tree Dorm</h1>
        <p>Little shops run by students, tucked into the campus woods.</p>
        <WoodButton href="/dev/styleguide">See the styleguide</WoodButton>
      </CreamCard>
    </main>
  );
}
