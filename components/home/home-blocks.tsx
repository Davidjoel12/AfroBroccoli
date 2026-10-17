"use client";

import { Card } from "@/components/ui/card";
import { Logo } from "@/components/ui/logo";
import { DistributionChart } from "@/components/home/charts";
import { useT } from "@/components/i18n/language-provider";

/** Tarjeta de bienvenida con el logo de la empresa */
export function WelcomeCard({ logoUrl }: { logoUrl: string | null }) {
  const t = useT();
  return (
    <Card className="flex items-center gap-4 bg-mint">
      <Logo src={logoUrl} alt="AfroBroccoli" width={56} height={56} className="rounded-2xl" />
      <div>
        <p className="font-script text-2xl leading-tight">{t("Bienvenida de vuelta,")}</p>
        <p className="text-2xl font-bold leading-tight">AfroBroccoli</p>
      </div>
    </Card>
  );
}

/** Doughnut de distribución de clientes */
export function DistributionCard({ data }: { data: number[] }) {
  const t = useT();
  return (
    <Card className="bg-ink text-cream">
      <h3 className="mb-3 text-lg font-semibold">{t("Distribución de clientes")}</h3>
      <DistributionChart data={data} />
    </Card>
  );
}