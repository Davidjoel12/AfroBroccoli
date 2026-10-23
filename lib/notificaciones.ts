import type { Cliente, Premio } from "@/lib/types";

// ============================================================================
// Sistema de notificaciones del salón AfroBroccoli
//
// Tres tipos de notificación:
//   1. Cumpleaños próximos (2 días por defecto)
//   2. Premio pendiente de entregar (cliente completó su meta de sellos)
//   3. Cliente inactivo (no ha vuelto en 1 mes 15 días) → reagendar cita
//
// Los umbrales son configurables. Mientras el backend no exista, esta
// librería funciona sobre los datos de `Cliente` que ya llegan de Supabase.
// Los premios vienen de la tabla `premios` (el contador se reinicia a 0 al
// completar la meta, así que no se pueden deducir de `sellos`).
// ============================================================================

export type TipoNotificacion = "cumpleanos" | "premio_pendiente" | "inactividad";

export type Notificacion = {
  id: string;
  tipo: TipoNotificacion;
  clienteId: string;
  clienteNombre: string;
  clienteCodigo: string;
  telefono?: string; // para abrir WhatsApp al hacer clic
  titulo: string;
  cuerpo: string;
  leida: boolean;
  fecha: string; // ISO string
  /** Solo en `premio_pendiente`: id de la fila en `premios` para marcarla entregada. */
  premioId?: string;
};

export type UmbralesNotificacion = {
  diasCumpleanos: number;
  diasInactividad: number;
};

export const UMBRALES_POR_DEFECTO: UmbralesNotificacion = {
  diasCumpleanos: 2,
  diasInactividad: 45, // 1 mes + 15 días
};

/** Calcula la edad que cumplirá este año (o el próximo si ya pasó). */
function proximoCumpleanos(fechaNacimiento: string): Date {
  const hoy = new Date();
  const [mes, dia] = fechaNacimiento.split("-").slice(1).map(Number);
  const esteAnio = new Date(hoy.getFullYear(), mes - 1, dia);
  const proximoAnio = new Date(hoy.getFullYear() + 1, mes - 1, dia);
  return esteAnio >= hoy ? esteAnio : proximoAnio;
}

