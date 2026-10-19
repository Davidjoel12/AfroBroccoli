/**
 * Cámara trasera para el escáner de QR.
 *
 * Por qué no alcanza con `facingMode: "environment"`: en MediaTrackConstraints
 * un valor pelado es una restricción "ideal", o sea una sugerencia. Si el
 * navegador no la puede cumplir abre la que quiere, y en varios teléfonos
 * termina abriendo la frontal. Para fijarla de verdad hay dos caminos:
 *
 *   1. `{ facingMode: { exact: "environment" } }` → obliga, pero tira
 *      OverconstrainedError si el equipo no tiene cámara trasera.
 *   2. Elegir el `deviceId` de la cámara trasera → es lo más confiable, y es
 *      lo que hace esta módulo.
 *
 * Ojo: `enumerateDevices()` devuelve los nombres de las cámaras VACÍOS hasta
 * que el usuario da permiso. Por eso primero se pide un stream: con ese
 * permiso ya concedido, los nombres aparecen y se puede buscar "trasera".
 */

export type ConstraintsCamara = MediaTrackConstraints;

const SOLICITUD_BASE = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
} as const;

/** Nombres con los que los navegadores se refieren a la cámara trasera. */
const PATRON_TRASERA = /(back|rear|environment|traser|posteri|trase)/i;

/** ¿Este nombre corresponde a una cámara trasera? (labels en varios idiomas) */
export function esEtiquetaTrasera(etiqueta: string | undefined | null): boolean {
  if (!etiqueta) return false;
  return PATRON_TRASERA.test(etiqueta);
}

/** El setting `facingMode` que reporta el navegador: "environment" es la trasera. */
export function esFacingModeTrasero(facingMode: string | undefined | null): boolean {
  return facingMode === "environment";
}

function constraintsDe(deviceId: string | null): ConstraintsCamara {
  if (deviceId) {
    return { deviceId: { exact: deviceId }, ...SOLICITUD_BASE };
  }
  // Sin deviceId conocido: primero se intenta forzar la trasera y, si el
  // equipo no la tiene, se cae a "ideal" para no romper el escáner entero.
  return { facingMode: { ideal: "environment" }, ...SOLICITUD_BASE };
}

/**
 * Devuelve el deviceId de la cámara trasera, o null si no se pudo determinar.
 *
 * Pide permiso primero (es lo que revela los nombres), mira qué cámara nos
 * dieron y, si hay otra que se identifica como trasera, la prefiere.
 */
export async function detectarCamaraTrasera(): Promise<string | null> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    return null;
  }

  let streamDePrueba: MediaStream | null = null;
  try {
    // Permiso mínimo: solo queremos que el navegador revele los nombres.
    streamDePrueba = await navigator.mediaDevices.getUserMedia({ video: true });

    const pista = streamDePrueba.getVideoTracks()[0];
    const ajustes = pista?.getSettings?.() ?? {};
    const idActual = ajustes.deviceId;

    // Si el navegador ya nos dio la trasera, no hay nada que buscar.
    if (esFacingModeTrasero(ajustes.facingMode)) return idActual ?? null;

    const dispositivos = await navigator.mediaDevices.enumerateDevices();
    const trasera = dispositivos.find(
      (d) => d.kind === "videoinput" && esEtiquetaTrasera(d.label)
    );

    if (trasera?.deviceId && trasera.deviceId !== idActual) return trasera.deviceId;
    return idActual ?? null;
  } catch {
    // Sin permiso, sin cámara o navegador raro: se sigue con la ruta simple.
    return null;
  } finally {
    // Este stream era solo para descubrir la cámara: se cierra siempre.
    streamDePrueba?.getTracks().forEach((t) => t.stop());
  }
}

/**
 * Abre la cámara trasera para el escáner nativo (BarcodeDetector).
 * Si no hay cámara trasera disponible, cae a la que haya sin romper nada.
 */
export async function abrirCamaraTrasera(): Promise<MediaStream> {
  const deviceId = await detectarCamaraTrasera();
  const video = constraintsDe(deviceId);

  try {
    return await navigator.mediaDevices.getUserMedia({ video });
  } catch {
    // OverconstrainedError: el deviceId guessed no era válido. Reintentamos
    // con la restricción simple, que siempre resuelve a alguna cámara.
    return navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" }, ...SOLICITUD_BASE },
    });
  }
}

/**
 * Constraints de la cámara trasera, con la resolución que mejora la lectura.
 *
 * IMPORTANTE: en html5-qrcode la cámara NO se elige en el primer argumento de
 * `start()` sino adentro de `videoConstraints`. Si ese objeto es válido, la
 * librería ignora por completo el `deviceId`/`facingMode` del primer argumento
 * (ver `esm/html5-qrcode.js`, línea ~148):
 *
 *   var videoConstraints = areVideoConstraintsEnabled
 *       ? internalConfig.videoConstraints          // gana esto
 *       : $this.createVideoConstraints(cameraIdOrConfig);   // esto se ignora
 *
 * Por eso el deviceId va metido acá adentro. Si se pasa solo como primer
 * argumento y además hay `videoConstraints`, el navegador abre la cámara que
 * le parezca (la frontal).
 */
export async function constraintsCamaraTrasera(): Promise<ConstraintsCamara> {
  const deviceId = await detectarCamaraTrasera();
  return constraintsDe(deviceId);
}

/**
 * Config de cámara SOLO para el primer argumento de `start()`.
 * Se deja por si algún día se llama a `start()` sin `videoConstraints`
 * (en ese caso sí vale).
 */
export async function configCamaraHtml5Qrcode(): Promise<
  { deviceId: { exact: string } } | { facingMode: "environment" }
> {
  const deviceId = await detectarCamaraTrasera();
  return deviceId ? { deviceId: { exact: deviceId } } : { facingMode: "environment" };
}