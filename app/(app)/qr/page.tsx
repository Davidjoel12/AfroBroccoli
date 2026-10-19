import { headers } from "next/headers";
import { devDelay } from "@/lib/dev-delay";
import QrView from "./qr-view";

export default async function QRPage() {
  await devDelay();

  // Origen real del sitio: lo usa el link de la tarjeta que va por WhatsApp.
  const cab = await headers();
  const host = cab.get("x-forwarded-host") ?? cab.get("host") ?? "localhost:3000";
  const proto = cab.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");

  return <QrView origen={`${proto}://${host}`} />;
}