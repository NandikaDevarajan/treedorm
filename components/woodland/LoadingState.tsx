import { Creature } from "@/components/woodland/Creature";
import { cn } from "@/lib/cn";
import { CREATURE_FOR } from "@/lib/creatures";

/** Full-area loading screen: the eyes-closed deer resting on the grass while the page arrives. Static. */
export function LoadingState({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      className={cn("flex flex-col items-center justify-center gap-3 py-16 text-center", className)}
    >
      <div className="relative">
        <Creature name={CREATURE_FOR.loading} size={120} />
        <span aria-hidden className="absolute top-0 -right-4 text-xl font-bold text-bark/60">
          z<span className="text-lg">z</span>
        </span>
      </div>
      <p className="font-semibold text-walnut/80">{label}</p>
    </div>
  );
}
