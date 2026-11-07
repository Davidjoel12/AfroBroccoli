import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { claveDia } from "@/lib/fechas";
import { construirCorreoCumpleanos } from "@/lib/premios";
import { enviarCorreo, origenDe } from "@/lib/email";

// ============================================================================
// GET /api/cron/cumpleanos
//
// Lo llama Vercel Cron una vez por día (ver vercel.json). Busca los clientes
// que cumplen años hoy en la zona de Panamá, les manda la felicitación y
// guarda el año en `clientes.cumpleanos_correo_anio` para no repetir el envío.
//
// Variables necesarias en Vercel:
//   CRON_SECRET                 (Vercel la manda como Bearer)
//   SUPABASE_SERVICE_ROLE_KEY   (para leer/escribir sin RLS)
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ClienteCumple = {
  id: string;
  codigo: string | null;
  nombre: string;
  email: string | null;
  cumpleanos: string | null;
  cumpleanos_correo_anio: number | null;
};

function respuesta(
  status: number,
  cuerpo: Record<string, unknown>
) {
  return NextResponse.json(cuerpo, { status });
}

export async function GET(request: Request) {
  const secreto = process.env.CRON_SECRET?.trim();

  if (!secreto) {
    return respuesta(503, {
      ok: false,
      codigo: "sin_configurar",
      mensaje: "Falta CRON_SECRET en el servidor.",
    });
  }

  if (request.headers.get("authorization") !== `Bearer ${secreto}`) {
    return respuesta(401, {
      ok: false,
      codigo: "no_autorizado",
      mensaje: "El cron no está autorizado.",
    });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    return respuesta(503, {
      ok: false,
      codigo: "sin_configurar",
      mensaje:
        "Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el servidor.",
    });
  }

  const supabase = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("clientes")
    .select(
      "id, codigo, nombre, email, cumpleanos, cumpleanos_correo_anio"
    )
    .not("cumpleanos", "is", null)
    .not("email", "is", null)
    .order("nombre");

  if (error) {
    console.error("[cumpleanos:cron]", error.code, error.message);
    const faltaColumna = error.code === "42703";
    return respuesta(500, {
      ok: false,
      codigo: faltaColumna ? "falta_columna" : "consulta_fallida",
      mensaje: faltaColumna
        ? "Falta la columna clientes.cumpleanos_correo_anio. Corré el SQL de HANDOFF.md."
        : `No se pudieron leer los cumpleaños: ${error.message}`,
    });
  }

  const hoy = claveDia();
  const anio = Number(hoy.slice(0, 4));
  const mesDia = hoy.slice(5);
  const origen = origenDe(request, process.env.NEXT_PUBLIC_SITE_URL) ||
    "https://afrobroccoli.vercel.app";

  const clientes = (data ?? []) as ClienteCumple[];
  const errores: Array<{ codigo: string | null; mensaje: string }> = [];
  let enviados = 0;
  let omitidos = 0;

  for (const cliente of clientes) {
    if (!cliente.cumpleanos || cliente.cumpleanos.slice(5) !== mesDia) {
      continue;
    }

    if (cliente.cumpleanos_correo_anio === anio) {
      omitidos += 1;
      continue;
    }

    const correo = (cliente.email ?? "").trim();

    if (!cliente.codigo || !CORREO_VALIDO.test(correo)) {
      omitidos += 1;
      continue;
    }

    const correoArmado = construirCorreoCumpleanos({
      nombre: cliente.nombre,
      codigo: cliente.codigo,
      correo,
      origen,
    });

    const resultado = await enviarCorreo(correoArmado, {
      nombre: cliente.nombre,
      correo,
    });

    if (!resultado.ok) {
      errores.push({ codigo: cliente.codigo, mensaje: resultado.mensaje });
      continue;
    }

    const { error: errGuardar } = await supabase
      .from("clientes")
      .update({ cumpleanos_correo_anio: anio })
      .eq("id", cliente.id);

    if (errGuardar) {
      console.error(
        "[cumpleanos:guardar]",
        cliente.codigo,
        errGuardar.code,
        errGuardar.message
      );
      errores.push({
        codigo: cliente.codigo,
        mensaje: `Correo enviado, pero no se pudo guardar el año: ${errGuardar.message}`,
      });
      continue;
    }

    enviados += 1;
  }

  return respuesta(200, {
    ok: true,
    fecha: hoy,
    enviados,
    omitidos,
    errores,
  });
}
