"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useT } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";

// ============================================================================
// Modal compartido
//
// Bloquea el scroll del body, enfoca el botón de cerrar, cierra con Escape y
// devuelve el foco al elemento que lo abrió. Lo usan la página de Miembros y
// la de Promociones.
// ============================================================================

function IconoCerrar() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

export function Modal({
  titulo,
  subtitulo,
  onClose,
  children,
  footer,
  ancho = "max-w-lg",
}: {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  ancho?: string;
}) {
  const t = useT();
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const anteriorRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    anteriorRef.current = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", alTeclear);
      anteriorRef.current?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-ink/55 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className={cn(
            "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-card bg-white shadow-2xl",
            ancho
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink/10 p-5 sm:p-6">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-ink">{titulo}</h2>
              {subtitulo && (
                <p className="mt-1 text-sm text-muted">{subtitulo}</p>
              )}
            </div>
            <button
              ref={cerrarRef}
              type="button"
              onClick={onClose}
              aria-label={t("Cerrar")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <IconoCerrar />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {children}
          </div>

          {footer && (
            <div className="border-t border-ink/10 bg-cream/40 p-4 sm:px-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
