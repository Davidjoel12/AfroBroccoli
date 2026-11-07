import { NextResponse } from "next/server";
import { construirCorreoPremio } from "@/lib/premios";
import { enviarCorreo, origenDe } from "@/lib/email";

// ============================================================================
// POST /api/premio
//
// Envía el comprobante de un premio ganado. Desde 2026-11-06 el escáner ya no
// lo dispara automáticamente: el aviso sale al llegar a la meta - 1 y la
// recompensa pendiente queda en la campana. La ruta se conserva para poder
// reenviar un comprobante más adelante.
//
// El proveedor se elige en lib/email.ts:
//   Gmail SMTP -> GMAIL_USER + GMAIL_APP_PASSWORD
//   Brevo      -> BREVO_API_KEY + EMAIL_FROM
//   Resend     -> RESEND_API_KEY + EMAIL_FROM
// ============================================================================

export const runtime = "nodejs";

type Cuerpo = {
  folio?: string;
  nombre?: string;
  codigo?: string;
  correo?: string;
  recompensa?: string;
  meta?: number;
  origen?: string;
};

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function error(
  codigo: string,
  mensaje: string,
  status: number,
  detalle?: string
) {
  return NextResponse.json({ ok: false, codigo, mensaje, detalle }, { status });
}

export async function POST(request: Request) {
  const cuerpo = (await request.json().catch(() => null)) as Cuerpo | null;

  if (!cuerpo) {
    return error("datos_invalidos", "No se recibieron los datos del premio.", 400);
  }

  const { folio, nombre, codigo, correo, recompensa, meta } = cuerpo;

  if (!folio || !nombre || !codigo || !correo || !recompensa || !meta) {
    return error("datos_invalidos", "Faltan datos obligatorios del premio.", 400);
  }

  if (!CORREO_VALIDO.test(correo)) {
    return error("correo_invalido", "El correo del cliente no es válido.", 400);
  }

  const origen = origenDe(request, cuerpo.origen);
  const correoArmado = construirCorreoPremio({
    folio,
    nombre,
    codigo,
    correo,
    recompensa,
    meta: Number(meta),
    origen,
  });

  const resultado = await enviarCorreo(correoArmado, { nombre, correo });

  if (!resultado.ok) {
    return error(resultado.codigo, resultado.mensaje, resultado.status, resultado.detalle);
  }

  return NextResponse.json({
    ok: true,
    folio,
    proveedor: resultado.proveedor,
    id: resultado.id,
  });
}
