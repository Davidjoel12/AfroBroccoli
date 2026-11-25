"use client";

import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import type { Cliente, Premio } from "@/lib/types";
import { generarNotificaciones, type Notificacion } from "@/lib/notificaciones";

/** Una notificación marcada como leída se oculta después de esta ventana. */
const VENTANA_LEIDAS_MS = 30 * 60 * 1000;
/** Cada cuánto revisamos si alguna notificación leída ya cumplió los 30 min. */
const INTERVALO_REVISION_MS = 30 * 1000;

type Contexto = {
  clientes: Cliente[];
  setClientes: (c: Cliente[]) => void;
  premios: Premio[];
  setPremios: (p: Premio[]) => void;
  notificaciones: Notificacion[];
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
  // id de notificación → momento en que se marcó como leída.
  const [leidasEn, setLeidasEn] = useState<Map<string, number>>(() => new Map());
  const [ahora, setAhora] = useState(() => Date.now());

  // Las notificaciones se derivan de clientes + premios: no hace falta
  // regenerarlas a mano cada vez que uno de los dos cambia.
  const notificacionesGeneradas = useMemo(
    () => generarNotificaciones(clientes, premios),
    [clientes, premios]
  );

  // Solo hacemos correr el reloj mientras haya alguna leída dentro de la
  // ventana de 30 min. Así no re-renderizamos el árbol sin necesidad.
  const hayLeidasVigentes = useMemo(() => {
    for (const leidaEn of leidasEn.values()) {
      if (ahora - leidaEn < VENTANA_LEIDAS_MS) return true;
    }
    return false;
  }, [leidasEn, ahora]);

  useEffect(() => {
    if (!hayLeidasVigentes) return;
    const intervalo = window.setInterval(
      () => setAhora(Date.now()),
      INTERVALO_REVISION_MS
    );
    return () => window.clearInterval(intervalo);
  }, [hayLeidasVigentes]);

  // Las leídas siguen visibles 30 min y después desaparecen de la campana.
  const notificaciones = useMemo(
    () =>
      notificacionesGeneradas.filter((n) => {
        const leidaEn = leidasEn.get(n.id);
        return leidaEn === undefined || ahora - leidaEn < VENTANA_LEIDAS_MS;
      }),
    [notificacionesGeneradas, leidasEn, ahora]
  );

  const estaLeida = useCallback(
    (n: Notificacion) => n.leida || leidasEn.has(n.id),
    [leidasEn]
  );

  const marcarLeida = useCallback((id: string) => {
    const ahoraMs = Date.now();
    setLeidasEn((prev) => {
      if (prev.has(id)) return prev;
      const siguiente = new Map(prev);
      siguiente.set(id, ahoraMs);
      return siguiente;
    });
    setAhora(ahoraMs);
  }, []);

  const marcarTodasLeidas = useCallback((ids: string[]) => {
    const ahoraMs = Date.now();
    setLeidasEn((prev) => {
      let cambio = false;
      const siguiente = new Map(prev);
      for (const id of ids) {
        if (!siguiente.has(id)) {
          siguiente.set(id, ahoraMs);
          cambio = true;
        }
      }
      return cambio ? siguiente : prev;
    });
    setAhora(ahoraMs);
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
