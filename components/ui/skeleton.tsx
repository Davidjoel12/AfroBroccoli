import { cn } from "@/lib/utils";

// Igual que la animación shimmer del proyecto nextjs-dashboard (app/ui/skeletons.tsx):
// franja blanca que barre de izquierda a derecha sobre el bloque.
const shimmer =
  "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        shimmer,
        "relative overflow-hidden rounded-2xl bg-ink/10",
        className
      )}
    />
  );
}
