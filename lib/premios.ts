// ============================================================================
// Premios y correos transaccionales.
//
// `nuevoFolio` genera el comprobante del premio. Las plantillas de abajo arman
// el HTML + texto de:
//   - el aviso cuando al cliente le falta 1 sello,
//   - la felicitación de cumpleaños.
//
// Este archivo no importa nada del servidor: lo usan las rutas /api/aviso y
// /api/premio, el cron de cumpleaños y el escáner.
// ============================================================================

import { claveDia, ZONA_HORARIA } from "./fechas";

export type DatosPremio = {
  folio: string;
  nombre: string;
  codigo: string;
  correo: string;
  recompensa: string;
  meta: number;
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

export type DatosAviso = {
  nombre: string;
  codigo: string;
  correo: string;
  recompensa: string;
  meta: number;
  sellos: number;
  /** Origen absoluto del sitio (https://afrobroccoli.vercel.app). */
  origen: string;
  fecha?: Date;
};

export type DatosCumpleanos = {
  nombre: string;
  codigo: string;
  correo: string;
  /** Origen absoluto del sitio (https://afrobroccoli.vercel.app). */
  origen: string;
  fecha?: Date;
};

type Plantilla = {
  etiqueta: string;
  titulo: string;
  intro: string;
  destacadoEtiqueta: string;
  destacado: string;
  detalle?: string;
  urlTarjeta: string;
  acento: string;
  pie: string;
};

function plantillaCorreo(p: Plantilla) {
  const etiqueta = escaparHtml(p.etiqueta);
  const titulo = escaparHtml(p.titulo);
  const intro = escaparHtml(p.intro);
  const destacadoEtiqueta = escaparHtml(p.destacadoEtiqueta);
  const destacado = escaparHtml(p.destacado);
  const detalle = p.detalle ? escaparHtml(p.detalle) : "";
  const urlTarjeta = escaparHtml(p.urlTarjeta);
  const pie = escaparHtml(p.pie);

  return `<!doctype html>
<html lang="es">
  <body style="margin:0;padding:0;background:#FFF8EE;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8EE;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(34,27,25,0.12);">
            <tr>
              <td style="background:#221B19;padding:28px 24px;text-align:center;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#FFF8EE;">AfroBroccoli</p>
                <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${p.acento};letter-spacing:1px;text-transform:uppercase;">${etiqueta}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;text-align:center;">
                <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#221B19;">${titulo}</h1>
                <p style="margin:12px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#6B5F5A;">
                  ${intro}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${p.acento}1A;border:1px solid ${p.acento}66;border-radius:12px;">
                  <tr>
                    <td style="padding:18px 20px;text-align:center;">
                      <p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${p.acento};">${destacadoEtiqueta}</p>
                      <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:21px;color:#221B19;">${destacado}</p>
                      ${detalle ? `<p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.5;color:#6B5F5A;">${detalle}</p>` : ""}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 24px 24px;text-align:center;">
                <a href="${urlTarjeta}" style="display:inline-block;background:${p.acento};color:#221B19;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">
                  Ver mi tarjeta
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;background:#FFF8EE;border-top:1px solid rgba(34,27,25,0.1);text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6B5F5A;">
                  ${pie}
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
}

/**
 * Correo que sale al quedar a 1 sello de la meta. No lleva folio: el premio
 * todavía no está ganado, solo se avisa que el próximo sello lo desbloquea.
 */
export function construirCorreoAviso(datos: DatosAviso) {
  const urlTarjeta = `${datos.origen.replace(/\/$/, "")}/c/${encodeURIComponent(datos.codigo)}`;
  const faltan = Math.max(datos.meta - datos.sellos, 0);
  const textoFaltan = faltan === 1 ? "1 sello" : `${faltan} sellos`;

  const asunto = `¡Te falta ${textoFaltan}, ${datos.nombre}! Tu premio en AfroBroccoli te espera`;

  const texto = [
    `¡Vas muy bien, ${datos.nombre}!`,
    "",
    `Ya tenés ${datos.sellos} de ${datos.meta} sellos en tu tarjeta.`,
    `Te falta ${textoFaltan} para ganar: ${datos.recompensa}.`,
    "",
    "Tu próximo sello es el premio. Te esperamos en AfroBroccoli.",
    "",
    `Tu tarjeta: ${urlTarjeta}`,
    "",
    "AfroBroccoli",
  ].join("\n");

  const html = plantillaCorreo({
    etiqueta: "Casi premio",
    titulo: `¡Te falta ${textoFaltan}, ${datos.nombre}!`,
    intro: `Ya tenés ${datos.sellos} de ${datos.meta} sellos. El próximo sello desbloquea tu premio.`,
    destacadoEtiqueta: "Tu premio",
    destacado: datos.recompensa,
    detalle: `Llevás ${datos.sellos}/${datos.meta} sellos. ¡Ya casi lo tenés!`,
    urlTarjeta,
    acento: "#6FC22D",
    pie: "Tu próximo sello es el premio. Te esperamos en AfroBroccoli.",
  });

  return { asunto, html, texto };
}

/** Felicitación automática del día del cumpleaños. */
export function construirCorreoCumpleanos(datos: DatosCumpleanos) {
  const urlTarjeta = `${datos.origen.replace(/\/$/, "")}/c/${encodeURIComponent(datos.codigo)}`;
  const asunto = `¡Feliz cumpleaños, ${datos.nombre}! 🎉`;

  const texto = [
    `¡Feliz cumpleaños, ${datos.nombre}!`,
    "",
    "Todo el equipo de AfroBroccoli te desea un día hermoso.",
    "Gracias por ser parte de nuestra comunidad. Te esperamos en el salón.",
    "",
    `Tu tarjeta: ${urlTarjeta}`,
    "",
    "Con cariño,",
    "Equipo AfroBroccoli",
  ].join("\n");

  const html = plantillaCorreo({
    etiqueta: "Feliz cumpleaños",
    titulo: `¡Feliz cumpleaños, ${datos.nombre}!`,
    intro: "Todo el equipo de AfroBroccoli te desea un día hermoso.",
    destacadoEtiqueta: "Un abrazo del equipo",
    destacado: "Gracias por ser parte de nuestra comunidad",
    detalle: "Te esperamos en el salón para celebrarte.",
    urlTarjeta,
    acento: "#FF66C4",
    pie: "Con cariño, equipo AfroBroccoli.",
  });

  return { asunto, html, texto };
}
