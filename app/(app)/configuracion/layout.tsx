import ConfigNav from "@/components/config/config-nav";

export default function ConfigLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:items-start lg:gap-8">
      <div className="flex flex-col gap-5 lg:gap-8">
        <h1 className="text-3xl font-bold">Configuración</h1>
        <ConfigNav />
      </div>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
