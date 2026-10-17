"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DICCIONARIO_EN, type Idioma } from "@/lib/i18n";

const COOKIE = "afrobroccoli-idioma";

type Contexto = {
  idioma: Idioma;
  setIdioma: (i: Idioma) => void;
  t: (texto: string) => string;
};

const LanguageContext = createContext<Contexto | null>(null);

export function LanguageProvider({
  children,
  inicial = "es",
}: {
  children: React.ReactNode;
  inicial?: Idioma;
}) {
  const [idioma, setIdiomaEstado] = useState<Idioma>(inicial);

  // Lee la preferencia guardada al cargar la página
  useEffect(() => {
    const guardada = document.cookie
      .split("; ")
      .find((c) => c.startsWith(`${COOKIE}=`))
      ?.split("=")[1];
    if (guardada === "en" || guardada === "es") setIdiomaEstado(guardada);
  }, []);

  const setIdioma = useCallback((nuevo: Idioma) => {
    setIdiomaEstado(nuevo);
    // 1 año, para que la preferencia se respete entre visitas
    document.cookie = `${COOKIE}=${nuevo}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.lang = nuevo;
  }, []);

  const t = useCallback(
    (texto: string) => (idioma === "en" ? DICCIONARIO_EN[texto] ?? texto : texto),
    [idioma]
  );

  const valor = useMemo(() => ({ idioma, setIdioma, t }), [idioma, setIdioma, t]);

  return <LanguageContext.Provider value={valor}>{children}</LanguageContext.Provider>;
}

export function useIdioma() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useIdioma debe usarse dentro de LanguageProvider");
  return ctx;
}

/** Atajo: devuelve la función de traducción. */
export function useT() {
  return useIdioma().t;
}