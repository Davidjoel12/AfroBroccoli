import CardCustomizer from "@/components/config/card-customizer";
import { devDelay } from "@/lib/dev-delay";

export default async function PersonalizarTarjetaPage() {
  await devDelay();
  return <CardCustomizer />;
}
