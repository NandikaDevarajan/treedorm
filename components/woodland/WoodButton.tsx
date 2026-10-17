import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary";
type Size = "md" | "lg";

interface BaseProps {
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}

type ButtonProps = BaseProps & Omit<ComponentProps<"button">, keyof BaseProps> & { href?: undefined };
type LinkProps = BaseProps & Omit<ComponentProps<typeof Link>, keyof BaseProps> & { href: string };

const base =
  "inline-flex items-center justify-center gap-2 rounded-2xl font-bold tracking-wide select-none " +
  "border-2 border-walnut/80 transition-[transform,box-shadow,background-color] duration-150 ease-organic " +
  "shadow-[0_3px_0_var(--walnut)] active:translate-y-[2px] active:shadow-[0_1px_0_var(--walnut)] " +
  "disabled:opacity-50 disabled:pointer-events-none";

const variants: Record<Variant, string> = {
  // Little wooden sign: bark plank with faint grain lines.
  primary:
    "bg-bark text-cream hover:bg-[color-mix(in_srgb,var(--bark)_88%,var(--gold))] " +
    "bg-[repeating-linear-gradient(176deg,transparent_0_9px,rgb(62_43_32/0.14)_9px_10px)]",
  secondary: "bg-cream text-bark border-bark hover:bg-[color-mix(in_srgb,var(--cream)_85%,var(--gold))]",
};

const sizes: Record<Size, string> = {
  md: "min-h-11 px-5 text-base",
  lg: "min-h-13 px-7 text-lg",
};

/** Tactile storybook button (SPEC §9.3). Renders a Next link when given `href`. */
export function WoodButton(props: ButtonProps | LinkProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(base, variants[variant], sizes[size], className);

  if (props.href !== undefined) {
    const { variant: _v, size: _s, className: _c, children: _ch, ...rest } = props;
    return (
      <Link {...rest} className={classes}>
        {children}
      </Link>
    );
  }
  const { variant: _v, size: _s, className: _c, children: _ch, type = "button", ...rest } = props;
  return (
    <button {...rest} type={type} className={classes}>
      {children}
    </button>
  );
}
