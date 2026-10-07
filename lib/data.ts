import { Cliente, Periodo } from "./types";

export type SerieVisitas = Record<
  Periodo,
  { labels: string[]; regulares: number[]; membresia: number[] }
>;

// Construye las series de visitas a partir de filas reales (visitas + membresía del cliente)
export function construirSeriesVisitas(
  visitas: { created_at: string; membresia: boolean }[]
): SerieVisitas {
  const DAY = 24 * 60 * 60 * 1000;
  const inicioDeHoy = new Date();
  inicioDeHoy.setHours(0, 0, 0, 0);

  // --- últimos 7 días ---
  const dias = Array.from({ length: 7 }, (_, i) => new Date(inicioDeHoy.getTime() - (6 - i) * DAY));
  const nombresDias = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const enMismoDia = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const dia = {
    labels: dias.map((d) => nombresDias[d.getDay()]),
    regulares: dias.map((d) => visitas.filter((v) => !v.membresia && enMismoDia(new Date(v.created_at), d)).length),
    membresia: dias.map((d) => visitas.filter((v) => v.membresia && enMismoDia(new Date(v.created_at), d)).length),
  };

  // --- últimas 4 semanas (bloques de 7 días) ---
  const semanas = [0, 1, 2, 3].map((i) => ({
    desde: new Date(inicioDeHoy.getTime() - (3 - i) * 7 * DAY),
    hasta: new Date(inicioDeHoy.getTime() - (2 - i) * 7 * DAY),
  }));
  const semana = {
    labels: ["Sem 1", "Sem 2", "Sem 3", "Sem 4"],
    regulares: semanas.map((s) => visitas.filter((v) => !v.membresia && new Date(v.created_at) >= s.desde && new Date(v.created_at) < s.hasta).length),
    membresia: semanas.map((s) => visitas.filter((v) => v.membresia && new Date(v.created_at) >= s.desde && new Date(v.created_at) < s.hasta).length),
  };

  // --- últimos 6 meses ---
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(inicioDeHoy);
    d.setMonth(d.getMonth() - (5 - i));
    return d;
  });
  const nombresMeses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const mes = {
    labels: meses.map((d) => nombresMeses[d.getMonth()]),
    regulares: meses.map((d) => visitas.filter((v) => !v.membresia && new Date(v.created_at).getMonth() === d.getMonth() && new Date(v.created_at).getFullYear() === d.getFullYear()).length),
    membresia: meses.map((d) => visitas.filter((v) => v.membresia && new Date(v.created_at).getMonth() === d.getMonth() && new Date(v.created_at).getFullYear() === d.getFullYear()).length),
  };

  return { dia, semana, mes };
}

