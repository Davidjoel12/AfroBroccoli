import { redirect } from "next/navigation";
import MiembrosPanel from "@/components/config/miembros-panel";
import { devDelay } from "@/lib/dev-delay";
import { claveDia } from "@/lib/fechas";
import {
  calcularResumenMembresia,
  normalizarConfigMembresia,
  type MiembroMembresia,
  type PeriodoMembresia,
} from "@/lib/miembros";
import { createClient } from "@/lib/supabase-server";

type ClienteFila = {
  id: string;
  codigo: string | null;
  nombre: string;
  email: string | null;
  telefono: string | null;
  membresia: boolean;
  membresia_desde: string | null;
};

type PeriodoFila = {
  id: string;
  cliente_id: string;
  periodo: string;
  vence_el: string | null;
  monto: number | string | null;
  estado: string;
  pagado_at: string | null;
  nota: string | null;
  revisar: boolean | null;
  recordatorio_at: string | null;
  recordatorio_count: number | null;
};

function esEstadoCuota(valor: string): valor is PeriodoMembresia["estado"] {
  return valor === "pendiente" || valor === "pagado" || valor === "exento";
}

export default async function MiembrosPage() {
  await devDelay();

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") redirect("/");

  let setupError = "";

  const { error: errPreparar } = await supabase.rpc("preparar_membresias_mes");
  if (errPreparar) {
    setupError = errPreparar.message;
    console.error("[miembros:preparar]", errPreparar.code, errPreparar.message);
  }

  const { error: errRevisar } = await supabase.rpc("marcar_membresias_revisar");
  if (errRevisar) {
    if (!setupError) setupError = errRevisar.message;
    console.error("[miembros:revisar]", errRevisar.code, errRevisar.message);
  }

  const { data: configData, error: errConfig } = await supabase
    .from("config")
    .select("membresia_monto, membresia_dia_cobro, membresia_dias_gracia")
    .eq("id", 1)
    .maybeSingle();

  if (errConfig && !setupError) setupError = errConfig.message;

  const config = normalizarConfigMembresia(configData);

  const columnasCompletas =
    "id, codigo, nombre, email, telefono, membresia, membresia_desde";
  const columnasBase =
    "id, codigo, nombre, email, telefono, membresia, created_at";

  const { data: clientesData, error: errClientes } = await supabase
    .from("clientes")
    .select(columnasCompletas)
    .eq("membresia", true)
    .order("nombre");

  let filasClientes = (clientesData ?? []) as ClienteFila[];

  if (errClientes) {
    console.error("[miembros:clientes]", errClientes.code, errClientes.message);
    if (!setupError) setupError = errClientes.message;

    // Si falta el SQL nuevo, igual mostramos la lista de miembros para que el
    // admin sepa a quién tiene que configurar. Sin cuotas no se puede cobrar.
    const { data: baseData } = await supabase
      .from("clientes")
      .select(columnasBase)
      .eq("membresia", true)
      .order("nombre");

    filasClientes = ((baseData ?? []) as Array<Omit<ClienteFila, "membresia_desde">>).map(
      (cliente) => ({
        ...cliente,
        membresia_desde: null,
      })
    );
  }

  const ids = filasClientes.map((cliente) => cliente.id);
  let filasPeriodos: PeriodoFila[] = [];

  if (ids.length > 0) {
    const { data: periodosData, error: errPeriodos } = await supabase
      .from("membresias_periodos")
      .select(
        "id, cliente_id, periodo, vence_el, monto, estado, pagado_at, nota, revisar, recordatorio_at, recordatorio_count"
      )
      .in("cliente_id", ids)
      .order("periodo", { ascending: false });

    if (errPeriodos) {
      console.error("[miembros:periodos]", errPeriodos.code, errPeriodos.message);
      if (!setupError) setupError = errPeriodos.message;
    } else {
      filasPeriodos = (periodosData ?? []) as PeriodoFila[];
    }
  }

  const periodosPorCliente = new Map<string, PeriodoMembresia[]>();

  for (const fila of filasPeriodos) {
    if (!esEstadoCuota(fila.estado)) continue;

    const periodo: PeriodoMembresia = {
      id: fila.id,
      clienteId: fila.cliente_id,
      periodo: fila.periodo,
      venceEl: fila.vence_el,
      monto: Number(fila.monto) || 0,
      estado: fila.estado,
      pagadoAt: fila.pagado_at,
      nota: fila.nota,
      revisar: Boolean(fila.revisar),
      recordatorioAt: fila.recordatorio_at,
      recordatorioCount: Number(fila.recordatorio_count) || 0,
    };

    const lista = periodosPorCliente.get(fila.cliente_id) ?? [];
    lista.push(periodo);
    periodosPorCliente.set(fila.cliente_id, lista);
  }

  const hoy = claveDia();

  const miembros: MiembroMembresia[] = filasClientes.map((cliente) => {
    const periodos = periodosPorCliente.get(cliente.id) ?? [];
    const resumen = calcularResumenMembresia(
      periodos,
      hoy,
      config.diasGracia
    );

    return {
      id: cliente.id,
      codigo: cliente.codigo ?? "",
      nombre: cliente.nombre,
      correo: (cliente.email ?? "").trim(),
      telefono: (cliente.telefono ?? "").replace(/[^\d]/g, ""),
      telefonoFormato: cliente.telefono ?? "",
      membresiaDesde: cliente.membresia_desde,
      periodos,
      ...resumen,
    };
  });

  return (
    <MiembrosPanel
      miembros={miembros}
      config={config}
      hoy={hoy}
      setupError={setupError || null}
    />
  );
}
