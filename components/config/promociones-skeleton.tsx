import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de Promociones: se usa al navegar y mientras cargan los datos en el cliente.
export default function PromocionesSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true">
      <Skeleton className="h-40 rounded-card bg-ink/20" />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <Skeleton className="h-[560px] rounded-card bg-white/60" />
        <Skeleton className="h-[420px] rounded-card bg-white/60" />
      </div>
    </div>
  );
}
