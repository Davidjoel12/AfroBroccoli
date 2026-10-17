"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import { useState } from "react";
import { SerieVisitas } from "@/lib/data";
import { Periodo } from "@/lib/types";
import { useT } from "@/components/i18n/language-provider";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const PRIMARY = "#6FC22D";
const GOLD = "#FFD700";

export function VisitsChart({ series }: { series: SerieVisitas }) {
  const t = useT();
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const dataSet = series[periodo];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{t("Visitas")}</h3>
        <div className="flex gap-1 rounded-full border border-ink/10 bg-cream/60 p-0.5 text-xs">
          {(["dia", "semana", "mes"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`rounded-full px-3 py-1 transition-colors ${
                periodo === p
                  ? "bg-ink text-cream"
                  : "text-muted hover:text-ink"
              }`}
            >
              {t(p)}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-64 w-full">
        <Bar
          data={{
            labels: dataSet.labels,
            datasets: [
              { label: t("Regulares"), data: dataSet.regulares, backgroundColor: PRIMARY, borderRadius: 6, barThickness: 14 },
              { label: t("Membresía"), data: dataSet.membresia, backgroundColor: GOLD, borderRadius: 6, barThickness: 14 },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true, grid: { display: false }, ticks: { color: "#6B5F5A" } },
              y: {
                stacked: true,
                beginAtZero: true,
                border: { display: false },
                grid: { color: "rgba(34,27,25,0.08)" },
                // sin decimales: los sellos y visitas son números enteros
                ticks: { color: "#6B5F5A", precision: 0, stepSize: 1 },
              },
            },
            plugins: { legend: { position: "bottom", labels: { usePointStyle: true, color: "#221B19" } } },
          }}
        />
      </div>
    </div>
  );
}

export function DistributionChart({ data }: { data: number[] }) {
  const t = useT();
  return (
    <div className="relative h-56 w-full">
      <Doughnut
        data={{
          labels: [t("Regulares"), t("Membresía")],
          datasets: [{ data, backgroundColor: [PRIMARY, GOLD], borderWidth: 0 }],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "72%",
          plugins: { legend: { position: "bottom", labels: { usePointStyle: true, color: "#FFF8EE" } } },
        }}
      />
    </div>
  );
}
