import type { SupabaseClient } from "@supabase/supabase-js";
import { claveDia } from "./fechas";
import {
  calcularResumenMembresia,
  normalizarConfigMembresia,
  type ConfigMembresia,
  type MiembroMembresia,
  type PeriodoMembresia,
} from "./miembros";

// ============================================================================
// Lectura de datos de Miembros
//
// Vive fuera de la página para que la pantalla pueda renderizar su esqueleto
// al instante y cargar los datos en el cliente, igual que Perfil y
// Personalizar tarjeta. Las consultas siguen protegidas por RLS.
// ============================================================================

type ClienteFila = {
  id: string;
  codigo: string | null;
  nombre: string;
  email: string | null;
  telefono: string | null;
  membresia: boolean;
  membresia_desde: string | null;
  promociones_opt_out: boolean | null;
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

export type DatosMiembros = {
  miembros: MiembroMembresia[];
  config: ConfigMembresia;
  hoy: string;
  setupError: string | null;
};

function esEstadoCuota(valor: string): valor is PeriodoMembresia["estado"] {
  return valor === "pendiente" || valor === "pagado" || valor === "exento";
}

export async function cargarDatosMiembros(
  sb: SupabaseClient
): Promise<DatosMiembros> {
  let setupError = "";

  // La configuración no depende de las funciones SQL: la dejamos correr
  // mientras se preparan las cuotas del mes.
  const configPromise = sb
    .from("config")
    .select("membresia_monto, membresia_dia_cobro, membresia_dias_gracia")
    .eq("id", 1)
    .maybeSingle();

  const { error: errPreparar } = await sb.rpc("preparar_membresias_mes");
  if (errPreparar) {
    setupError = errPreparar.message;
    console.error("[miembros:preparar]", errPreparar.code, errPreparar.message);
  }

  const columnasCompletas =
    "id, codigo, nombre, email, telefono, membresia, membresia_desde, promociones_opt_out";
  const columnasBase =
    "id, codigo, nombre, email, telefono, membresia, created_at";

  // Los clientes se leen después de preparar las cuotas, pero en paralelo con
  // el marcado de cuotas viejas para revisar.
  const clientesPromise = sb
    .from("clientes")
    .select(columnasCompletas)
    .eq("membresia", true)
    .order("nombre");

  const { error: errRevisar } = await sb.rpc("marcar_membresias_revisar");
  if (errRevisar) {
    if (!setupError) setupError = errRevisar.message;
    console.error("[miembros:revisar]", errRevisar.code, errRevisar.message);
  }

  const [
    { data: configData, error: errConfig },
    { data: clientesData, error: errClientes },
  ] = await Promise.all([configPromise, clientesPromise]);

  if (errConfig && !setupError) setupError = errConfig.message;

  const config = normalizarConfigMembresia(configData);

  let filasClientes = (clientesData ?? []) as ClienteFila[];

  if (errClientes) {
    console.error("[miembros:clientes]", errClientes.code, errClientes.message);
    if (!setupError) setupError = errClientes.message;

    // Si falta el SQL nuevo, igual mostramos la lista de miembros para que el
    // admin sepa a quién tiene que configurar. Sin cuotas no se puede cobrar.
    const { data: baseData } = await sb
      .from("clientes")
      .select(columnasBase)
      .eq("membresia", true)
      .order("nombre");

    filasClientes = ((
      baseData ?? []
    ) as Array<Omit<ClienteFila, "membresia_desde" | "promociones_opt_out">>).map(
      (cliente) => ({
        ...cliente,
        membresia_desde: null,
        promociones_opt_out: false,
      })
    );
  }

  const ids = filasClientes.map((cliente) => cliente.id);
  let filasPeriodos: PeriodoFila[] = [];

  if (ids.length > 0) {
    const { data: periodosData, error: errPeriodos } = await sb
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
      promocionesOptOut: Boolean(cliente.promociones_opt_out),
      periodos,
      ...resumen,
    };
  });

  return {
    miembros,
    config,
    hoy,
    setupError: setupError || null,
  };
}
