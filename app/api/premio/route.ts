import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { construirCorreoPremio, parsearRemitente } from "@/lib/premios";

// ============================================================================
// POST /api/premio
//
// Envía el correo de felicitación cuando un cliente completa su meta de sellos.
//
// Proveedores (se elige solo, en este orden):
//   1. Gmail SMTP -> GMAIL_USER + GMAIL_APP_PASSWORD
//      No necesita dominio propio. El correo sale realmente desde esa cuenta,
//      así que pasa la autenticación de Google. Límite ~500/día.
//   2. Brevo      -> BREVO_API_KEY + EMAIL_FROM
//      Sin dominio, Brevo reemplaza el remitente por uno suyo y puede caer en spam.
//   3. Resend     -> RESEND_API_KEY + EMAIL_FROM
//      Requiere dominio verificado, pero queda listo para el futuro.
//
// Variables para Gmail:
//   GMAIL_USER           cuenta completa, ej: afrobroccoli@gmail.com
//   GMAIL_APP_PASSWORD   contraseña de aplicación de Google (16 caracteres, sin espacios)
//   EMAIL_FROM           opcional; solo se usa el NOMBRE visible,
//                        ej: "AfroBroccoli <afrobroccoli@gmail.com>"
//                        (la dirección siempre es GMAIL_USER)
//
// Sin ningún proveedor configurado la ruta responde 503 "sin_configurar"; el
// escáner muestra el aviso y ofrece WhatsApp como respaldo.
// ============================================================================

type Cuerpo = {
  folio?: string;
  nombre?: string;
  codigo?: string;
  correo?: string;
  recompensa?: string;
  meta?: number;
  membresia?: boolean;
  origen?: string;
};

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function origenDe(request: Request, respaldo?: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return respaldo?.replace(/\/$/, "") ?? "";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

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

  const { folio, nombre, codigo, correo, recompensa, meta, membresia } = cuerpo;

  if (!folio || !nombre || !codigo || !correo || !recompensa || !meta) {
    return error("datos_invalidos", "Faltan datos obligatorios del premio.", 400);
  }

  if (!CORREO_VALIDO.test(correo)) {
    return error("correo_invalido", "El correo del cliente no es válido.", 400);
  }

  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const remitenteCrudo = process.env.EMAIL_FROM?.trim();

  if (!gmailUser && !brevoKey && !resendKey) {
    return error(
      "sin_configurar",
      "Falta configurar GMAIL_USER y GMAIL_APP_PASSWORD en el servidor.",
      503
    );
  }

  if (gmailUser && !gmailPass) {
    return error(
      "sin_configurar",
      "Falta GMAIL_APP_PASSWORD para enviar con la cuenta de Gmail.",
      503
    );
  }

  if (brevoKey && !remitenteCrudo) {
    return error(
      "sin_remitente",
      "Falta EMAIL_FROM: en Brevo el correo remitente debe estar verificado.",
      503
    );
  }

  const origen = origenDe(request, cuerpo.origen);
  const correoArmado = construirCorreoPremio({
    folio,
    nombre,
    codigo,
    correo,
    recompensa,
    meta: Number(meta),
    membresia: Boolean(membresia),
    origen,
  });

  try {
    if (gmailUser && gmailPass) {
      return await enviarConGmail(gmailUser, gmailPass, remitenteCrudo, correoArmado, {
        nombre,
        correo,
        folio,
      });
    }
    if (brevoKey) {
      return await enviarConBrevo(brevoKey, remitenteCrudo!, correoArmado, {
        nombre,
        correo,
        folio,
      });
    }
    return await enviarConResend(resendKey!, remitenteCrudo, correoArmado, {
      folio,
      correo,
    });
  } catch (err) {
    console.error("[premio:red]", err);
    return error("envio_fallido", "No se pudo conectar con el servicio de correos.", 502);
  }
}

type CorreoArmado = ReturnType<typeof construirCorreoPremio>;

/**
 * Gmail SMTP: remitente real = GMAIL_USER (Google firma con DKIM).
 * De EMAIL_FROM solo se toma el nombre visible, para que la clienta vea
 * "AfroBroccoli" aunque la dirección sea la de Gmail.
 */
async function enviarConGmail(
  usuario: string,
  clave: string,
  remitenteCrudo: string | undefined,
  correo: CorreoArmado,
  datos: { nombre: string; correo: string; folio: string }
) {
  const nombreRemitente = remitenteCrudo
    ? parsearRemitente(remitenteCrudo).nombre
    : "AfroBroccoli";

  const transporte = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user: usuario, pass: clave },
  });

  try {
    const info = await transporte.sendMail({
      from: { name: nombreRemitente, address: usuario },
      to: { name: datos.nombre, address: datos.correo },
      subject: correo.asunto,
      html: correo.html,
      text: correo.texto,
    });
    return NextResponse.json({
      ok: true,
      folio: datos.folio,
      proveedor: "gmail",
      id: info.messageId ?? null,
    });
  } catch (err) {
    const detalle = err instanceof Error ? err.message : String(err);
    console.error("[premio:gmail]", detalle);
    return error(
      "envio_fallido",
      "Gmail rechazó el envío del correo.",
      502,
      detalle.slice(0, 400)
    );
  }
}

async function enviarConBrevo(
  apiKey: string,
  remitenteCrudo: string,
  correo: CorreoArmado,
  datos: { nombre: string; correo: string; folio: string }
) {
  const remitente = parsearRemitente(remitenteCrudo);

  const respuesta = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: { name: remitente.nombre, email: remitente.correo },
      to: [{ email: datos.correo, name: datos.nombre }],
      subject: correo.asunto,
      htmlContent: correo.html,
      textContent: correo.texto,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    console.error("[premio:brevo]", respuesta.status, detalle);
    return error(
      "envio_fallido",
      "Brevo rechazó el envío del correo.",
      502,
      detalle.slice(0, 400)
    );
  }

  const data = (await respuesta.json().catch(() => null)) as
    | { messageId?: string }
    | null;
  return NextResponse.json({
    ok: true,
    folio: datos.folio,
    proveedor: "brevo",
    id: data?.messageId ?? null,
  });
}

async function enviarConResend(
  apiKey: string,
  remitenteCrudo: string | undefined,
  correo: CorreoArmado,
  datos: { folio: string; correo: string }
) {
  const remitente = remitenteCrudo || "AfroBroccoli <onboarding@resend.dev>";

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remitente,
      to: [datos.correo],
      subject: correo.asunto,
      html: correo.html,
      text: correo.texto,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    console.error("[premio:resend]", respuesta.status, detalle);
    return error(
      "envio_fallido",
      "Resend rechazó el envío del correo.",
      502,
      detalle.slice(0, 400)
    );
  }

  const data = (await respuesta.json().catch(() => null)) as { id?: string } | null;
  return NextResponse.json({
    ok: true,
    folio: datos.folio,
    proveedor: "resend",
    id: data?.id ?? null,
  });
}
