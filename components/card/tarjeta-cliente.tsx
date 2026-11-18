"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { useT } from "@/components/i18n/language-provider";

// ============================================================================
// La tarjeta de cliente, tal como la ve el cliente.
//
// Este mismo componente se usa en dos lugares:
//   · /c/[codigo] → la tarjeta real que el cliente abre desde WhatsApp
//   · Configuración → Personalizar tarjeta → "Así la ve el cliente"
// Si cambiás algo acá, cambia en los dos lados a la vez.
//
// La tarjeta compacta NO muestra el QR: se abre en pantalla completa desde el
// botón "Ampliar QR para escanear", sobre fondo blanco para que el lector del
// salón lo tome sin ruido visual.
// ============================================================================

export type TarjetaClienteProps = {
  nombre: string;
  codigo: string;
  sellos: number;
  meta: number;
  recompensa: string;
  /** Logo de la empresa. Si falta, usa /logo.jpg. */
  logoUrl?: string | null;
  /** @deprecated La tarjeta usa la paleta fija de la marca. Se acepta por compatibilidad. */
  colorAcento?: string;
  membresia?: boolean;
  /** URL de la tarjeta: ruta relativa ("/c/AB-0042") o absoluta.
   *  Sin valor (undefined) usa la página actual; null = sin QR (vista previa sin cliente real). */
  url?: string | null;
  className?: string;
};

type SentinelaPantalla = {
  release: () => Promise<void>;
  addEventListener?: (tipo: "release", alLiberar: () => void) => void;
};

