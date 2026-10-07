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

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const PRIMARY = "#6FC22D";
const GOLD = "#FFD700";

export function VisitsChart({ series }: { series: SerieVisitas }) {
  const [periodo, setPeriodo] = useState<Periodo>("dia");
  const dataSet = series[periodo];

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Visitas</h3>
        <div className="flex gap-1 rounded-full border border-ink/10 bg-cream/60 p-0.5 text-xs">
          {(["dia", "semana", "mes"] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`rounded-full px-3 py-1 capitalize transition-colors ${
                periodo === p
                  ? "bg-ink text-cream"
                  : "text-muted hover:text-ink"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <div className="relative h-64 w-full">
        <Bar
          data={{
            labels: dataSet.labels,
            datasets: [
              { label: "Regulares", data: dataSet.regulares, backgroundColor: PRIMARY, borderRadius: 6, barThickness: 14 },
              { label: "Membresía", data: dataSet.membresia, backgroundColor: GOLD, borderRadius: 6, barThickness: 14 },
            ],
          }}
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: { stacked: true, grid: { display: false }, ticks: { color: "#6B5F5A" } },
              y: { stacked: true, border: { display: false }, grid: { color: "rgba(34,27,25,0.08)" }, ticks: { color: "#6B5F5A" } },
            },
            plugins: { legend: { position: "bottom", labels: { usePointStyle: true, color: "#221B19" } } },
          }}
        />
      </div>
    </div>
  );
}

export function DistributionChart({ data }: { data: number[] }) {
  return (
    <div className="relative h-56 w-full">
      <Doughnut
        data={{
          labels: ["Regulares", "Membresía"],
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
