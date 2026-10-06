import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/home/metric-card";
import { VisitsChart, DistributionChart } from "@/components/home/charts";
import { ClientsTable } from "@/components/home/clients-table";
import { clientes, distribucion, metricas } from "@/lib/data";

export default function Home() {
  const regulares = clientes.filter((c) => !c.membresia);
  const membresia = clientes.filter((c) => c.membresia);

  return (
    <div className="flex flex-col gap-6">
      {/* ===== Bienvenida (móvil-first: sala arriba de todo) ===== */}
      <Card className="flex items-center gap-4 bg-mint">
        <Image src="/logo.jpg" alt="AfroBroccoli" width={56} height={56} className="rounded-2xl" />
        <div>
          <p className="font-script text-2xl leading-tight">Bienvenida de vuelta,</p>
          <p className="text-2xl font-bold leading-tight">AfroBroccoli</p>
        </div>
      </Card>

      {/* ===== Métricas ===== */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard
          label="Clientes Totales"
          value={metricas.clientesTotales}
          icon={<UsersIcon />}
        />
        <MetricCard
          label="Visitas hoy"
          value={metricas.visitasHoy}
          icon={<CalendarIcon />}
        />
        <MetricCard
          label="Sellos Totales"
          value={metricas.sellosTotales}
          icon={<StampIcon />}
        />
      </div>

      {/* ===== Acciones rápidas + distribución (se apila en móvil) ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <h2 className="text-lg font-semibold">Acciones rápidas</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Link href="/qr" className={`${buttonVariants()} w-full px-4`}>
              Escanear QR de cliente
            </Link>
            <Link href="/qr" className={`${buttonVariants({ variant: "accent" })} w-full px-4`}>
              Ver mi QR de registro
            </Link>
          </div>

          <Card className="bg-ink text-cream">
            <h3 className="mb-3 text-lg font-semibold">Distribución de clientes</h3>
            <DistributionChart data={distribucion} />
          </Card>
        </div>

        <Card className="min-w-0">
          <VisitsChart />
        </Card>
      </div>

      {/* ===== Tablas de clientes ===== */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ClientsTable titulo="Clientes regulares" clientes={regulares} />
        <ClientsTable titulo="Clientes con membresía" clientes={membresia} />
      </div>
    </div>
  );
}

function UsersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function StampIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c-2.8 0-5 2.2-5 5 0 3 2 4 2 7h6c0-3 2-4 2-7 0-2.8-2.2-5-5-5Z" />
      <rect x="7" y="18" width="10" height="3" rx="1" />
    </svg>
  );
}
