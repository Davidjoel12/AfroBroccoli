// ============================================================================
// Fechas del salón
//
// Supabase guarda los timestamps en UTC, que es lo correcto. El problema es
// agruparlos por "día": si se usa la zona del servidor (Vercel corre en UTC por
// defecto), una visita hecha a las 8 p.m. en Panamá cae en el día siguiente.
//
// Estas utilidades calculan el día en la zona del salón sin depender de la
// zona horaria del servidor ni de la del navegador.
// ============================================================================

export const ZONA_HORARIA = "America/Panama";

const formateador = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_HORARIA,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Clave "YYYY-MM-DD" del día en la zona horaria del salón. */
export function claveDia(fecha: Date | string = new Date()): string {
  const d = typeof fecha === "string" ? new Date(fecha) : fecha;
  const partes = formateador.formatToParts(d);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    partes.find((parte) => parte.type === tipo)?.value ?? "";
  return `${valor("year")}-${valor("month")}-${valor("day")}`;
}

/**
 * Medianoche UTC del día actual en el salón. Es una fecha "civil" pensada solo
 * para sumar/restar días y leer el día de la semana con los getUTC*.
 */
export function hoyCivil(): Date {
  const [anio, mes, dia] = claveDia().split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

/** Clave "YYYY-MM-DD" de una fecha civil creada a partir de hoyCivil(). */
export function claveDeCivil(fechaCivil: Date): string {
  return fechaCivil.toISOString().slice(0, 10);
}
