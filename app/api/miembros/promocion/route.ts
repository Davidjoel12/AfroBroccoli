import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import {
  construirCorreoCampana,
  MAX_DESTINATARIOS,
  type ErrorCampana,
} from "@/lib/campanas";
import { correoConfigurado, enviarCorreo, origenDe } from "@/lib/email";

// ============================================================================
// POST /api/miembros/promocion
//
// Envía una campaña de promoción a los miembros o manda una prueba al correo
// del admin. Solo el admin puede llamarlo. El cuerpo lleva el contenido; los
// destinatarios se leen de la base, nunca del navegador.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOTE = 4;

type Cuerpo = {
  asunto?: unknown;
  titulo?: unknown;
  mensaje?: unknown;
  vigenteHasta?: unknown;
  prueba?: unknown;
};

type ClienteFila = {
  id: string;
  nombre: string;
  codigo: string | null;
  email: string | null;
  promociones_opt_out: boolean | null;
};

type Destinatario = {
  nombre: string;
  codigo: string;
  correo: string;
};

function error(codigo: string, mensaje: string, status: number) {
  return NextResponse.json({ ok: false, codigo, mensaje }, { status });
}

function texto(valor: unknown) {
  return typeof valor === "string" ? valor.trim() : "";
}

/** Valida una fecha civil `YYYY-MM-DD`. Devuelve null si no es válida. */
function fechaValida(valor: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return null;
  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  if (
    fecha.getUTCFullYear() !== anio ||
    fecha.getUTCMonth() !== mes - 1 ||
    fecha.getUTCDate() !== dia
  ) {
    return null;
  }
  return valor;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return error("no_autorizado", "Tenés que iniciar sesión.", 401);
  }

  const { data: perfil } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (perfil?.role !== "admin") {
    return error(
      "sin_permiso",
      "Solo el administrador puede enviar promociones.",
      403
    );
  }

  const cuerpo = (await request.json().catch(() => null)) as Cuerpo | null;
  const asunto = texto(cuerpo?.asunto).replace(/\s+/g, " ");
  const titulo = texto(cuerpo?.titulo).replace(/\s+/g, " ");
  const mensaje = texto(cuerpo?.mensaje);
  const vigenciaCruda = texto(cuerpo?.vigenteHasta);
  const prueba = cuerpo?.prueba === true;

  if (asunto.length < 3 || asunto.length > 140) {
    return error(
      "asunto_invalido",
      "El asunto debe tener entre 3 y 140 caracteres.",
      400
    );
  }

  if (titulo.length < 3 || titulo.length > 120) {
    return error(
      "titulo_invalido",
      "El título debe tener entre 3 y 120 caracteres.",
      400
    );
  }

  if (mensaje.length < 10 || mensaje.length > 4000) {
    return error(
      "mensaje_invalido",
      "El mensaje debe tener entre 10 y 4000 caracteres.",
      400
    );
  }

  const vigenteHasta = vigenciaCruda ? fechaValida(vigenciaCruda) : null;
  if (vigenciaCruda && !vigenteHasta) {
    return error(
      "vigencia_invalida",
      "La fecha de vigencia no es válida.",
      400
    );
  }

  const origen =
    origenDe(request, process.env.NEXT_PUBLIC_SITE_URL) ||
    "https://afrobroccoli.vercel.app";

  if (prueba) {
    const correoPrueba = (user.email ?? "").trim();
    if (!CORREO_VALIDO.test(correoPrueba)) {
      return error(
        "sin_correo",
        "Tu usuario no tiene un correo válido para la prueba.",
        400
      );
    }

    // Usamos el primer miembro como muestra para que la prueba se vea igual
    // que el correo real. Si no hay miembros, va un nombre genérico.
    const { data: muestra } = await supabase
      .from("clientes")
      .select("nombre, codigo")
      .eq("membresia", true)
      .order("nombre")
      .limit(1)
      .maybeSingle();

    const nombreMuestra = String(
      muestra?.nombre ?? "Cliente de prueba"
    ).trim();
    const codigoMuestra = String(muestra?.codigo ?? "AB-0000").trim();

    const correoArmado = construirCorreoCampana({
      nombre: nombreMuestra,
      codigo: codigoMuestra,
      asunto,
      titulo,
      mensaje,
      vigenteHasta,
      origen,
      prueba: true,
    });

    const resultado = await enviarCorreo(correoArmado, {
      nombre: nombreMuestra,
      correo: correoPrueba,
    });

    if (!resultado.ok) {
      return error(resultado.codigo, resultado.mensaje, resultado.status);
    }

    return NextResponse.json({
      ok: true,
      prueba: true,
      enviados: 1,
      omitidos: 0,
      sinCorreo: 0,
      optOut: 0,
      errores: [],
    });
  }

  const configurado = correoConfigurado();
  if (!configurado.ok) {
    return error("sin_configurar", configurado.mensaje, 503);
  }

  const { data, error: errClientes } = await supabase
    .from("clientes")
    .select("id, nombre, codigo, email, promociones_opt_out")
    .eq("membresia", true)
    .order("nombre");

  if (errClientes) {
    console.error(
      "[promociones:clientes]",
      errClientes.code,
      errClientes.message
    );
    return error(
      "consulta_fallida",
      "No se pudieron leer los miembros. Revisá que el SQL de Promociones esté corrido.",
      500
    );
  }

  const miembros = (data ?? []) as ClienteFila[];

  const sinCorreo = miembros.filter((miembro) => {
    const correo = (miembro.email ?? "").trim();
    const codigo = (miembro.codigo ?? "").trim();
    return !CORREO_VALIDO.test(correo) || !codigo;
  }).length;

  const optOut = miembros.filter((miembro) =>
    Boolean(miembro.promociones_opt_out)
  ).length;

  const destinatarios: Destinatario[] = miembros
    .filter((miembro) => {
      const correo = (miembro.email ?? "").trim();
      const codigo = (miembro.codigo ?? "").trim();
      return (
        !miembro.promociones_opt_out &&
        CORREO_VALIDO.test(correo) &&
        Boolean(codigo)
      );
    })
    .map((miembro) => ({
      nombre: (miembro.nombre ?? "").trim(),
      codigo: (miembro.codigo ?? "").trim(),
      correo: (miembro.email ?? "").trim(),
    }))
    .filter((miembro) => Boolean(miembro.nombre));

  if (destinatarios.length === 0) {
    return error(
      "sin_destinatarios",
      "No hay miembros con correo válido para enviar.",
      400
    );
  }

  if (destinatarios.length > MAX_DESTINATARIOS) {
    return error(
      "demasiados",
      `Por ahora se pueden enviar hasta ${MAX_DESTINATARIOS} correos por campaña.`,
      400
    );
  }

  let enviados = 0;
  const errores: ErrorCampana[] = [];

  for (let i = 0; i < destinatarios.length; i += LOTE) {
    const lote = destinatarios.slice(i, i + LOTE);

    const resultados = await Promise.all(
      lote.map(async (destinatario) => {
        const correoArmado = construirCorreoCampana({
          nombre: destinatario.nombre,
          codigo: destinatario.codigo,
          asunto,
          titulo,
          mensaje,
          vigenteHasta,
          origen,
        });

        const resultado = await enviarCorreo(correoArmado, {
          nombre: destinatario.nombre,
          correo: destinatario.correo,
        });

        return { destinatario, resultado };
      })
    );

    for (const { destinatario, resultado } of resultados) {
      if (resultado.ok) {
        enviados += 1;
        continue;
      }

      errores.push({
        nombre: destinatario.nombre,
        correo: destinatario.correo,
        mensaje: resultado.mensaje,
      });
    }
  }

  const omitidos = miembros.length - destinatarios.length;

  const { data: campana, error: errCampana } = await supabase
    .from("campanas")
    .insert({
      asunto,
      titulo,
      mensaje,
      vigente_hasta: vigenteHasta,
      enviados,
      omitidos,
      errores,
    })
    .select("id")
    .single();

  if (errCampana) {
    console.error("[promociones:campana]", errCampana.code, errCampana.message);
    return NextResponse.json({
      ok: true,
      enviados,
      omitidos,
      sinCorreo,
      optOut,
      errores,
      aviso:
        "Los correos se enviaron, pero no se pudo guardar el historial. Revisá que la tabla campanas exista.",
    });
  }

  return NextResponse.json({
    ok: true,
    enviados,
    omitidos,
    sinCorreo,
    optOut,
    errores,
    campanaId: campana?.id ?? null,
  });
}
