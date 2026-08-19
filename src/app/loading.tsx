import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="mx-auto min-h-screen max-w-7xl p-6 lg:p-10">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-5 h-5 w-80" />
      <div className="mt-10 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-44" /><Skeleton className="h-44" /><Skeleton className="h-44" />
      </div>
    </main>
  );
}
