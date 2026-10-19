// Reproduce el fallo del escáner sin necesidad de cámara.
// Se corre con: node tools/probar-stop-qr.mjs

// Mínimo DOM: el constructor solo hace document.getElementById(elementId)
// y `stop()` lanza ANTES de tocar el DOM cuando el lector no está activo.
globalThis.document = {
  getElementById: () => ({ id: "qr-reader" }),
  createElement: () => ({ style: {}, classList: { add() {}, remove() {} } }),
};
globalThis.window = globalThis;
// navigator es solo lectura en Node: se redefine por propiedad.
Object.defineProperty(globalThis, "navigator", {
  value: { mediaDevices: { getUserMedia: async () => ({ getTracks: () => [] }) } },
  configurable: true,
});

const { Html5Qrcode } = await import("html5-qrcode");

// El constructor no toca el DOM: solo guarda el id del elemento.
// Por eso `stop()` se puede probar acá aunque no haya cámara ni <div>.
const html5 = new Html5Qrcode("qr-reader");

console.log("1) Estado inicial:", html5.getState(), "(NOT_STARTED = 1, SCANNING = 2, PAUSED = 3)");

// --- Cómo estaba escrito antes: html5.stop().catch(() => {})
let threwSync = false;
try {
  html5.stop().catch(() => {});
  console.log("2) stop().catch(...) → no lanzó, pero el .catch NO hace falta");
} catch (e) {
  threwSync = true;
  console.log('2) stop().catch(...) → LANZÓ DE FORMA SÍNCRONA: "' + e + '"');
  console.log("   El `.catch()` nunca llega a adjuntarse: la excepción escapa antes.");
}

// --- Cómo quedó ahora: try/catch + tomar la referencia antes de parar
function detenerSeguro(instancia) {
  if (!instancia) return "sin instancia";
  try {
    const r = instancia.stop();
    if (r && typeof r.then === "function") r.then(undefined, () => {});
    return "ok (stop devolvió una promesa)";
  } catch {
    return "ok (ya estaba detenido, excepción absorbida)";
  }
}

const resultado = detenerSeguro(html5);
console.log("3) detenerSeguro(...) →", resultado);

// La parte clave: el patrón antiguo NO es seguro aunque el tipo diga Promise.
if (threwSync) {
  console.log("\nConclusión: el tipo declara stop(): Promise<void>, pero el throw es sincrónico.");
  console.log("Por eso el error se escapaba al overlay de Next.js en vez de caer en el .catch().");
}