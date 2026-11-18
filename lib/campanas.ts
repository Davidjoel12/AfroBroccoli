import { fechaLarga } from "./miembros";

export { fechaLarga };

// ============================================================================
// Campañas de promoción para miembros (Fase 2)
//
// Una campaña es un correo que el admin redacta y se envía a los miembros que
// tengan correo válido y no estén dados de baja. Acá viven los tipos, el
// máximo de destinatarios por envío y la plantilla del correo.
//
// No confundir con `premios.ts`: ese archivo maneja los correos
// transaccionales (aviso de sello, cumpleaños, recordatorio de cuota).
// ============================================================================

/** Tope por envío. Gmail aguanta más, pero la lista actual es chica. */
export const MAX_DESTINATARIOS = 100;

export type ErrorCampana = {
  nombre: string;
  correo: string;
  mensaje: string;
};

export type Campana = {
  id: string;
  asunto: string;
  titulo: string;
  mensaje: string;
  vigenteHasta: string | null;
  enviadaAt: string;
  enviados: number;
  omitidos: number;
  errores: ErrorCampana[];
};

export type MiembroPromocion = {
  id: string;
  nombre: string;
  codigo: string;
  correo: string;
  optOut: boolean;
};

export type DatosCampana = {
  nombre: string;
  codigo: string;
  asunto: string;
  titulo: string;
  mensaje: string;
  vigenteHasta: string | null;
  /** Origen absoluto del sitio (https://afrobroccoli.vercel.app). */
  origen: string;
  prueba?: boolean;
};

function escaparHtml(texto: string) {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function parrafos(texto: string) {
  return escaparHtml(texto)
    .split(/\n{2,}/)
    .map(
      (parrafo) =>
        `<p style="margin:0 0 14px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#6B5F5A;">${parrafo.replace(
          /\n/g,
          "<br />"
        )}</p>`
    )
    .join("");
}

/**
 * Arma el HTML y el texto de una campaña. El saludo y el link a la tarjeta
 * son personalizados; el resto del contenido lo escribe el admin.
 */
export function construirCorreoCampana(datos: DatosCampana) {
  const nombre = escaparHtml(datos.nombre);
  const titulo = escaparHtml(datos.titulo);
  const mensajeHtml = parrafos(datos.mensaje);
  const vigenciaCruda = datos.vigenteHasta
    ? fechaLarga(datos.vigenteHasta)
    : "";
  const vigencia = vigenciaCruda === "—" ? "" : vigenciaCruda;
  const origen = datos.origen.replace(/\/$/, "");
  const urlTarjeta = `${origen}/c/${encodeURIComponent(datos.codigo)}`;
  const prueba = Boolean(datos.prueba);

  const lineas = [
    `Hola ${datos.nombre},`,
    "",
    datos.titulo,
    "",
    datos.mensaje,
    "",
    vigencia ? `Válida hasta el ${vigencia}.` : "",
    "",
    `Tu tarjeta: ${urlTarjeta}`,
    "",
    prueba
      ? "Este es un correo de prueba. No se envió a ninguna clienta."
      : "Si no querés recibir promociones, avisanos en el salón o respondé este correo.",
    "",
    "AfroBroccoli",
  ];

  const texto = lineas
    .filter((linea, indice) => !(linea === "" && lineas[indice - 1] === ""))
    .join("\n");

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
                <p style="margin:6px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#FF66C4;letter-spacing:1.4px;text-transform:uppercase;">Promoción para miembros</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#6B5F5A;">Hola <strong style="color:#221B19;">${nombre}</strong>,</p>
                <h1 style="margin:0 0 16px;font-family:Georgia,'Times New Roman',serif;font-size:24px;line-height:1.3;color:#221B19;">${titulo}</h1>
                ${mensajeHtml}
              </td>
            </tr>
            ${
              vigencia
                ? `<tr>
              <td style="padding:0 24px 20px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FF66C41A;border:1px solid #FF66C466;border-radius:12px;">
                  <tr>
                    <td style="padding:14px 18px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#221B19;">
                      <strong>Válida hasta el ${escaparHtml(vigencia)}</strong>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>`
                : ""
            }
            <tr>
              <td style="padding:0 24px 24px;text-align:center;">
                <a href="${escaparHtml(urlTarjeta)}" style="display:inline-block;background:#FF66C4;color:#221B19;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:bold;text-decoration:none;padding:12px 22px;border-radius:999px;">
                  Ver mi tarjeta
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;background:#FFF8EE;border-top:1px solid rgba(34,27,25,0.1);text-align:center;">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#6B5F5A;">
                  ${
                    prueba
                      ? "Este es un correo de prueba. No se envió a ninguna clienta."
                      : "Recibís este correo por ser miembro de AfroBroccoli. Si no querés recibir promociones, avisanos en el salón o respondé este correo."
                  }
                </p>
                <p style="margin:8px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6B5F5A;">AfroBroccoli</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { asunto: datos.asunto, html, texto };
}

/** Lee el JSONB `campanas.errores` sin confiar en su forma. */
export function erroresDe(valor: unknown): ErrorCampana[] {
  if (!Array.isArray(valor)) return [];
  return valor
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object"
    )
    .map((item) => ({
      nombre: String(item.nombre ?? ""),
      correo: String(item.correo ?? ""),
      mensaje: String(item.mensaje ?? ""),
    }))
    .filter((item) => item.mensaje);
}
