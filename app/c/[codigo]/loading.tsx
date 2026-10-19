import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de la tarjeta pública del cliente
export default function Loading() {
  return (
    <div className="flex min-h-dvh flex-col items-center gap-6 bg-cream px-4 py-10">
      <Skeleton className="h-16 w-16 rounded-2xl" />
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-72 w-full max-w-sm rounded-card bg-ink/20" />
    </div>
  );
}