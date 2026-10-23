"use client";

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Cliente, Premio } from "@/lib/types";
import { generarNotificaciones, type Notificacion } from "@/lib/notificaciones";

type Contexto = {
  clientes: Cliente[];
  setClientes: (c: Cliente[]) => void;
  premios: Premio[];
  setPremios: (p: Premio[]) => void;
  notificaciones: Notificacion[];
  leidas: Set<string>;
  estaLeida: (n: Notificacion) => boolean;
  marcarLeida: (id: string) => void;
  marcarTodasLeidas: (ids: string[]) => void;
  /** Marca el premio como entregado en Supabase y lo saca de la lista. */
  marcarPremioEntregado: (premioId: string) => Promise<void>;
};

const ContextoNotificaciones = createContext<Contexto | null>(null);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [premios, setPremios] = useState<Premio[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(new Set());

  // Las notificaciones se derivan de clientes + premios: no hace falta
  // regenerarlas a mano cada vez que uno de los dos cambia.
  const notificaciones = useMemo(
    () => generarNotificaciones(clientes, premios),
    [clientes, premios]
  );

  const estaLeida = useCallback(
    (n: Notificacion) => n.leida || leidas.has(n.id),
    [leidas]
  );

  const marcarLeida = useCallback((id: string) => {
    setLeidas((prev) => {
      if (prev.has(id)) return prev;
      const siguiente = new Set(prev);
      siguiente.add(id);
      return siguiente;
    });
  }, []);

  const marcarTodasLeidas = useCallback((ids: string[]) => {
    setLeidas((prev) => {
      const siguiente = new Set(prev);
      ids.forEach((id) => siguiente.add(id));
      return siguiente;
    });
  }, []);

  const marcarPremioEntregado = useCallback(async (premioId: string) => {
    const { error } = await supabase
      .from("premios")
      .update({ estado: "entregado", entregado_at: new Date().toISOString() })
      .eq("id", premioId);
    if (error) {
      console.error("[premio:entregar]", error.code, error.message);
      return;
    }
    setPremios((prev) => prev.filter((p) => p.id !== premioId));
  }, []);

  const valor = {
    clientes,
    setClientes,
    premios,
    setPremios,
    notificaciones,
    leidas,
    estaLeida,
    marcarLeida,
    marcarTodasLeidas,
    marcarPremioEntregado,
  };

  return (
    <ContextoNotificaciones.Provider value={valor}>
      {children}
    </ContextoNotificaciones.Provider>
  );
}

export function useNotificaciones() {
  const ctx = useContext(ContextoNotificaciones);
  if (!ctx) {
    throw new Error("useNotificaciones debe usarse dentro de NotificacionesProvider");
  }
  return ctx;
}
