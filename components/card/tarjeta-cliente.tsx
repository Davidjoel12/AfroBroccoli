"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/language-provider";

// ============================================================================
// La tarjeta de cliente, tal como la ve el cliente.
//
// Este mismo componente se usa en dos lugares:
//   · /c/[codigo] → la tarjeta real que el cliente abre desde WhatsApp
//   · Configuración → Personalizar tarjeta → "Así la ve el cliente"
// Si cambiás algo acá, cambia en los dos lados a la vez.
// ============================================================================

export type TarjetaClienteProps = {
  nombre: string;
  codigo: string;
  sellos: number;
  meta: number;
  recompensa: string;
  colorAcento: string;
  membresia?: boolean;
  /** URL de la tarjeta: ruta relativa ("/c/AB-0042") o absoluta.
   *  Sin valor (undefined) usa la página actual; null = sin QR (vista previa sin cliente real). */
  url?: string | null;
  className?: string;
};

export function TarjetaCliente({
  nombre,
  codigo,
  sellos,
  meta,
  recompensa,
  colorAcento,
  membresia = false,
  url,
  className,
}: TarjetaClienteProps) {
  const t = useT();
  const [qr, setQr] = useState<string>("");

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

    let vivo = true;
    // Para que el escáner del salón lo lea sin insistir:
    // · margin: 4 → el margen de silencio que pide el estándar (venía en 1, y sin
    //   aire alrededor el lector cuesta más detectar dónde empieza el código).
    // · width: 384 → se genera más grande que lo que se muestra (96 px) para que
    //   los módulos salgan nítidos en pantallas de alta resolución.
    // · errorCorrectionLevel "M" → redundancia suficiente para un código impreso
    //   o con una raya, que es el caso real de una tarjeta.
    QRCode.toDataURL(destino, {
      width: 384,
      margin: 4,
      errorCorrectionLevel: "M",
      color: { dark: "#221B19", light: "#FFFFFF" },
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

  const faltan = Math.max(0, meta - sellos);
  const completa = faltan === 0 && meta > 0;

  return (
    <>
    <article
      className={cn("w-full max-w-sm rounded-[20px] p-5 text-cream", className)}
      style={{ backgroundColor: "#221B19" }}
    >
      {/* Barra de acento */}
      <div className="mb-4 h-2 w-full rounded-full" style={{ backgroundColor: colorAcento }} />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-script text-2xl leading-tight">AfroBroccoli</p>
          <p className="mt-2 truncate text-lg font-semibold leading-tight" title={nombre}>
            {nombre}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-muted-nav">{codigo}</p>
        </div>
        {membresia && (
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold text-ink"
            style={{ backgroundColor: colorAcento }}
          >
            {t("Miembro")}
          </span>
        )}
      </div>

      {/* Sellos */}
      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {Array.from({ length: meta }).map((_, i) => (
          <span
            key={i}
            className="h-4 w-4 rounded-full"
            style={{
              backgroundColor: i < sellos ? colorAcento : "rgba(255,248,238,0.2)",
            }}
          />
        ))}
      </div>

      {/* Recompensa */}
      <div className="mt-4">
        <p className="text-sm font-semibold leading-snug" style={{ color: colorAcento }}>
          {recompensa}
        </p>
        <p className="mt-0.5 text-xs text-muted-nav">
          {completa
            ? t("¡Recompensa lista! Passé por el salón a canjearla.")
            : `${t("Por completar")} ${faltan} ${faltan === 1 ? t("sello") : t("sellos")}`}
        </p>
      </div>

      {/* QR + código */}
      <div className="mt-5 flex items-center justify-between gap-3 border-t border-cream/10 pt-4">
        <p className="min-w-0 flex-1 text-[11px] leading-snug text-muted-nav">
          {t("Tu código único")}
          <span className="block font-semibold tracking-wide text-cream">{codigo}</span>
        </p>
        {url !== null && (
          // 96 px: se lee cómodo a un brazo de distancia y el lector lo toma sin
          // que haya que acercar mucho el teléfono.
          <div className="shrink-0 rounded-xl bg-white p-2">
            {qr ? (
              <Image
                src={qr}
                alt={`Código QR de la tarjeta de ${nombre}`}
                width={96}
                height={96}
                unoptimized
                className="h-24 w-24"
              />
            ) : (
              <div className="h-24 w-24 animate-pulse rounded bg-ink/10" aria-hidden="true" />
            )}
          </div>
        )}
      </div>
    </article>
    </>
  );
}
