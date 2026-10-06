import AppNav from "@/components/nav/app-nav";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col">
      <AppNav />
      <main className="flex-1 px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
