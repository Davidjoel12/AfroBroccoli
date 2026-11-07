import type { SupabaseClient } from "@supabase/supabase-js";

// ============================================================================
// Configuración de la tarjeta de sellos.
//
// Una sola tarjeta para todos: los clientes miembros también acumulan sellos
// con la misma meta y recompensa. La membresía es una suscripción mensual
// aparte (beneficios/servicios), no un segundo programa de sellos.
// ============================================================================

export const META_POR_DEFECTO = 5;
export const RECOMPENSA_POR_DEFECTO = "1 servicio gratis";
export const COLOR_ACENTO_POR_DEFECTO = "#FF66C4";

/** Opciones de la meta de sellos. */
export const METAS = ["4", "5", "8", "10"];

export type ConfigTarjeta = {
  meta: number;
  recompensa: string;
  colorAcento: string;
  logoUrl: string | null;
};

export function configPorDefecto(): ConfigTarjeta {
  return {
    meta: META_POR_DEFECTO,
    recompensa: RECOMPENSA_POR_DEFECTO,
    colorAcento: COLOR_ACENTO_POR_DEFECTO,
    logoUrl: null,
  };
}

type FilaConfig = {
  meta?: number | null;
  recompensa?: string | null;
  color_acento?: string | null;
  logo_url?: string | null;
};

const COLUMNAS = "meta, recompensa, color_acento, logo_url";

/** Rellena huecos y normaliza tipos. */
function normalizar(fila: FilaConfig | null | undefined): ConfigTarjeta {
  const base = configPorDefecto();
  if (!fila) return base;
  const meta = Number(fila.meta);
  return {
    meta: Number.isFinite(meta) && meta > 0 ? meta : base.meta,
    recompensa: fila.recompensa?.trim() || base.recompensa,
    colorAcento: fila.color_acento || base.colorAcento,
    logoUrl: fila.logo_url || null,
  };
}

/** Lee la configuración de la tarjeta. */
export async function leerConfigTarjeta(sb: SupabaseClient): Promise<ConfigTarjeta> {
  const { data, error } = await sb.from("config").select(COLUMNAS).eq("id", 1).maybeSingle();
  if (error) return configPorDefecto();
  return normalizar(data as FilaConfig | null);
}

/** Guarda la configuración. Devuelve false si Supabase rechazó el update. */
export async function guardarConfigTarjeta(
  sb: SupabaseClient,
  valores: ConfigTarjeta
): Promise<boolean> {
  const { error } = await sb
    .from("config")
    .update({
      meta: valores.meta,
      recompensa: valores.recompensa,
      color_acento: valores.colorAcento,
    })
    .eq("id", 1);
  return !error;
}

/**
 * Cierra las tarjetas que quedaron con sellos en o por encima de la meta.
 *
 * La regla de reinicio se aplica al escanear, pero si la meta se baja después
 * de que un cliente ya tenía más sellos (o si un contador se cargó a mano),
 * esa tarjeta queda mostrando la meta sin reiniciarse. La función SQL
 * `normalizar_sellos` crea un premio pendiente por cada ciclo completado y
 * deja el contador en 0. Devuelve cuántas tarjetas regularizó.
 */
export async function normalizarSellos(
  sb: SupabaseClient
): Promise<{ ok: true; total: number } | { ok: false; error: string }> {
  const { data, error } = await sb.rpc("normalizar_sellos");
  if (error) return { ok: false, error: error.message };
  const total = typeof data === "number" ? data : Number(data) || 0;
  return { ok: true, total };
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

export function generarPassWallet(
  codigo: string,
  nombre: string,
  sellos: number,
  meta: number,
  recompensa: string,
  membresia: boolean,
  colorAcento: string
) {
  return { codigo, nombre, sellos, meta, recompensa, membresia, colorAcento };
}

export function passADataURL(pass: ReturnType<typeof generarPassWallet>) {
  return `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(pass))}`;
}
