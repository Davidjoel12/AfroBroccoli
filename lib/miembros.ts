import { claveDia, MESES } from "./fechas";

// ============================================================================
// Membresía mensual
//
// La membresía es una suscripción aparte de la tarjeta de sellos. Acá viven
// los tipos, los valores por defecto y las cuentas que comparten la página de
// Miembros y el escáner.
// ============================================================================

export const MONTO_MEMBRESIA_POR_DEFECTO = 65;
export const DIA_COBRO_POR_DEFECTO = 28;
export const DIAS_GRACIA_POR_DEFECTO = 5;

export type EstadoCuota = "pendiente" | "pagado" | "exento";
export type EstadoMembresia = "al_dia" | "pendiente" | "vencido" | "sin_periodo";

export type ConfigMembresia = {
  monto: number;
  diaCobro: number;
  diasGracia: number;
};

export type PeriodoMembresia = {
  id: string;
  clienteId: string;
  /** Primer día del mes: "2026-11-01". */
  periodo: string;
  venceEl: string | null;
  monto: number;
  estado: EstadoCuota;
  pagadoAt: string | null;
  nota: string | null;
  revisar: boolean;
  recordatorioAt: string | null;
  recordatorioCount: number;
};

export type MiembroMembresia = {
  id: string;
  codigo: string;
  nombre: string;
  correo: string;
  telefono: string;
  telefonoFormato: string;
  membresiaDesde: string | null;
  periodos: PeriodoMembresia[];
  periodoActual: PeriodoMembresia | null;
  periodoPendiente: PeriodoMembresia | null;
  estado: EstadoMembresia;
  revisar: boolean;
  adeudos: number;
  ultimoPago: PeriodoMembresia | null;
  pagosMes: number;
  cobradoMes: number;
  porCobrar: number;
  totalPagado: number;
};

export function configMembresiaPorDefecto(): ConfigMembresia {
  return {
    monto: MONTO_MEMBRESIA_POR_DEFECTO,
    diaCobro: DIA_COBRO_POR_DEFECTO,
    diasGracia: DIAS_GRACIA_POR_DEFECTO,
  };
}

type FilaConfigMembresia = {
  membresia_monto?: number | string | null;
  membresia_dia_cobro?: number | string | null;
  membresia_dias_gracia?: number | string | null;
};

export function normalizarConfigMembresia(
  fila: FilaConfigMembresia | null | undefined
): ConfigMembresia {
  const base = configMembresiaPorDefecto();
  if (!fila) return base;

  const monto = Number(fila.membresia_monto);
  const dia = Number(fila.membresia_dia_cobro);
  const gracia = Number(fila.membresia_dias_gracia);

  return {
    monto: Number.isFinite(monto) && monto >= 0 ? monto : base.monto,
    diaCobro:
      Number.isInteger(dia) && dia >= 1 && dia <= 28 ? dia : base.diaCobro,
    diasGracia:
      Number.isInteger(gracia) && gracia >= 0 ? gracia : base.diasGracia,
  };
}

/** Primer día del mes de hoy en la zona del salón. */
export function mesActualClave(hoy = claveDia()): string {
  return `${hoy.slice(0, 7)}-01`;
}

/** Suma días a una fecha civil `YYYY-MM-DD` sin que la zona horaria la corra. */
export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  const fechaUtc = new Date(Date.UTC(anio, mes - 1, dia + dias));
  return fechaUtc.toISOString().slice(0, 10);
}

export function partesMes(periodo: string): { mes: string; anio: number } {
  const [anio, mes] = periodo.slice(0, 10).split("-").map(Number);
  return {
    mes: MESES[mes - 1] ?? "",
    anio: Number.isFinite(anio) ? anio : 0,
  };
}

/** "28 nov 2026" (o "—" si no hay fecha). */
export function fechaCorta(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const clave = fecha.includes("T") ? claveDia(fecha) : fecha.slice(0, 10);
  const [anio, mes, dia] = clave.split("-").map(Number);
  const nombre = MESES[mes - 1];
  if (!anio || !nombre || !dia) return "—";
  return `${dia} ${nombre.slice(0, 3).toLowerCase()} ${anio}`;
}

