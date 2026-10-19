import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Configuración de la tarjeta de cliente.
//
// Una sola fuente de verdad para:
//   · meta de sellos de clientes regulares
//   · meta de sellos de clientes miembros
//   · recompensa de cada tipo
//   · color de acento (compartido)
//
// La migración supabase/migrations/20261018090000_*.sql agrega meta_membresia
// y recompensa_membresia a `config`. Para que la app no se rompa mientras esa
// migración no está aplicada, leer() y guardar() reintentan con las columnas
// viejas. Cuando las columnas nuevas existen, se usan siempre.
// ============================================================================

export const META_POR_DEFECTO = 5;
export const RECOMPENSA_POR_DEFECTO = "1 servicio gratis";
export const COLOR_ACENTO_POR_DEFECTO = "#FF66C4";

/** Opciones de la meta de sellos (las mismas para regulares y miembros). */
export const METAS = ["4", "5", "8", "10"];

export type ConfigTarjeta = {
  meta: number;
  metaMembresia: number;
  recompensa: string;
  recompensaMembresia: string;
  colorAcento: string;
  logoUrl: string | null;
};

export function configPorDefecto(): ConfigTarjeta {
  return {
    meta: META_POR_DEFECTO,
    metaMembresia: META_POR_DEFECTO,
    recompensa: RECOMPENSA_POR_DEFECTO,
    recompensaMembresia: RECOMPENSA_POR_DEFECTO,
    colorAcento: COLOR_ACENTO_POR_DEFECTO,
    logoUrl: null,
  };
}

type FilaConfig = {
  meta?: number | null;
  meta_membresia?: number | null;
  recompensa?: string | null;
  recompensa_membresia?: string | null;
  color_acento?: string | null;
  logo_url?: string | null;
};

/** Rellena huecos y normaliza tipos; `porTipo` = la fila trae las columnas nuevas. */
function normalizar(fila: FilaConfig | null | undefined, porTipo: boolean): ConfigTarjeta {
  const base = configPorDefecto();
  if (!fila) return base;
  const meta = Number(fila.meta);
  const metaMembresia = porTipo ? Number(fila.meta_membresia) : meta;
  return {
    meta: Number.isFinite(meta) && meta > 0 ? meta : base.meta,
    metaMembresia: Number.isFinite(metaMembresia) && metaMembresia > 0 ? metaMembresia : meta || base.meta,
    recompensa: fila.recompensa?.trim() || base.recompensa,
    recompensaMembresia:
      (porTipo ? fila.recompensa_membresia : fila.recompensa)?.trim() || base.recompensaMembresia,
    colorAcento: fila.color_acento || base.colorAcento,
    logoUrl: fila.logo_url || null,
  };
}

const COLUMNAS_CON_TIPO = "meta, meta_membresia, recompensa, recompensa_membresia, color_acento, logo_url";
const COLUMNAS_SIN_TIPO = "meta, recompensa, color_acento, logo_url";

/** Lee la configuración de la tarjeta; cae a las columnas viejas si aún no hay migración. */
export async function leerConfigTarjeta(sb: SupabaseClient): Promise<ConfigTarjeta> {
  const { data, error } = await sb.from("config").select(COLUMNAS_CON_TIPO).eq("id", 1).maybeSingle();
  if (!error) return normalizar(data as FilaConfig | null, true);

  const { data: viejo, error: errorViejo } = await sb
    .from("config")
    .select(COLUMNAS_SIN_TIPO)
    .eq("id", 1)
    .maybeSingle();
  if (errorViejo) return configPorDefecto();
  return normalizar(viejo as FilaConfig | null, false);
}

export type ResultadoGuardado = {
  ok: boolean;
  /** Las columnas por tipo todavía no existen: se guardó lo compartido pero no la meta/recompensa de miembros. */
  parcial: boolean;
};

/**
 * Guarda la configuración.
 * Si la migración aún no está aplicada, guarda lo que existe y avisa con
 * `parcial` para que la interfaz no haga creer que se guardaron las metas por tipo.
 */
export async function guardarConfigTarjeta(
  sb: SupabaseClient,
  valores: ConfigTarjeta
): Promise<ResultadoGuardado> {
  const comunes = {
    meta: valores.meta,
    color_acento: valores.colorAcento,
    recompensa: valores.recompensa,
  };
  const { error } = await sb
    .from("config")
    .update({
      ...comunes,
      meta_membresia: valores.metaMembresia,
      recompensa_membresia: valores.recompensaMembresia,
    })
    .eq("id", 1);
  if (!error) return { ok: true, parcial: false };

  const { error: errorViejo } = await sb.from("config").update(comunes).eq("id", 1);
  return errorViejo
    ? { ok: false, parcial: false }
    : { ok: true, parcial: true };
}

/** Cuántos sellos lleva y cuál es su meta, según el tipo de cliente. */
export function metaDeCliente(membresia: boolean, config: Pick<ConfigTarjeta, "meta" | "metaMembresia">) {
  return membresia ? config.metaMembresia : config.meta;
}

export function recompensaDeCliente(
  membresia: boolean,
  config: Pick<ConfigTarjeta, "recompensa" | "recompensaMembresia">
) {
  return membresia ? config.recompensaMembresia : config.recompensa;
}

// ============================================================================
// Tarjeta del cliente: ruta pública y mensaje de WhatsApp
// ============================================================================

/** Ruta de la tarjeta pública de un cliente (la que va en el QR y en WhatsApp). */
export function rutaTarjeta(codigo: string) {
  return `/c/${encodeURIComponent(codigo.trim())}`;
}

/** Enlace absoluto, para compartir por WhatsApp. */
export function enlaceTarjeta(codigo: string, origen: string) {
  return `${origen.replace(/\/$/, "")}${rutaTarjeta(codigo)}`;
}

/**
 * Mensaje de WhatsApp: saludo, progreso y el link de la tarjeta.
 * Va siempre en español: lo lee la clienta del salón, no la persona en la app.
 */
export function mensajeTarjeta(nombre: string, sellos: number, meta: number, url: string) {
  const lineas = [`Hola ${nombre}, te comparto tu tarjeta de cliente de AfroBroccoli 🥦`];
  if (meta > 0) lineas.push(`Llevás ${Math.min(sellos, meta)} de ${meta} sellos.`);
  lineas.push(`Tu tarjeta: ${url}`);
  return lineas.join("\n");
}

/** Link de wa.me con el mensaje ya armado. */
export function enlaceWhatsapp(telefono: string, mensaje: string) {
  return `https://wa.me/${telefono.replace(/[^\d]/g, "")}?text=${encodeURIComponent(mensaje)}`;
}