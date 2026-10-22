"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import type { Cliente } from "@/lib/types";
import { generarNotificaciones, type Notificacion } from "@/lib/notificaciones";

type Contexto = {
  clientes: Cliente[];
  setClientes: (c: Cliente[]) => void;
  notificaciones: Notificacion[];
  regenerate: () => void;
};

const ContextoNotificaciones = createContext<Contexto | null>(null);

export function NotificacionesProvider({ children }: { children: ReactNode }) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  const regenerate = useCallback(() => {
    setNotificaciones(generarNotificaciones(clientes));
  }, [clientes]);

  const valor = { clientes, setClientes, notificaciones, regenerate };

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
