import { NextResponse } from "next/server";
import { construirCorreoAviso } from "@/lib/premios";
import { enviarCorreo, origenDe } from "@/lib/email";

// ============================================================================
// POST /api/aviso
//
// Envía el correo cuando el cliente queda a 1 sello de su meta. Reemplaza al
// correo que antes salía al completar los 5 sellos: ahora el aviso llega antes
// y el premio se entrega en el salón cuando la campana muestra la recompensa
// pendiente.
// ============================================================================

export const runtime = "nodejs";

type Cuerpo = {
  nombre?: string;
  codigo?: string;
  correo?: string;
  recompensa?: string;
  meta?: number;
  sellos?: number;
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
    return error("datos_invalidos", "No se recibieron los datos del aviso.", 400);
  }

  const { nombre, codigo, correo, recompensa, meta, sellos } = cuerpo;

  if (!nombre || !codigo || !correo || !recompensa || !meta || !sellos) {
    return error("datos_invalidos", "Faltan datos obligatorios del aviso.", 400);
  }

  if (!CORREO_VALIDO.test(correo)) {
    return error("correo_invalido", "El correo del cliente no es válido.", 400);
  }

  const metaNumero = Number(meta);
  const sellosNumero = Number(sellos);

  if (!Number.isFinite(metaNumero) || !Number.isFinite(sellosNumero)) {
    return error("datos_invalidos", "La meta o los sellos no son válidos.", 400);
  }

  if (sellosNumero !== metaNumero - 1) {
    return error(
      "fuera_de_rango",
      "El aviso solo se envía cuando falta exactamente 1 sello.",
      400
    );
  }

  const origen = origenDe(request, cuerpo.origen);
  const correoArmado = construirCorreoAviso({
    nombre,
    codigo,
    correo,
    recompensa,
    meta: metaNumero,
    sellos: sellosNumero,
    origen,
  });

  const resultado = await enviarCorreo(correoArmado, { nombre, correo });

  if (!resultado.ok) {
    return error(resultado.codigo, resultado.mensaje, resultado.status, resultado.detalle);
  }

  return NextResponse.json({
    ok: true,
    proveedor: resultado.proveedor,
    id: resultado.id,
  });
}
