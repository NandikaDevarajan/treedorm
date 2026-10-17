"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const icons = {
  village: "M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z",
  ask: "M12 3l1.8 4.6L18.5 9l-4.7 1.4L12 15l-1.8-4.6L5.5 9l4.7-1.4ZM18 15l.9 2.1L21 18l-2.1.9L18 21l-.9-2.1L15 18l2.1-.9Z",
  orders: "M5 7h14l-1 13H6Zm4 0V5a3 3 0 0 1 6 0v2",
  messages: "M4 5h16v11H9l-5 4Z",
  profile: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 9a8 8 0 0 1 16 0",
  seller: "M4 9h16l-1.5-5h-13Zm1 0v11h14V9M10 20v-6h4v6",
} as const;

type Tab = { href: string; label: string; icon: keyof typeof icons };

const TABS: Tab[] = [
  { href: "/market", label: "Village", icon: "village" },
  { href: "/ask", label: "Ask", icon: "ask" },
  { href: "/orders", label: "Orders", icon: "orders" },
  { href: "/messages", label: "Messages", icon: "messages" },
  { href: "/profile", label: "Profile", icon: "profile" },
];

/** Phone bottom navigation (SPEC §4). `isSeller` adds the Seller tab. */
export function TabBar({ isSeller = false, className }: { isSeller?: boolean; className?: string }) {
  const pathname = usePathname();
  const tabs = isSeller ? [...TABS, { href: "/seller", label: "Seller", icon: "seller" as const }] : TABS;

  return (
    <nav
      aria-label="Main"
      className={cn("border-t-2 border-bark/20 bg-cream/95 pb-safe backdrop-blur-sm", className)}
    >
      <ul className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-bold",
                  active ? "text-bark" : "text-walnut/65",
                )}
              >
                <span className={cn("rounded-full px-3 py-0.5 transition-colors", active && "bg-sage/50")}>
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="size-6 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"
                  >
                    <path d={icons[tab.icon]} />
                  </svg>
                </span>
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
