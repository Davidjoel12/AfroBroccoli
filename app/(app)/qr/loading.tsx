import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de la pantalla Código QR
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="lg:hidden">
        <Skeleton className="h-11 rounded-full bg-white/60" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <Skeleton className="h-64" />
          <Skeleton className="h-40" />
        </div>
        <div className="hidden min-w-0 flex-col gap-6 lg:flex">
          <Skeleton className="h-80" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
