import { Periodo } from "./types";
import { claveDia, claveDeCivil, hoyCivil } from "./fechas";

export type SerieVisitas = Record<
  Periodo,
  { labels: string[]; regulares: number[]; membresia: number[] }
>;

// Construye las series de visitas a partir de filas reales (visitas + membresía del cliente).
// Los días se calculan en la zona horaria del salón (America/Panama), no en la
// del servidor, para que una visita de la noche no caiga en el día siguiente.
export function construirSeriesVisitas(
  visitas: { created_at: string; membresia: boolean }[]
): SerieVisitas {
  const DAY = 24 * 60 * 60 * 1000;
  const hoy = hoyCivil();
  const visitasConDia = visitas.map((v) => ({
    ...v,
    dia: claveDia(v.created_at),
  }));

  // --- últimos 7 días ---
  const dias = Array.from({ length: 7 }, (_, i) => new Date(hoy.getTime() - (6 - i) * DAY));
  const clavesDias = dias.map(claveDeCivil);
  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

  const dia = {
    labels: dias.map((d) => nombresDias[d.getUTCDay()]),
    regulares: clavesDias.map(
      (clave) =>
        visitasConDia.filter((v) => !v.membresia && v.dia === clave).length
    ),
    membresia: clavesDias.map(
      (clave) =>
        visitasConDia.filter((v) => v.membresia && v.dia === clave).length
    ),
  };

  // --- últimas 4 semanas (bloques de 7 días) ---
  const semanas = [0, 1, 2, 3].map((i) => ({
    desde: claveDeCivil(new Date(hoy.getTime() - (3 - i) * 7 * DAY)),
    hasta: claveDeCivil(new Date(hoy.getTime() - (2 - i) * 7 * DAY)),
  }));
  const semana = {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    regulares: semanas.map(
      (s) =>
        visitasConDia.filter(
          (v) => !v.membresia && v.dia >= s.desde && v.dia < s.hasta
        ).length
    ),
    membresia: semanas.map(
      (s) =>
        visitasConDia.filter(
          (v) => v.membresia && v.dia >= s.desde && v.dia < s.hasta
        ).length
    ),
  };

  // --- últimos 6 meses ---
  const meses = Array.from(
    { length: 6 },
    (_, i) =>
      new Date(Date.UTC(hoy.getUTCFullYear(), hoy.getUTCMonth() - (5 - i), 1))
  );
  const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mes = {
    labels: meses.map((d) => nombresMeses[d.getUTCMonth()]),
    regulares: meses.map((d) => {
      const prefijo = claveDeCivil(d).slice(0, 7);
      return visitasConDia.filter((v) => !v.membresia && v.dia.startsWith(prefijo)).length;
    }),
    membresia: meses.map((d) => {
      const prefijo = claveDeCivil(d).slice(0, 7);
      return visitasConDia.filter((v) => v.membresia && v.dia.startsWith(prefijo)).length;
    }),
  };

  return { dia, semana, mes };
}
