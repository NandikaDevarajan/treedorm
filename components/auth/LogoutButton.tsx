"use client";

import { useRouter } from "next/navigation";
import { WoodButton } from "@/components/woodland/WoodButton";

export function LogoutButton() {
  const router = useRouter();
  return (
    <WoodButton
      variant="secondary"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        router.replace("/login");
        router.refresh();
      }}
    >
      Log out
    </WoodButton>
  );
}
