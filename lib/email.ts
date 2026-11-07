// ============================================================================
// Envío de correos del servidor
//
// Un solo lugar para elegir proveedor:
//   1. Gmail SMTP -> GMAIL_USER + GMAIL_APP_PASSWORD
//   2. Brevo      -> BREVO_API_KEY + EMAIL_FROM
//   3. Resend     -> RESEND_API_KEY + EMAIL_FROM
//
// Lo usan /api/premio, /api/aviso y el cron de cumpleaños. Las plantillas no
// viven acá: este archivo solo transporta un correo ya armado.
// ============================================================================

import nodemailer from "nodemailer";
import { parsearRemitente } from "./premios";

export type CorreoArmado = {
  asunto: string;
  html: string;
  texto: string;
};

export type Destinatario = {
  nombre: string;
  correo: string;
};

export type ResultadoEnvio =
  | {
      ok: true;
      proveedor: "gmail" | "brevo" | "resend";
      id: string | null;
    }
  | {
      ok: false;
      codigo: string;
      mensaje: string;
      status: number;
      detalle?: string;
    };

/** Origen absoluto del sitio a partir de los headers del request. */
export function origenDe(request: Request, respaldo?: string) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (!host) return respaldo?.replace(/\/$/, "") ?? "";
  const proto =
    request.headers.get("x-forwarded-proto") ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function enviarCorreo(
  correo: CorreoArmado,
  destinatario: Destinatario
): Promise<ResultadoEnvio> {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailPass = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
  const brevoKey = process.env.BREVO_API_KEY?.trim();
  const resendKey = process.env.RESEND_API_KEY?.trim();
  const remitenteCrudo = process.env.EMAIL_FROM?.trim();

  if (!gmailUser && !brevoKey && !resendKey) {
    return {
      ok: false,
      codigo: "sin_configurar",
      mensaje: "Falta configurar GMAIL_USER y GMAIL_APP_PASSWORD en el servidor.",
      status: 503,
    };
  }

  if (gmailUser && !gmailPass) {
    return {
      ok: false,
      codigo: "sin_configurar",
      mensaje: "Falta GMAIL_APP_PASSWORD para enviar con la cuenta de Gmail.",
      status: 503,
    };
  }

  if (brevoKey && !remitenteCrudo) {
    return {
      ok: false,
      codigo: "sin_remitente",
      mensaje: "Falta EMAIL_FROM: en Brevo el correo remitente debe estar verificado.",
      status: 503,
    };
  }

  try {
    if (gmailUser && gmailPass) {
      return await enviarConGmail(gmailUser, gmailPass, remitenteCrudo, correo, destinatario);
    }
    if (brevoKey) {
      return await enviarConBrevo(brevoKey, remitenteCrudo!, correo, destinatario);
    }
    return await enviarConResend(resendKey!, remitenteCrudo, correo, destinatario);
  } catch (err) {
    console.error("[correo:red]", err);
    return {
      ok: false,
      codigo: "envio_fallido",
      mensaje: "No se pudo conectar con el servicio de correos.",
      status: 502,
      detalle: detalleError(err),
    };
  }
}

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
  destinatario: Destinatario
): Promise<ResultadoEnvio> {
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
      to: { name: destinatario.nombre, address: destinatario.correo },
      subject: correo.asunto,
      html: correo.html,
      text: correo.texto,
    });
    return { ok: true, proveedor: "gmail", id: info.messageId ?? null };
  } catch (err) {
    const detalle = detalleError(err);
    console.error("[correo:gmail]", detalle);
    return {
      ok: false,
      codigo: "envio_fallido",
      mensaje: "Gmail rechazó el envío del correo.",
      status: 502,
      detalle,
    };
  }
}

async function enviarConBrevo(
  apiKey: string,
  remitenteCrudo: string,
  correo: CorreoArmado,
  destinatario: Destinatario
): Promise<ResultadoEnvio> {
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
      to: [{ email: destinatario.correo, name: destinatario.nombre }],
      subject: correo.asunto,
      htmlContent: correo.html,
      textContent: correo.texto,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    console.error("[correo:brevo]", respuesta.status, detalle);
    return {
      ok: false,
      codigo: "envio_fallido",
      mensaje: "Brevo rechazó el envío del correo.",
      status: 502,
      detalle: detalle.slice(0, 400),
    };
  }

  const data = (await respuesta.json().catch(() => null)) as
    | { messageId?: string }
    | null;
  return { ok: true, proveedor: "brevo", id: data?.messageId ?? null };
}

async function enviarConResend(
  apiKey: string,
  remitenteCrudo: string | undefined,
  correo: CorreoArmado,
  destinatario: Destinatario
): Promise<ResultadoEnvio> {
  const remitente = remitenteCrudo || "AfroBroccoli <onboarding@resend.dev>";

  const respuesta = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: remitente,
      to: [destinatario.correo],
      subject: correo.asunto,
      html: correo.html,
      text: correo.texto,
    }),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text().catch(() => "");
    console.error("[correo:resend]", respuesta.status, detalle);
    return {
      ok: false,
      codigo: "envio_fallido",
      mensaje: "Resend rechazó el envío del correo.",
      status: 502,
      detalle: detalle.slice(0, 400),
    };
  }

  const data = (await respuesta.json().catch(() => null)) as { id?: string } | null;
  return { ok: true, proveedor: "resend", id: data?.id ?? null };
}

function detalleError(err: unknown) {
  return (err instanceof Error ? err.message : String(err)).slice(0, 400);
}
