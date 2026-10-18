import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { HedgehogAvatar } from "@/components/woodland/HedgehogAvatar";
import { cn } from "@/lib/cn";
import { formatCents } from "@/lib/money";
import { STATUS_LABEL, type OrderCardData } from "@/lib/order-views";
import { formatSlot } from "@/lib/slots";

const tone = (s: OrderCardData["status"]) =>
  s === "captured"
    ? "bg-sage/50"
    : s === "canceled" || s === "expired"
      ? "bg-almond text-walnut/70"
      : s === "mismatch"
        ? "bg-danger/15 text-danger"
        : "bg-gold/35";

/** An order in a list: photo, listing, shop (or buyer), time, status, price and actions. */
export function OrderCard({
  order,
  viewer,
  actions,
}: {
  order: OrderCardData;
  viewer: "buyer" | "seller";
  actions?: ReactNode;
}) {
  return (
    <article className="relative flex flex-col gap-3 rounded-card border border-bark/15 bg-cream p-4 shadow-soft">
      <div className="flex gap-3">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-almond">
          {order.listing.photo && (
            <Image src={order.listing.photo} alt="" fill sizes="80px" className="object-cover" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="leading-snug font-bold text-bark">
              <Link href={`/orders/${order.id}`} className="after:absolute after:inset-0 after:content-['']">
                {order.listing.title}
              </Link>
            </h3>
            <span className="shrink-0 font-bold">{formatCents(order.amountCents)}</span>
          </div>
          {viewer === "seller" ? (
            <p className="flex items-center gap-1.5 text-sm text-walnut/85">
              <HedgehogAvatar avatar={order.other.avatar} variant="badge" className="size-6" />{" "}
              {order.other.name}
            </p>
          ) : (
            <p className="text-sm text-walnut/85">{order.shop.name}</p>
          )}
          <p className="text-sm font-semibold">{formatSlot(order.slotStart)}</p>
          <span className={cn("mt-1 w-fit rounded-full px-2.5 py-0.5 text-xs font-bold", tone(order.status))}>
            {STATUS_LABEL[order.status]}
          </span>
        </div>
      </div>
      {actions && <div className="relative z-10 flex flex-wrap justify-end gap-2">{actions}</div>}
    </article>
  );
}
