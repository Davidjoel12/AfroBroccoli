import { headers } from "next/headers";
import { Card } from "@/components/ui/card";
import { MetricCard } from "@/components/home/metric-card";
import { VisitsChart } from "@/components/home/charts";
import { ClientsTable } from "@/components/home/clients-table";
import { WelcomeCard, DistributionCard } from "@/components/home/home-blocks";
import { construirSeriesVisitas } from "@/lib/data";
import { claveDia } from "@/lib/fechas";
import { createClient } from "@/lib/supabase-server";
import { Cliente, Premio } from "@/lib/types";
import { leerConfigTarjeta, metaDeCliente } from "@/lib/config";
import { ClientesSync } from "@/components/notifications/clientes-sync";
import { PremiosSync } from "@/components/notifications/premios-sync";

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
    .select("id, codigo, nombre, email, pais, telefono, membresia, sellos(cantidad)");

  const { data: visitasData } = await supabase
    .from("visitas")
    .select("created_at, cliente_id, clientes(membresia)");

  // Premios pendientes de entregar. Si la tabla todavía no existe (migración sin
  // correr), la consulta falla y simplemente no se muestran premios.
  const { data: premiosData } = await supabase
    .from("premios")
    .select("id, folio, recompensa, meta, created_at, cliente_id, clientes(nombre, codigo, telefono)")
    .eq("estado", "pendiente")
    .order("created_at", { ascending: false });

  // Config de la tarjeta: cada tipo de cliente tiene su meta (regular / miembro)
  const config = await leerConfigTarjeta(supabase);
  const logoUrl = config.logoUrl;

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
      codigo: c.codigo ?? "",
      nombre: c.nombre,
      correo: c.email ?? "",
      pais: c.pais ?? null,
      telefono,
      telefonoFormato: c.telefono ?? "",
      sellos,
      metaSellos: metaDeCliente(c.membresia, config),
      membresia: c.membresia,
      visitas: visitasPorCliente.get(c.id) ?? 0,
    };
  });

  const regulares = clientes.filter((c) => !c.membresia);
  const membresia = clientes.filter((c) => c.membresia);

  const premios: Premio[] = (premiosData ?? []).map((p) => {
    const join = p.clientes as unknown;
    const cliente = Array.isArray(join)
      ? (join[0] as { nombre?: string; codigo?: string; telefono?: string } | undefined)
      : (join as { nombre?: string; codigo?: string; telefono?: string } | null);
    return {
      id: p.id,
      clienteId: p.cliente_id,
      clienteNombre: cliente?.nombre ?? "",
      clienteCodigo: cliente?.codigo ?? "",
      telefono: (cliente?.telefono ?? "").replace(/[^\d]/g, "") || undefined,
      folio: p.folio,
      recompensa: p.recompensa,
      meta: p.meta,
      fecha: p.created_at,
    };
  });

  const hoy = claveDia();
  const visitasHoy = (visitasData ?? []).filter(
    (v) => claveDia(v.created_at) === hoy
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

  // Origen real del sitio (localhost, túnel de pruebas o Vercel): se usa para armar
  // el link de la tarjeta del cliente que va en el mensaje de WhatsApp. Se resuelve
  // acá en el servidor para que el HTML del servidor y el del navegador coincidan.
  const cab = await headers();
  const host = cab.get("x-forwarded-host") ?? cab.get("host") ?? "localhost:3000";
  const proto = cab.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origen = `${proto}://${host}`;

  return (
    <div className="flex flex-col gap-6">
      {/* ===== Bienvenida (móvil-first: sala arriba de todo) ===== */}
      <WelcomeCard logoUrl={logoUrl} />

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

      {/* ===== Gráficos (se apilan en móvil) ===== */}
      <div className="grid gap-6 lg:grid-cols-2">
        <DistributionCard data={distribucion} />

        <Card className="min-w-0">
          <VisitsChart series={series} />
        </Card>
      </div>

      {/* 2 columnas solo a partir de 1536px: con menos ancho la tabla de 7 columnas
          se cortaba y obligaba a scrollear dentro de la tarjeta */}
      <div className="grid gap-6 2xl:grid-cols-2">
        <ClientsTable titulo="Clientes regulares" clientes={regulares} esAdmin={esAdmin} origen={origen} />
        <ClientsTable titulo="Clientes membresía" clientes={membresia} esAdmin={esAdmin} origen={origen} />
      </div>

      {/* Sincroniza clientes y premios pendientes con el provider de notificaciones */}
      <ClientesSync clientes={clientes} />
      <PremiosSync premios={premios} />
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
