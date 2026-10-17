"use client";

import { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/i18n/language-provider";

export function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
}) {
  const t = useT();
  return (
    <Card className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted">{t(label)}</p>
        <p className="text-3xl font-bold tracking-tight">{value}</p>
      </div>
      <span className="grid h-11 w-11 place-items-center rounded-full bg-gold text-ink">
        {icon}
      </span>
    </Card>
  );
}