/** Días entre dos fechas (fecha de referencia → fecha objetivo). */
function diasHasta(fechaObjetivo: Date, referencia: Date = new Date()): number {
  const inicioReferencia = new Date(referencia);
  inicioReferencia.setHours(0, 0, 0, 0);
  const inicioObjetivo = new Date(fechaObjetivo);
  inicioObjetivo.setHours(0, 0, 0, 0);
  const diffMs = inicioObjetivo.getTime() - inicioReferencia.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Genera la lista de notificaciones activas a partir de los clientes.
 * Se ejecuta en cliente o servidor según quién llame.
 */
export function generarNotificaciones(
  clientes: Cliente[],
  premios: Premio[] = [],
  umbrales: UmbralesNotificacion = UMBRALES_POR_DEFECTO,
  ahora: Date = new Date()
): Notificacion[] {
  const hoy = new Date(ahora);
  hoy.setHours(0, 0, 0, 0);

  const notificaciones: Notificacion[] = [];

  // ─── 1. Premios pendientes de entregar ───
  // Se generan desde `premios` (no desde `sellos`, que ya volvieron a 0).
  for (const p of premios) {
    notificaciones.push({
      id: `premio-${p.id}`,
      tipo: "premio_pendiente",
      clienteId: p.clienteId,
      clienteNombre: p.clienteNombre,
      clienteCodigo: p.clienteCodigo,
      telefono: p.telefono,
      titulo: "Recompensa pendiente",
      cuerpo: `${p.clienteNombre} completó sus ${p.meta} sellos. Por entregar: ${p.recompensa}.`,
      leida: false,
      fecha: p.fecha,
      premioId: p.id,
    });
  }

  for (const c of clientes) {
    // ─── 2. Cumpleaños próximos ───
    if (c.fechaNacimiento) {
      const proximo = proximoCumpleanos(c.fechaNacimiento);
      const dias = diasHasta(proximo, hoy);
      if (dias >= 0 && dias <= umbrales.diasCumpleanos) {
        notificaciones.push({
          id: `cumple-${c.id}`,
          tipo: "cumpleanos",
          clienteId: c.id,
          clienteNombre: c.nombre,
          clienteCodigo: c.codigo,
          telefono: c.telefonoFormato ?? c.telefono ?? undefined,
          titulo: "Cumpleaños próximo",
          cuerpo: dias === 0
            ? `Hoy es el cumpleaños de ${c.nombre}.`
            : `Faltan ${dias} día${dias === 1 ? "" : "s"} para el cumpleaños de ${c.nombre}.`,
          leida: false,
          fecha: hoy.toISOString(),
        });
      }
    }

    // ─── 3. Inactividad (no ha vuelto en X días) ───
    if (c.ultimaVisita) {
      const ultima = new Date(c.ultimaVisita);
      const diasInactivo = diasHasta(hoy, ultima);
      if (diasInactivo >= umbrales.diasInactividad) {
        notificaciones.push({
          id: `inactivo-${c.id}`,
          tipo: "inactividad",
          clienteId: c.id,
          clienteNombre: c.nombre,
          clienteCodigo: c.codigo,
          telefono: c.telefonoFormato ?? c.telefono ?? undefined,
          titulo: "Cliente inactivo",
          cuerpo: `${c.nombre} no vuelve hace ${diasInactivo} días. Reagendá su cita.`,
          leida: false,
          fecha: hoy.toISOString(),
        });
      }
    }
  }

  // Más recientes primero
  notificaciones.sort((a, b) => b.fecha.localeCompare(a.fecha));
  return notificaciones;
}

/** Icono por tipo de notificación (SVG embebido). */
export function iconoPorTipo(tipo: TipoNotificacion): string {
  switch (tipo) {
    case "cumpleanos":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.2 17.9c-1.2-.8-2.6-1.2-4.1-1.2a5.8 5.8 0 0 0-5.8 5.8c0 .9.2 1.8.6 2.5.2-.7.6-1.3 1-1.9 1.8-2.8 2.6-4.9 2.6-4.9s-2.5-.9-3.6-.4c-.8.4-1.4 1.1-1.4 1.9s1 1.1 1.7 1c1.3-.3 1.5-.6 1.6-1 .2-.6.8-1.2 1-1.9a5.8 5.8 0 0 0-5.8-5.8c-1.5 0-3 .4-4.1 1.2-1.5.9-2.2 2.3-1.9 3.9.3 1.6 1.7 2.9 3.4 3.2 1.1.2 2.3-.2 3.1-1 .5-.5.8-1.2.8-1.8 0-1-.4-1.9-1-2.6a5.4 5.4 0 0 1 1-3.8c1.8-.9 3.6-1.2 5.3-1s3.7.2 5.3 1c.3.2.5.5.6.9.4 1.1-.2 2.2-1.4 3z"/><circle cx="12" cy="13" r="1"/></svg>`;
    case "premio_pendiente":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.6 3.3c-.3-.5-.8-.8-1.3-.8h-8.3c-.5 0-1 .3-1.3.8s-.4 1-.2 1.5l3.1 4.2c.3.4.6.9.6 1.4s-.2 1-.6 1.4l-3.1 4.2c-.2.3-.4.7-.4 1.1s.3.8.6 1.1c.3.3.7.5 1.1.5h8.3c.5 0 1-.2 1.3-.6s.4-1 .2-1.5l-3.1-4.2c-.3-.4-.6-.9-.6-1.4s.2-1 .6-1.4l3.1-4.2c.2-.3.4-.7.4-1.1s-.3-.8-.6-1.1c-.3-.3-.7-.5-1.1-.5z"/><path d="M9 17v6h6v-6"/></svg>`;
    case "inactividad":
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    default:
      return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`;
  }
}

/** Color de acento por tipo de notificación. */
export function colorPorTipo(tipo: TipoNotificacion): string {
  switch (tipo) {
    case "cumpleanos":
      return "#FF66C4"; // accent (rosa)
    case "premio_pendiente":
      return "#6FC22D"; // primary (verde)
    case "inactividad":
      return "#E23650"; // danger (rojo)
    default:
      return "#6B5F5A"; // muted
  }
}

/** Etiqueta del badge de conteo para mostrar en la campana. */
export function textoBadge(cantidad: number): string {
  return cantidad > 9 ? "9+" : String(cantidad);
}
