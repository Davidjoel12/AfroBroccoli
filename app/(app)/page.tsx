import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/home/metric-card";
import { VisitsChart, DistributionChart } from "@/components/home/charts";
import { ClientsTable } from "@/components/home/clients-table";
import { construirSeriesVisitas } from "@/lib/data";
import { createClient } from "@/lib/supabase-server";
import { Cliente } from "@/lib/types";

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: perfil } = user
    ? await supabase.from("profiles").select("role").eq("id", user.id).single()
    : { data: null };
  const esAdmin = perfil?.role === "admin";

  const { data: clientesData } = await supabase
    .from("clientes")
    .select("id, nombre, email, pais, telefono, membresia, sellos(cantidad)");

  const { data: visitasData } = await supabase
    .from("visitas")
    .select("created_at, cliente_id, clientes(membresia)");

  const { data: configData } = await supabase.from("config").select("meta").eq("id", 1).single();
  const metaGlobal = configData?.meta ?? 5;

  const visitasPorCliente = new Map<string, number>();
  for (const v of visitasData ?? []) {
    if (v.cliente_id) visitasPorCliente.set(v.cliente_id, (visitasPorCliente.get(v.cliente_id) ?? 0) + 1);
  }

  const clientes: Cliente[] = (clientesData ?? []).map((c) => {
    const sellosJoin = c.sellos as unknown;
    const sellos = Array.isArray(sellosJoin)
      ? (sellosJoin[0] as { cantidad: number } | undefined)?.cantidad ?? 0
      : (sellosJoin as { cantidad: number } | null)?.cantidad ?? 0;
    const telefono = (c.telefono ?? "").replace(/[^\d]/g, "");
    return {
      id: c.id,
      nombre: c.nombre,
      correo: c.email ?? "",
      pais: c.pais ?? "pa",
      telefono,
      telefonoFormato: c.telefono ?? "",
      sellos,
      metaSellos: metaGlobal,
      membresia: c.membresia,
      visitas: visitasPorCliente.get(c.id) ?? 0,
    };
  });

  const regulares = clientes.filter((c) => !c.membresia);
  const membresia = clientes.filter((c) => c.membresia);

  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);
  const visitasHoy = (visitasData ?? []).filter(
    (v) => new Date(v.created_at) >= inicioDeHoy
  ).length;

  const sellosTotales = clientes.reduce((acc, c) => acc + c.sellos, 0);
  const distribucion = [regulares.length, membresia.length];
  const metricas = { clientesTotales: clientes.length, visitasHoy, sellosTotales };

  const visitasParaSerie = (visitasData ?? []).map((v) => {
    const join = v.clientes as unknown;
    const membresiaJoin = Array.isArray(join)
      ? (join[0] as { membresia: boolean } | undefined)?.membresia
      : (join as { membresia: boolean } | null)?.membresia;
    return { created_at: v.created_at, membresia: membresiaJoin ?? false };
  });
  const series = construirSeriesVisitas(visitasParaSerie);

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
          <VisitsChart series={series} />
        </Card>
      </div>

      {/* ===== Tablas de clientes ===== */}
      <div className="grid gap-6 xl:grid-cols-2">
        <ClientsTable titulo="Clientes regulares" clientes={regulares} esAdmin={esAdmin} />
        <ClientsTable titulo="Clientes con membresía" clientes={membresia} esAdmin={esAdmin} />
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