/** "28 de noviembre de 2026" para correos y textos largos. */
export function fechaLarga(fecha: string | null | undefined): string {
  if (!fecha) return "—";
  const clave = fecha.includes("T") ? claveDia(fecha) : fecha.slice(0, 10);
  const [anio, mes, dia] = clave.split("-").map(Number);
  const nombre = MESES[mes - 1];
  if (!anio || !nombre || !dia) return "—";
  return `${dia} de ${nombre.toLowerCase()} de ${anio}`;
}

export function formatearMonto(monto: number): string {
  return new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: 2,
  }).format(Number.isFinite(monto) ? monto : 0);
}

/**
 * Estado visual de una cuota. `pendiente` dentro de la gracia todavía no es
 * `vencido`, pero tampoco está pagada.
 */
export function estadoCuotaDe(
  periodo: PeriodoMembresia,
  hoy: string,
  diasGracia: number
): "pagado" | "exento" | "pendiente" | "vencido" {
  if (periodo.estado === "pagado") return "pagado";
  if (periodo.estado === "exento") return "exento";
  if (!periodo.venceEl) return "pendiente";
  return hoy > sumarDias(periodo.venceEl, diasGracia) ? "vencido" : "pendiente";
}

/**
 * Calcula el estado de un miembro mirando TODAS las cuotas hasta el mes actual.
 * Una cuota vieja impaga deja al miembro vencido aunque el mes actual esté pago.
 */
export function calcularResumenMembresia(
  periodos: PeriodoMembresia[],
  hoy: string,
  diasGracia: number
): Omit<
  MiembroMembresia,
  | "id"
  | "codigo"
  | "nombre"
  | "correo"
  | "telefono"
  | "telefonoFormato"
  | "membresiaDesde"
  | "periodos"
> {
  const mes = mesActualClave(hoy);
  const hastaHoy = periodos
    .filter((p) => p.periodo <= mes)
    .sort((a, b) => a.periodo.localeCompare(b.periodo));

  const pendientes = hastaHoy.filter((p) => p.estado === "pendiente");
  const vencidas = pendientes.filter(
    (p) => estadoCuotaDe(p, hoy, diasGracia) === "vencido"
  );

  const periodoActual = hastaHoy.find((p) => p.periodo === mes) ?? null;
  const periodoPendiente = pendientes[0] ?? null;
  const ultimoPago =
    periodos
      .filter((p) => p.estado === "pagado" && p.pagadoAt)
      .sort((a, b) => (b.pagadoAt ?? "").localeCompare(a.pagadoAt ?? ""))[0] ??
    null;

  const estado: EstadoMembresia = vencidas.length
    ? "vencido"
    : pendientes.length
      ? "pendiente"
      : hastaHoy.length
        ? "al_dia"
        : "sin_periodo";

  return {
    periodoActual,
    periodoPendiente,
    estado,
    revisar: periodos.some((p) => p.revisar),
    adeudos: pendientes.length,
    ultimoPago,
    pagosMes: hastaHoy.filter(
      (p) => p.periodo === mes && p.estado === "pagado"
    ).length,
    cobradoMes:
      periodoActual?.estado === "pagado" ? Number(periodoActual.monto) : 0,
    porCobrar: pendientes.reduce((total, p) => total + Number(p.monto), 0),
    totalPagado: periodos
      .filter((p) => p.estado === "pagado")
      .reduce((total, p) => total + Number(p.monto), 0),
  };
}

/**
 * Cuotas que el admin todavía puede cobrar. Las cuotas exentas no se cobran y
 * no aparecen en el modal de pago.
 */
export function cuotasCobrables(
  periodos: PeriodoMembresia[],
  hoy = claveDia()
): PeriodoMembresia[] {
  const mes = mesActualClave(hoy);
  return periodos
    .filter((p) => p.periodo <= mes && p.estado === "pendiente")
    .sort((a, b) => a.periodo.localeCompare(b.periodo));
}
