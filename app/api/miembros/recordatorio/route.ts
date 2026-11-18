import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { construirCorreoRecordatorioMembresia } from "@/lib/premios";
import { enviarCorreo, origenDe } from "@/lib/email";
import { claveDia } from "@/lib/fechas";
import { mesActualClave } from "@/lib/miembros";

// ============================================================================
// POST /api/miembros/recordatorio
//
// Envía el recordatorio de una o varias cuotas pendientes. Solo el admin puede
// llamarlo. El cuerpo solo lleva IDs: los datos de la clienta y el monto se
// leen de la base, nunca del navegador.
// ============================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAXIMO = 50;

type Cuerpo = {
  periodoIds?: unknown;
};

type ClienteJoin = {
  nombre?: string | null;
  codigo?: string | null;
  email?: string | null;
};

type FilaPeriodo = {
  id: string;
  cliente_id: string;
  periodo: string;
  vence_el: string | null;
  monto: number | string | null;
  estado: string;
  recordatorio_count: number | null;
  clientes: unknown;
};

function error(codigo: string, mensaje: string, status: number) {
  return NextResponse.json({ ok: false, codigo, mensaje }, { status });
}

function clienteDe(join: unknown): ClienteJoin | null {
  if (Array.isArray(join)) return (join[0] as ClienteJoin | undefined) ?? null;
  return (join as ClienteJoin | null) ?? null;
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
      "Solo el administrador puede enviar recordatorios de membresía.",
      403
    );
  }

  const cuerpo = (await request.json().catch(() => null)) as Cuerpo | null;
  const ids = Array.isArray(cuerpo?.periodoIds)
    ? Array.from(
        new Set(
          cuerpo.periodoIds.filter(
            (id): id is string => typeof id === "string" && id.length > 0
          )
        )
      )
    : [];

  if (ids.length === 0) {
    return error(
      "datos_invalidos",
      "Elegí al menos una cuota para enviar el recordatorio.",
      400
    );
  }

  if (ids.length > MAXIMO) {
    return error(
      "demasiados",
      `Podés enviar hasta ${MAXIMO} recordatorios a la vez.`,
      400
    );
  }

  const { data, error: errPeriodos } = await supabase
    .from("membresias_periodos")
    .select(
      "id, cliente_id, periodo, vence_el, monto, estado, recordatorio_count, clientes(nombre, codigo, email)"
    )
    .in("id", ids);

  if (errPeriodos) {
    console.error("[miembros:recordatorio]", errPeriodos.code, errPeriodos.message);
    return error(
      "consulta_fallida",
      "No se pudieron leer las cuotas. Revisá que el SQL de Miembros esté corrido.",
      500
    );
  }

  const hoy = claveDia();
  const mesActual = mesActualClave(hoy);
  const origen =
    origenDe(request, process.env.NEXT_PUBLIC_SITE_URL) ||
    "https://afrobroccoli.vercel.app";

  const filas = (data ?? []) as FilaPeriodo[];
  const porId = new Map(filas.map((fila) => [fila.id, fila]));

  let enviados = 0;
  let omitidos = 0;
  const errores: Array<{ id: string; mensaje: string }> = [];

  for (const id of ids) {
    const fila = porId.get(id);

    if (!fila) {
      omitidos += 1;
      errores.push({ id, mensaje: "La cuota ya no existe." });
      continue;
    }

    if (fila.estado !== "pendiente") {
      omitidos += 1;
      continue;
    }

    if (fila.periodo > mesActual) {
      omitidos += 1;
      errores.push({ id, mensaje: "No se envían recordatorios de meses futuros." });
      continue;
    }

    const cliente = clienteDe(fila.clientes);
    const correo = (cliente?.email ?? "").trim();
    const nombre = (cliente?.nombre ?? "").trim();
    const codigo = (cliente?.codigo ?? "").trim();

    if (!cliente || !nombre || !codigo || !CORREO_VALIDO.test(correo)) {
      omitidos += 1;
      errores.push({ id, mensaje: "La clienta no tiene un correo válido." });
      continue;
    }

    const correoArmado = construirCorreoRecordatorioMembresia({
      nombre,
      codigo,
      correo,
      periodo: fila.periodo,
      monto: Number(fila.monto) || 0,
      venceEl: fila.vence_el,
      origen,
    });

    const resultado = await enviarCorreo(correoArmado, { nombre, correo });

    if (!resultado.ok) {
      errores.push({ id, mensaje: resultado.mensaje });
      continue;
    }

    const { error: errGuardar } = await supabase
      .from("membresias_periodos")
      .update({
        recordatorio_at: new Date().toISOString(),
        recordatorio_count: (fila.recordatorio_count ?? 0) + 1,
      })
      .eq("id", id);

    if (errGuardar) {
      console.error(
        "[miembros:recordatorio:guardar]",
        id,
        errGuardar.code,
        errGuardar.message
      );
      errores.push({
        id,
        mensaje: `Correo enviado, pero no se pudo guardar el registro: ${errGuardar.message}`,
      });
    }

    enviados += 1;
  }

  return NextResponse.json({
    ok: true,
    enviados,
    omitidos,
    errores,
  });
}
