"use client";

import { useEffect } from "react";
import { useNotificaciones } from "@/components/notifications/notificaciones-provider";
import type { Premio } from "@/lib/types";

/**
 * Sincroniza los premios pendientes (cargados en el servidor) con el provider
 * de notificaciones, para que el panel los muestre sin volver a consultar
 * Supabase desde el navegador.
 */
export function PremiosSync({ premios }: { premios: Premio[] }) {
  const { setPremios } = useNotificaciones();
  useEffect(() => {
    setPremios(premios);
  }, [premios, setPremios]);
  return null;
}
