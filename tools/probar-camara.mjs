// Prueba la elección de cámara trasera sin cámara real.
// Se corre con: node --experimental-strip-types tools/probar-camara.mjs
import { configCamaraHtml5Qrcode, constraintsCamaraTrasera, esEtiquetaTrasera } from "../lib/camara.ts";

// Cámaras como las reporta un celular real: la trasera con etiqueta, la frontal con otra.
const DISPOSITIVOS = [
  { kind: "videoinput", deviceId: "frontal-1", label: "FaceTime HD Camera" },
  { kind: "videoinput", deviceId: "trasera-1", label: "Back Camera" },
  { kind: "audioinput", deviceId: "mic-1", label: "Default" },
];

function instalarMocks({ streamInicialId, facingModeInicial, conPermiso = true }) {
  const abiertos = [];
  const streams = [];
  // navigator es solo lectura en Node: se redefine por propiedad.
  Object.defineProperty(globalThis, "navigator", {
    value: {
      mediaDevices: {
        enumerateDevices: async () => DISPOSITIVOS,
        getUserMedia: async (constraints) => {
          if (!conPermiso) throw Object.assign(new Error("denegado"), { name: "NotAllowedError" });
          abiertos.push(constraints);
          const stream = {
            getVideoTracks: () => [
              { getSettings: () => ({ deviceId: streamInicialId, facingMode: facingModeInicial }) },
            ],
            getTracks: () => [{ stop: () => "pista detenida" }],
          };
          streams.push(stream);
          return stream;
        },
      },
    },
    configurable: true,
  });
  return { abiertos, streams };
}

console.log("1) Etiquetas reconocidas como cámara trasera:");
for (const d of DISPOSITIVOS.filter((x) => x.kind === "videoinput")) {
  console.log(`   ${esEtiquetaTrasera(d.label) ? "✓" : "·"} "${d.label}"`);
}
console.log("");

// Caso A: el navegador ya abre la trasera → nos quedamos con ese deviceId.
instalarMocks({ streamInicialId: "trasera-1", facingModeInicial: "environment" });
let id = await (async () => {
  const c = await configCamaraHtml5Qrcode();
  return c.deviceId?.exact ?? "(facingMode " + c.facingMode + ")";
})();
console.log("2) Ya dio la trasera  → cámara elegida:", id);
console.log("");

// Caso B: abre la frontal → hay que buscar la trasera por nombre.
instalarMocks({ streamInicialId: "frontal-1", facingModeInicial: "user" });
const cfg = await configCamaraHtml5Qrcode();
console.log("3) Dio la frontal      → cámara elegida:", cfg.deviceId?.exact ?? "(facingMode " + cfg.facingMode + ")",
  cfg.deviceId?.exact === "trasera-1" ? "✓ corrigió" : "✗ NO corrigió");
console.log("");

// ── EL BUG QUE SE HABÍA COLADO ─────────────────────────────────────────────
// html5-qrcode, si le pasás `videoConstraints` válido, IGNORA por completo el
// deviceId / facingMode que le des aparte (esm/html5-qrcode.js:148-150):
//
//   var videoConstraints = areVideoConstraintsEnabled
//       ? internalConfig.videoConstraints      // gana esto
//       : $this.createVideoConstraints(cameraIdOrConfig);   // y esto se ignora
//
// O sea: la cámara se elige ADENTRO de videoConstraints, no en el primer
// argumento. Por eso "elegir bien el deviceId" no alcanzaba.
instalarMocks({ streamInicialId: "frontal-1", facingModeInicial: "user" });
const conConstraints = await constraintsCamaraTrasera();
const antes = await configCamaraHtml5Qrcode();
const dentroDeConstraints = conConstraints.deviceId?.exact;

console.log("4) Config para html5-qrcode:");
console.log("   primer argumento (cameraIdOrConfig):", JSON.stringify(antes));
console.log("   videoConstraints .....................", JSON.stringify(conConstraints));
console.log("   → el deviceId tiene que estar DENTRO de videoConstraints:",
  dentroDeConstraints === "trasera-1" ? "✓ correcto" : "✗ mal");
console.log("");

// Verificación final: ¿qué habría abierto el navegador en cada caso?
function camaraQueAbreElNavegador(videoConstraints) {
  if (videoConstraints?.deviceId) return videoConstraints.deviceId.exact;
  if (videoConstraints?.facingMode) return videoConstraints.facingMode;
  return "(sin cámara indicada → el navegador elige, y elige la frontal)";
}
console.log("5) ¿Qué cámara abriría realmente el navegador?");
console.log("   con el deviceId FUERA (el bug):", camaraQueAbreElNavegador({ width: { ideal: 1280 } }));
console.log("   con el deviceId ADENTRO (fix) :", camaraQueAbreElNavegador(conConstraints));
console.log("");

const todoOk =
  esEtiquetaTrasera("Back Camera") &&
  esEtiquetaTrasera("Cámara trasera") &&
  !esEtiquetaTrasera("FaceTime HD Camera") &&
  dentroDeConstraints === "trasera-1";
console.log(todoOk ? "✓ Todo correcto" : "✗ Algo falla");