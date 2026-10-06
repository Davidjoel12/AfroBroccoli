import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto de la portada (Home)
export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-24 rounded-card bg-mint/50" />
      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
        <Skeleton className="h-28" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <Skeleton className="h-6 w-40" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-11 rounded-button" />
            <Skeleton className="h-11 rounded-button" />
          </div>
          <Skeleton className="h-64" />
        </div>
        <Skeleton className="h-80" />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}
