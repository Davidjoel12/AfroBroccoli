"use client";

import { useIdioma } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

// Switch compacto ES / EN para el navbar
export function LanguageSwitch({
  className,
  variant = "dark",
}: {
  className?: string;
  /** dark = sobre la barra oscura (ink) · light = sobre fondo claro */
  variant?: "dark" | "light";
}) {
  const { idioma, setIdioma } = useIdioma();
  const oscuro = variant === "dark";

  return (
    <div
      role="group"
      aria-label="Idioma / Language"
      className={cn(
        "flex items-center gap-0.5 rounded-full p-0.5",
        oscuro ? "bg-white/10" : "border border-ink/10 bg-cream/60",
        className
      )}
    >
      {(["es", "en"] as const).map((codigo) => {
        const activo = idioma === codigo;
        return (
          <button
            key={codigo}
            type="button"
            onClick={() => setIdioma(codigo)}
            aria-pressed={activo}
            className={cn(
              "cursor-pointer rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-colors",
              activo
                ? oscuro
                  ? "bg-cream text-ink"
                  : "bg-ink text-cream"
                : oscuro
                  ? "text-muted-nav hover:text-cream"
                  : "text-muted hover:text-ink"
            )}
          >
            {codigo}
          </button>
        );
      })}
    </div>
  );
}