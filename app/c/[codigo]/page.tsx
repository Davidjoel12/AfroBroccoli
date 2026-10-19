import { cache } from "react";
import type { Metadata } from "next";
import { TarjetaPublica, type TarjetaPublica as DatosTarjeta } from "@/components/card/tarjeta-publica";
import { createClient } from "@/lib/supabase-server";
import {
  COLOR_ACENTO_POR_DEFECTO,
  META_POR_DEFECTO,
  RECOMPENSA_POR_DEFECTO,
} from "@/lib/config";

// ============================================================================
// Tarjeta pública del cliente: /c/AB-0042
// La abre la clienta desde el link de WhatsApp, sin cuenta y sin login.
// Los datos llegan por la función `tarjeta_cliente(codigo)` (ver migración),
// que es SECURITY DEFINER porque la anon key no puede leer `clientes` (RLS).
//
// Esta página es Server Component: solo trae datos. Lo que se ve (y se
// traduce) vive en <TarjetaPublica>, que es Client Component.
// ============================================================================

type Tarjeta = DatosTarjeta;

// cache() de React: el metadata y la página comparten una sola consulta.
const leerTarjeta = cache(async (codigo: string): Promise<Tarjeta | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tarjeta_cliente", { p_codigo: codigo });

  if (error) {
    // 42883/PGRST202: la función todavía no está creada en Supabase.
    console.error("[tarjeta_cliente]", error.code, error.message);
    return null;
  }
  const fila = (data as Record<string, unknown>[] | null)?.[0];
  if (!fila) return null;

  const meta = Number(fila.meta);
  return {
    nombre: String(fila.nombre ?? ""),
    codigo: String(fila.codigo ?? codigo),
    membresia: Boolean(fila.membresia),
    sellos: Number(fila.sellos ?? 0) || 0,
    meta: Number.isFinite(meta) && meta > 0 ? meta : META_POR_DEFECTO,
    recompensa: String(fila.recompensa ?? RECOMPENSA_POR_DEFECTO),
    colorAcento: String(fila.color_acento ?? COLOR_ACENTO_POR_DEFECTO),
    logoUrl: (fila.logo_url as string | null) ?? null,
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const tarjeta = await leerTarjeta(codigo);
  return {
    title: tarjeta ? `Mi tarjeta · ${tarjeta.nombre}` : "Mi tarjeta · AfroBroccoli",
    // El link se comparte por WhatsApp: nunca se indexa ni se cachea.
    robots: { index: false, follow: false },
  };
}

export default async function TarjetaPage({ params }: { params: Promise<{ codigo: string }> }) {
  const { codigo } = await params;
  const tarjeta = await leerTarjeta(codigo);

  return <TarjetaPublica tarjeta={tarjeta} />;
}