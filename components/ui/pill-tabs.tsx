"use client";

import { cn } from "@/lib/utils";

/**
 * Pills de selección. Cada tab lleva `id` (estable, el que guarda el estado) y
 * `label` (lo que se ve, ya traducido). Separar las dos cosas evita que el tab
 * activo deje de coincidir al cambiar de idioma.
 */
export function PillTabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2", className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          aria-pressed={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            "h-9 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors",
            active === tab.id
              ? "border-ink/15 bg-white text-primary"
              : "border-ink/15 bg-transparent text-muted hover:text-ink",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}