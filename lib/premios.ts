// ============================================================================
// Premios: folio y correo de felicitación.
//
// Cuando un cliente completa su meta de sellos, el contador se reinicia a 0 y
// se le envía un correo con el detalle del premio. Ese correo lleva un folio
// único y sirve como evidencia para reclamarlo en el salón.
//
// Este archivo no importa nada del servidor: lo usan la ruta /api/premio y el
// escáner (para mostrar el folio y el estado del envío).
// ============================================================================

import { claveDia, ZONA_HORARIA } from "./fechas";

export type DatosPremio = {
  folio: string;
  nombre: string;
  codigo: string;
  correo: string;
  recompensa: string;
  meta: number;
  membresia: boolean;
  /** Origen absoluto del sitio (https://afrobroccoli.vercel.app). */
  origen: string;
  fecha?: Date;
};

/**
 * Folio legible para el salón: AB-1001-20261022-7F3K
 * Se genera una sola vez, antes de enviar, para que un reintento use el mismo.
 */
export function nuevoFolio(codigo: string, fecha = new Date()) {
  const dia = claveDia(fecha).replace(/-/g, "");
  const azar = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${codigo}-${dia}-${azar}`;
}

/**
 * Separa "AfroBroccoli <correo@dominio.com>" en nombre y correo.
 * Si solo viene el correo, el nombre por defecto es el del salón.
 */
export function parsearRemitente(valor: string) {
  const texto = valor.trim();
  const conNombre = texto.match(/^\s*(.*?)\s*<([^>]+)>\s*$/);
  if (conNombre) {
    return {
      nombre: conNombre[1] || "AfroBroccoli",
      correo: conNombre[2].trim(),
    };
  }
  return { nombre: "AfroBroccoli", correo: texto };
}

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fechaLarga(fecha: Date) {
  return fecha.toLocaleDateString("es-PA", {
    timeZone: ZONA_HORARIA,
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function construirCorreoPremio(datos: DatosPremio) {
  const fecha = datos.fecha ?? new Date();
  const urlTarjeta = `${datos.origen.replace(/\/$/, "")}/c/${encodeURIComponent(datos.codigo)}`;
  const nombre = escaparHtml(datos.nombre);
  const recompensa = escaparHtml(datos.recompensa);
  const folio = escaparHtml(datos.folio);
  const dia = fechaLarga(fecha);

  const asunto = `¡Felicitaciones, ${datos.nombre}! Tu premio en AfroBroccoli te espera`;

  const texto = [
    `¡Felicitaciones, ${datos.nombre}!`,
    "",
    `Completaste tus ${datos.meta} sellos y ganaste: ${datos.recompensa}.`,
    "",
    "Mostrá este correo en el salón para reclamar tu premio.",
    "",
    `Folio: ${datos.folio}`,
    `Cliente: ${datos.nombre}`,
    `Código: ${datos.codigo}`,
    `Fecha: ${dia}`,
    "",
    `Tu contador de sellos volvió a 0, así que ya podés empezar a juntar para el próximo premio.`,
    "",
    `Tu tarjeta: ${urlTarjeta}`,
    "",
    "AfroBroccoli",
  ].join("\n");

  const html = `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#FFF8EE;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EE;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(34,27,25,0.12);">
            <tr>
              <td style="background:#221B19;padding:28px 24px;text-align:center;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#FFF8EE;">AfroBroccoli</p>
                <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#FF66C4;letter-spacing:1px;text-transform:uppercase;">Premio ganado</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;text-align:center;">
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#221B19;">¡Felicitaciones, ${nombre}!</h1>
                <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#6B5F5A;">
                  Completaste tus ${datos.meta} sellos. Ya podés reclamar tu premio.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#6FC22D1A;border:1px solid #6FC22D66;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;text-align:center;">
                      <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#4E8C1F;">Tu premio</p>
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#221B19;">${recompensa}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px dashed rgba(34,27,25,0.25);border-radius:12px;">
                  <tr>
                    <td style="padding:16px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#6B5F5A;line-height:1.8;">
                      <strong style="color:#221B19;">Folio:</strong> ${folio}<br />
                      <strong style="color:#221B19;">Cliente:</strong> ${nombre}<br />
                      <strong style="color:#221B19;">Código:</strong> ${escaparHtml(datos.codigo)}<br />
                      <strong style="color:#221B19;">Fecha:</strong> ${escaparHtml(dia)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;text-align:center;">
                <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#6B5F5A;">
                  <strong style="color:#221B19;">Mostrá este correo en el salón para reclamar tu premio.</strong><br />
                  Es tu comprobante: traelo abierto o impreso.
                </p>
                <a href="${escaparHtml(urlTarjeta)}" style="display:inline-block;background:#FF66C4;color:#221B19;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">
                  Ver mi tarjeta
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;background:#FFF8EE;border-top:1px solid rgba(34,27,25,0.1);text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6B5F5A;">
                  Tu contador de sellos volvió a 0: ya podés empezar a juntar para el próximo premio.
                </p>
                <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B5F5A;">
                  AfroBroccoli
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { asunto, html, texto };
}
