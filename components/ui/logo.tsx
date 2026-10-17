"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";

const LOGO_POR_DEFECTO = "/logo.jpg";

// Caché en módulo: el logo se consulta una sola vez por sesión de la app
let cache: string | null = null;
let pendiente: Promise<string> | null = null;

async function cargarLogo(): Promise<string> {
  if (cache) return cache;
  if (!pendiente) {
    pendiente = (async () => {
      try {
        const { data } = await supabase
          .from("config")
          .select("logo_url")
          .eq("id", 1)
          .single();
        cache = data?.logo_url || LOGO_POR_DEFECTO;
      } catch {
        cache = LOGO_POR_DEFECTO;
      } finally {
        pendiente = null;
      }
      return cache ?? LOGO_POR_DEFECTO;
    })();
  }
  return pendiente ?? LOGO_POR_DEFECTO;
}

/** Logo de la empresa: usa el que se subió en Configuración y cae al original si no hay. */
export function Logo({
  alt = "AfroBroccoli",
  className,
  width = 176,
  height = 176,
  src: srcInicial,
}: {
  alt?: string;
  className?: string;
  width?: number;
  height?: number;
  /** URL ya resuelta (por ejemplo, desde un Server Component) */
  src?: string | null;
}) {
  const [src, setSrc] = useState<string>(srcInicial || cache || LOGO_POR_DEFECTO);

  useEffect(() => {
    if (srcInicial) {
      setSrc(srcInicial);
      cache = srcInicial;
      return;
    }
    let vivo = true;
    cargarLogo().then((url) => {
      if (vivo) setSrc(url);
    });
    return () => {
      vivo = false;
    };
  }, [srcInicial]);

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      unoptimized={src.startsWith("http")}
      className={className}
    />
  );
}