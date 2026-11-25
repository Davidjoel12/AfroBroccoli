import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de Miembros: se usa al navegar y mientras cargan los datos en el cliente.
export default function MiembrosSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-48 rounded-card bg-ink/20" />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Skeleton className="h-28 rounded-card bg-white/60" />
        <Skeleton className="h-28 rounded-card bg-white/60" />
        <Skeleton className="h-28 rounded-card bg-white/60" />
        <Skeleton className="h-28 rounded-card bg-white/60" />
      </div>

      <Skeleton className="h-[440px] rounded-card bg-white/60" />
    </div>
  );
}
