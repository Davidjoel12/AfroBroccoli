import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de Personalizar tarjeta
export default function Loading() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Skeleton className="h-[480px] rounded-card bg-white/60" />
      <Skeleton className="h-80 rounded-card bg-white/60" />
    </div>
  );
}
