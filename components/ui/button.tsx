import {ButtonHTMLAttributes, forwardRef} from "react";
import {cn} from "@/lib/utils";

type Variant = "primary" | "accent" | "subtle" | "outline" | "ghost";

const base = 
"inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-button px-6 font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/40 disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-ink hover:bg-primary/90",  //accion principal
  accent: "bg-accent text-ink hover:bg-accent/90",     // accion secundaria / cta camara
  subtle: "border border-ink/15 bg-white text-ink hover:bg-cream", // boton blanco
  outline: "border border-ink/25 bg-transparent text-ink hover:bg-cream", // boton contorno
  ghost: "text-muted hover:text-ink",
};

export function buttonVariants({ variant = "primary" }: { variant?: Variant } = {}) {
  return cn(base, variants[variant]);
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={cn(buttonVariants({ variant }), className)} {...props} />;
}