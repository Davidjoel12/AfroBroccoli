"use client";

import { useEffect } from "react";
import { useNotificaciones } from "@/components/notifications/notificaciones-provider";
import type { Cliente } from "@/lib/types";

/**
 * Sincroniza la lista de clientes (cargada en el servidor) con el provider de
 * notificaciones del cliente, para que el nav pueda calcular el badge y el
 * panel de notificaciones sin volver a consultar Supabase.
 */
export function ClientesSync({ clientes }: { clientes: Cliente[] }) {
  const { setClientes } = useNotificaciones();
  useEffect(() => {
    setClientes(clientes);
  }, [clientes, setClientes]);
  return null;
}
