"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";

export type Usuario = {
  id: string;
  email: string | null;
  nombre: string | null;
  role: "admin" | "staff";
  telefono: string | null;
};

// Devuelve el usuario autenticado con su perfil (nombre + rol) de la tabla profiles
export function useUsuario() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (activo) setCargando(false);
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("nombre, role, telefono")
        .eq("id", user.id)
        .single();
      if (activo) {
        setUsuario({
          id: user.id,
          email: user.email ?? null,
          nombre: profile?.nombre ?? null,
          role: (profile?.role as "admin" | "staff") ?? "staff",
          telefono: profile?.telefono ?? null,
        });
        setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return { usuario, cargando };
}
