// Retraso artificial SOLO en desarrollo (1.2s) para poder ver los skeletons de cada ruta.
// En producción (next build / Vercel) no hace nada.
export async function devDelay() {
  if (process.env.NODE_ENV !== "development") return;
  await new Promise((resolve) => setTimeout(resolve, 1200));
}