"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";

export type OpcionMenu = { value: string; label: string };

type Props = {
  value: string;
  options: OpcionMenu[];
  onChange: (value: string) => void;
  /** Texto del botón cuando no hay nada seleccionado */
  placeholder?: string;
  /** Muestra un input de búsqueda dentro del panel */
  searchable?: boolean;
  label: string;
  className?: string;
};

// Menú desplegable con el mismo estilo en toda la app (pastilla + panel)
export function SelectMenu({
  value,
  options,
  onChange,
  placeholder = "Selecciona",
  searchable = false,
  label,
  className,
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const seleccion = options.find((o) => o.value === value);
  const filtradas = useMemo(() => {
    if (!searchable || !busqueda.trim()) return options;
    const q = busqueda.trim().toLowerCase();
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, busqueda, searchable]);

  function cerrar() {
    setAbierto(false);
    setBusqueda("");
  }

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={label}
        onClick={() => setAbierto((v) => !v)}
        className={cn(
          "flex h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-ink/20 bg-white/50 pl-4 pr-3 text-sm text-ink transition-colors hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25",
          !seleccion && "text-muted"
        )}
      >
        <span className="truncate">{seleccion?.label ?? placeholder}</span>
        <svg
          aria-hidden
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={cn("shrink-0 text-muted transition-transform", abierto && "rotate-180")}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {abierto && (
        <>
          {/* Cierra al hacer clic afuera */}
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-30 cursor-default"
            onClick={cerrar}
          />
          <div className="absolute left-0 z-40 mt-2 w-full min-w-[200px] overflow-hidden rounded-2xl border border-ink/10 bg-white p-1.5 shadow-lg">
            {searchable && (
              <div className="px-1.5 pb-1.5">
                <input
                  autoFocus
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar…"
                  className="h-9 w-full rounded-xl border border-ink/10 bg-cream/50 px-3 text-sm text-ink placeholder:text-muted/70 focus:border-primary focus:outline-none"
                />
              </div>
            )}
            <ul role="listbox" aria-label={label} className="max-h-64 overflow-y-auto">
              {filtradas.length === 0 ? (
                <li className="px-3 py-3 text-center text-xs text-muted">Sin resultados</li>
              ) : (
                filtradas.map((o) => (
                  <li key={o.value} role="option" aria-selected={value === o.value}>
                    <button
                      type="button"
                      onClick={() => {
                        onChange(o.value);
                        cerrar();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                        value === o.value
                          ? "bg-primary/15 font-semibold text-ink"
                          : "text-muted hover:bg-cream hover:text-ink"
                      )}
                    >
                      <span className="truncate">{o.label}</span>
                      {value === o.value && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-primary">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      )}
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}