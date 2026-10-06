import { Skeleton } from "@/components/ui/skeleton";

// Esqueleto del Login
export default function Loading() {
  return (
    <main className="flex min-h-dvh flex-col lg:flex-row">
      <section className="flex items-center justify-center bg-ink/90 px-8 py-12 lg:w-1/2">
        <Skeleton className="h-48 w-48 rounded-2xl bg-cream/10" />
      </section>
      <section className="flex flex-1 items-center justify-center p-6">
        <div className="flex w-full max-w-sm flex-col gap-4">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11" />
          <Skeleton className="h-11 rounded-button" />
        </div>
      </section>
    </main>
  );
}
