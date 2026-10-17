import { devDelay } from "@/lib/dev-delay";
import QrView from "./qr-view";

export default async function QRPage() {
  await devDelay();
  return <QrView />;
}