function IconoMaximizar() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M16 3h3a2 2 0 0 1 2 2v3" />
      <path d="M8 21H5a2 2 0 0 1-2-2v-3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function IconoCerrar() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function TarjetaCliente({
  nombre,
  codigo,
  sellos,
  meta,
  recompensa,
  logoUrl,
  membresia = false,
  url,
  className,
}: TarjetaClienteProps) {
  const t = useT();
  const [qr, setQr] = useState("");
  const [abierto, setAbierto] = useState(false);
  const botonAbrirRef = useRef<HTMLButtonElement>(null);
  const botonCerrarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // url === null: sin QR a propósito (vista previa sin cliente real).
    if (url === null) return;

    // Sin url explícita estamos en /c/[codigo]: el QR apunta a esta misma página.
    const base =
      typeof window === "undefined" ? "https://app.afrobroccoli.com" : window.location.origin;
    const destino = url
      ? new URL(url, base).toString()
      : typeof window === "undefined"
        ? null
        : window.location.href.split(/[?#]/)[0];
    if (!destino) return;

    // Los colores salen de los tokens para que el QR siga la paleta sin
    // duplicar valores hex en el componente.
    const estilos = getComputedStyle(document.documentElement);
    const tinta = estilos.getPropertyValue("--color-card-qr-ink").trim() || "#111111";
    const fondo = estilos.getPropertyValue("--color-card-qr").trim() || "#FFFFFF";

    let vivo = true;
    // width 1024: se muestra a 340 px como máximo, así que sobra resolución
    // para pantallas densas. margin 4 = la zona de silencio que pide el estándar.
    QRCode.toDataURL(destino, {
      width: 1024,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: tinta, light: fondo },
    })
      .then((src) => {
        if (vivo) setQr(src);
      })
      .catch(() => {
        if (vivo) setQr("");
      });
    return () => {
      vivo = false;
    };
  }, [url]);

  // Modal: bloquea el scroll, pide wake lock, atrapa el foco y devuelve el foco
  // al botón que lo abrió. Si el navegador no soporta wake lock, se ignora.
  useEffect(() => {
    if (!abierto || !qr) return;

    const botonAbrir = botonAbrirRef.current;
    const overflowPrevio = document.body.style.overflow;
    const overflowHtmlPrevio = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    botonCerrarRef.current?.focus();

    let sentinela: SentinelaPantalla | null = null;
    let cancelado = false;

    const pedirWakeLock = async () => {
      try {
        const nav = navigator as Navigator & {
          wakeLock?: { request: (tipo: "screen") => Promise<SentinelaPantalla> };
        };
        if (!nav.wakeLock) return;
        const nueva = await nav.wakeLock.request("screen");
        if (cancelado) {
          void nueva.release().catch(() => {});
          return;
        }
        sentinela = nueva;
        // El navegador libera el wake lock al ocultar la pestaña; así sabemos
        // que hay que volver a pedirlo cuando el cliente regresa.
        nueva.addEventListener?.("release", () => {
          if (sentinela === nueva) sentinela = null;
        });
      } catch {
        // El navegador puede rechazar el wake lock (pestaña oculta, permisos).
        // No es un error de la app: seguimos sin él.
      }
    };

    void pedirWakeLock();

    // El wake lock se libera solo cuando la pestaña pasa a segundo plano.
    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "visible" && !sentinela) void pedirWakeLock();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);

    const alPresionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") {
        evento.preventDefault();
        setAbierto(false);
      } else if (evento.key === "Tab") {
        // Único control enfocable del diálogo: el foco no se escapa al fondo.
        evento.preventDefault();
        botonCerrarRef.current?.focus();
      }
    };
    window.addEventListener("keydown", alPresionarTecla);

    return () => {
      cancelado = true;
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("keydown", alPresionarTecla);
      document.body.style.overflow = overflowPrevio;
      document.documentElement.style.overflow = overflowHtmlPrevio;
      if (sentinela) void sentinela.release().catch(() => {});
      requestAnimationFrame(() => botonAbrir?.focus());
    };
  }, [abierto, qr]);

  const faltan = Math.max(0, meta - sellos);
  const completa = faltan === 0 && meta > 0;
  const sellosVisibles = Math.max(0, Math.min(meta, sellos));
  const mostrarBotonQr = url !== null;

  return (
    <>
      {/* Contenedor crema con el padding de la vista pública. */}
      <div className={cn("w-full bg-card-cream px-3.5 py-5", className)}>
        <div className="mx-auto flex w-full max-w-[384px] flex-col items-center">
          <article className="w-full overflow-hidden rounded-3xl bg-card-dark p-5 text-card-text shadow-[0_18px_40px_-24px_rgba(33,26,25,0.6)]">
            {/* Barra de acento */}
            <div className="h-1.5 w-full rounded-full bg-card-accent" aria-hidden="true" />

            {/* Identidad + ilustración */}
            <div className="mt-4 flex min-h-28 items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-lg leading-tight text-card-text">AfroBroccoli</p>
                <p
                  className="mt-2 truncate text-[15px] font-semibold leading-tight"
                  title={nombre}
                >
                  {nombre}
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="text-[11px] tracking-wide text-card-muted">{codigo}</p>
                  {membresia && (
                    <span className="rounded-full bg-card-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-card-accent">
                      {t("Miembro")}
                    </span>
                  )}
                </div>
              </div>

              {/* Logo oficial: el negro del JPG se mezcla con la tarjeta oscura. */}
              <div className="-mr-3 -mt-1.5 flex h-[150px] w-[150px] shrink-0 items-center justify-center">
                <Logo
                  src={logoUrl ?? "/logo.jpg"}
                  alt=""
                  width={150}
                  height={150}
                  className="h-full w-full object-contain mix-blend-lighten"
                />
              </div>
            </div>

            {/* Sellos */}
            <div
              className="mt-1 flex flex-wrap items-center gap-2"
              role="img"
              aria-label={`${sellosVisibles} ${t("de")} ${meta} ${t("sellos")}`}
            >
              {Array.from({ length: meta }).map((_, indice) => (
                <span
                  key={indice}
                  aria-hidden="true"
                  className={cn(
                    "h-4 w-4 rounded-full",
                    indice < sellos ? "bg-card-accent" : "bg-card-empty"
                  )}
                />
              ))}
            </div>

            {/* Premio y progreso */}
            <p className="mt-4 text-[13px] font-semibold leading-snug text-card-accent">
              {recompensa}
            </p>
            <p className="mt-1 text-xs text-card-muted">
              {completa
                ? t("¡Recompensa lista! Pasá por el salón a canjearla.")
                : `${t("Por completar")} ${faltan} ${faltan === 1 ? t("sello") : t("sellos")}`}
            </p>

            {/* El QR no vive en la tarjeta compacta: se abre a pantalla completa. */}
            {mostrarBotonQr && (
              <button
                ref={botonAbrirRef}
                type="button"
                onClick={() => setAbierto(true)}
                disabled={!qr}
                aria-label={t("Ampliar código QR para escanear")}
                className="mt-4 flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-card-accent px-4 py-3 text-sm font-semibold text-card-dark transition-colors hover:bg-card-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card-text focus-visible:ring-offset-2 focus-visible:ring-offset-card-dark disabled:cursor-wait disabled:opacity-70"
              >
                <IconoMaximizar />
                <span>{t("Ampliar QR para escanear")}</span>
              </button>
            )}
          </article>

          <p className="mt-4 text-center text-xs text-card-support">
            {t("Mostrá este código en el salón para sumar tus sellos.")}
          </p>
        </div>
      </div>

      {/* Vista ampliada del QR: fondo blanco puro para que el lector lo tome. */}
      {abierto &&
        qr &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${t("Código QR para escanear")} · ${nombre}`}
            className="fixed inset-0 z-[100] overflow-y-auto bg-card-qr animate-qr-overlay motion-reduce:animate-none"
            onClick={() => setAbierto(false)}
          >
            <button
              ref={botonCerrarRef}
              type="button"
              onClick={() => setAbierto(false)}
              aria-label={t("Cerrar")}
              className="fixed right-3 top-3 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-card-dark/10 bg-card-qr text-card-dark shadow-sm transition-colors hover:bg-card-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-card-dark focus-visible:ring-offset-2 focus-visible:ring-offset-card-qr"
            >
              <IconoCerrar />
            </button>

            <div className="flex min-h-full items-center justify-center px-4 py-16">
              <div className="animate-qr-pop motion-reduce:animate-none">
                <div
                  className="overflow-hidden rounded-2xl bg-card-qr shadow-sm"
                  style={{ width: "min(90vw, 340px)" }}
                  onClick={(evento) => evento.stopPropagation()}
                >
                  <Image
                    src={qr}
                    alt={`${t("Código QR de la tarjeta de")} ${nombre}`}
                    width={1024}
                    height={1024}
                    unoptimized
                    className="h-auto w-full"
                  />
                </div>

                <p className="mt-6 text-center text-sm font-bold text-card-dark">{codigo}</p>
                <p className="mt-1 text-center text-xs text-card-support">
                  {t("Acerca el teléfono al lector del salón")}
                </p>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
