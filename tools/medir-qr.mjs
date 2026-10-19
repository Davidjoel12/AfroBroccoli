// Verificación del QR de la tarjeta: tamaño real del PNG, margen y px por módulo.
// Se corre con: node tools/medir-qr.mjs
import QRCode from "qrcode";

const URL_TARJETA = "https://app.afrobroccoli.com/c/AB-0147";
const PX_MOSTRADOS_ANTES = 64; // h-16 w-16
const PX_MOSTRADOS_AHORA = 96; // h-24 w-24

function medirComoEnPantalla(url, opciones, pxMostrados) {
  const simbolo = QRCode.create(url, opciones);
  const ladoModulos = simbolo.modules.size; // el código, sin el margen
  const margen = opciones.margin ?? 4;
  const ladoTotal = ladoModulos + margen * 2;
  return {
    version: simbolo.version,
    ladoModulos,
    margen,
    ladoTotal,
    pxPorModulo: pxMostrados / ladoModulos,
    ancho: opciones.width,
  };
}

const CASOS = [
  { etiqueta: "ANTES  (mostrado 64 px, margin 1, width 200)", opciones: { margin: 1, width: 200, errorCorrectionLevel: "M" }, px: PX_MOSTRADOS_ANTES },
  { etiqueta: "AHORA  (mostrado 96 px, margin 4, width 384)", opciones: { margin: 4, width: 384, errorCorrectionLevel: "M" }, px: PX_MOSTRADOS_AHORA },
  { etiqueta: "SIN margin 4, solo el tamaño (96 px)", opciones: { margin: 1, width: 384, errorCorrectionLevel: "M" }, px: PX_MOSTRADOS_AHORA },
];

for (const { etiqueta, opciones, px } of CASOS) {
  const m = medirComoEnPantalla(URL_TARJETA, opciones, px);
  console.log(etiqueta);
  console.log(`  versión QR ............. v${m.version}  (${m.ladoModulos} x ${m.ladoModulos} módulos)`);
  console.log(`  PNG generado .......... ${m.ancho} x ${m.ancho} px`);
  console.log(`  margen de silencio ..... ${m.margen} módulos ${m.margen >= 4 ? "-> cumple la norma" : "-> POR DEBAJO (la norma pide 4)"}`);
  console.log(`  tamaño en pantalla ..... ${px} x ${px} px  -> ${m.pxPorModulo.toFixed(2)} px por módulo`);
  console.log("");
}

// El margen de 1 módulo deja el borde pegado al código: muchos lectores usan
// ese aire para detectar dónde arranca el QR.
const conMargen = medirComoEnPantalla(URL_TARJETA, { margin: 4, width: 384, errorCorrectionLevel: "M" }, 96);
const sinMargen = medirComoEnPantalla(URL_TARJETA, { margin: 1, width: 384, errorCorrectionLevel: "M" }, 96);
console.log(`En 96 px, el margen ocupa ${conMargen.ladoTotal - conMargen.ladoModulos} de los ${conMargen.ladoTotal} módulos:`);
console.log(`  con margin 4 → el código usa ${((conMargen.ladoModulos / conMargen.ladoTotal) * 100).toFixed(0)}% del ancho`);
console.log(`  con margin 1 → el código usa ${((sinMargen.ladoModulos / sinMargen.ladoTotal) * 100).toFixed(0)}% del ancho`);