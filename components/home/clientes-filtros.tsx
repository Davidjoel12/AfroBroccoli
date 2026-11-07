"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/language-provider";
import { MESES, mesDe } from "@/lib/fechas";
import { cn } from "@/lib/utils";
import type { Cliente } from "@/lib/types";

// ============================================================================
// Filtros de la lista de clientes de Home.
//
// La barra vive arriba (al lado del banner de bienvenida) y las dos tablas
// consumen el mismo contexto: búsqueda por texto + mes de registro +
// mes de cumpleaños. Así una sola barra manda sobre todos los clientes y sobre
// la tabla de membresía (un miembro aparece en ambas).
// ============================================================================

type FiltrosClientes = {
  busqueda: string;
  mesRegistro: string;
  mesCumpleanos: string;
  /** Hay al menos un filtro puesto. */
  activos: boolean;
  setBusqueda: (valor: string) => void;
  setMesRegistro: (valor: string) => void;
  setMesCumpleanos: (valor: string) => void;
  limpiar: () => void;
  /** true si el cliente pasa los filtros actuales. */
  coincide: (cliente: Cliente) => boolean;
  coincidentes: number;
  total: number;
  /** Clientes por mes (índice 0–11) para etiquetar los selects. */
  conteosRegistro: number[];
  conteosCumpleanos: number[];
  /** Hay al menos un cliente con fecha de registro / nacimiento. */
  hayRegistros: boolean;
  hayCumpleanos: boolean;
};

const SIN_FILTROS: FiltrosClientes = {
  busqueda: "",
  mesRegistro: "",
  mesCumpleanos: "",
  activos: false,
  setBusqueda: () => {},
  setMesRegistro: () => {},
  setMesCumpleanos: () => {},
  limpiar: () => {},
  coincide: () => true,
  coincidentes: 0,
  total: 0,
  conteosRegistro: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  conteosCumpleanos: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  hayRegistros: false,
  hayCumpleanos: false,
};

const Contexto = createContext<FiltrosClientes | null>(null);

/**
 * Las tablas lo usan para filtrarse. Si no hay provider (por ejemplo, otra
 * pantalla que reutilice `ClientsTable`), devuelve "sin filtros" en vez de
 * romper.
 */
export function useFiltrosClientes(): FiltrosClientes {
  return useContext(Contexto) ?? SIN_FILTROS;
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function FiltrosClientesProvider({
  clientes,
  children,
}: {
  clientes: Cliente[];
  children: ReactNode;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [mesRegistro, setMesRegistro] = useState("");
  const [mesCumpleanos, setMesCumpleanos] = useState("");

  const coincide = useCallback(
    (cliente: Cliente) => {
      if (mesRegistro !== "" && mesDe(cliente.creadoEl) !== Number(mesRegistro)) {
        return false;
      }
      if (mesCumpleanos !== "" && mesDe(cliente.fechaNacimiento) !== Number(mesCumpleanos)) {
        return false;
      }

      const consulta = busqueda.trim();
      if (!consulta) return true;

      const texto = normalizar(consulta);
      const digitos = consulta.replace(/\D/g, "");
      const campos = [cliente.nombre, cliente.correo, cliente.codigo, cliente.telefonoFormato];

      if (campos.some((campo) => normalizar(campo).includes(texto))) return true;

      // Teléfonos: "6000 1234" y "+507 6000 1234" tienen que encontrar lo mismo.
      return digitos.length > 0 && cliente.telefono.replace(/\D/g, "").includes(digitos);
    },
    [busqueda, mesRegistro, mesCumpleanos]
  );

  const coincidentes = useMemo(
    () => clientes.filter(coincide).length,
    [clientes, coincide]
  );

  // Conteos por mes: se muestran en las opciones de los selects para que se vea
  // de un vistazo qué meses tienen clientes (y cuáles están vacíos de verdad).
  const { conteosRegistro, conteosCumpleanos } = useMemo(() => {
    const registro = new Array<number>(12).fill(0);
    const cumple = new Array<number>(12).fill(0);
    for (const cliente of clientes) {
      const mesRegistroCliente = mesDe(cliente.creadoEl);
      if (mesRegistroCliente !== null) registro[mesRegistroCliente] += 1;
      const mesCumpleCliente = mesDe(cliente.fechaNacimiento);
      if (mesCumpleCliente !== null) cumple[mesCumpleCliente] += 1;
    }
    return { conteosRegistro: registro, conteosCumpleanos: cumple };
  }, [clientes]);

  const limpiar = useCallback(() => {
    setBusqueda("");
    setMesRegistro("");
    setMesCumpleanos("");
  }, []);

  const valor = useMemo<FiltrosClientes>(
    () => ({
      busqueda,
      mesRegistro,
      mesCumpleanos,
      activos: busqueda.trim() !== "" || mesRegistro !== "" || mesCumpleanos !== "",
      setBusqueda,
      setMesRegistro,
      setMesCumpleanos,
      limpiar,
      coincide,
      coincidentes,
      total: clientes.length,
      conteosRegistro,
      conteosCumpleanos,
      hayRegistros: conteosRegistro.some((n) => n > 0),
      hayCumpleanos: conteosCumpleanos.some((n) => n > 0),
    }),
    [
      busqueda,
      mesRegistro,
      mesCumpleanos,
      limpiar,
      coincide,
      coincidentes,
      clientes.length,
      conteosRegistro,
      conteosCumpleanos,
    ]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

const ETIQUETA =
  "flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted";

/** Barra horizontal: buscador + mes de registro + mes de cumpleaños. */
export function FiltrosClientesBar() {
  const t = useT();
  const {
    busqueda,
    mesRegistro,
    mesCumpleanos,
    activos,
    setBusqueda,
    setMesRegistro,
    setMesCumpleanos,
    limpiar,
    coincidentes,
    total,
    conteosRegistro,
    conteosCumpleanos,
  } = useFiltrosClientes();

  return (
    <Card className="flex min-w-0 flex-col justify-center gap-3 p-4 sm:p-5">
      <form
        role="search"
        onSubmit={(e) => e.preventDefault()}
        className="flex min-w-0 flex-col gap-3 md:flex-row md:items-end"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <label htmlFor="buscar-clientes" className={ETIQUETA}>
            {t("Buscar cliente")}
          </label>
          <div className="relative min-w-0">
            <IconoBuscar className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input
              id="buscar-clientes"
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setBusqueda("");
              }}
              placeholder={t("Nombre, teléfono, correo o código")}
              autoComplete="off"
              className="min-w-0 pl-10 pr-10 placeholder:text-muted"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda("")}
                aria-label={t("Limpiar búsqueda")}
                title={t("Limpiar búsqueda")}
                className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
              >
                <IconoCerrar className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 md:flex md:shrink-0">
          <MesSelect
            id="mes-registro"
            etiqueta={t("Mes de registro")}
            icono={<IconoCalendario className="h-3.5 w-3.5" />}
            value={mesRegistro}
            onChange={setMesRegistro}
            conteos={conteosRegistro}
          />
          <MesSelect
            id="mes-cumpleanos"
            etiqueta={t("Mes de cumpleaños")}
            icono={<IconoTorta className="h-3.5 w-3.5" />}
            value={mesCumpleanos}
            onChange={setMesCumpleanos}
            conteos={conteosCumpleanos}
          />
        </div>
      </form>

      {/* Resumen: aparece solo cuando hay filtros puestos para no cargar la barra. */}
      <div
        className={cn(
          "flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-3 text-xs",
          activos ? "animate-fade-in" : "hidden"
        )}
      >
        <p className="text-muted" aria-live="polite">
          {t("Mostrando")}{" "}
          <span className="font-semibold text-ink">{coincidentes}</span> {t("de")}{" "}
          <span className="font-semibold text-ink">{total}</span> {t("clientes")}
        </p>
        <button
          type="button"
          onClick={limpiar}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 font-semibold text-ink transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:outline-none"
        >
          <IconoCerrar className="h-3.5 w-3.5" />
          {t("Limpiar filtros")}
        </button>
      </div>
    </Card>
  );
}

function MesSelect({
  id,
  etiqueta,
  icono,
  value,
  onChange,
  conteos,
}: {
  id: string;
  etiqueta: string;
  icono: ReactNode;
  value: string;
  onChange: (valor: string) => void;
  conteos: number[];
}) {
  const t = useT();
  const activo = value !== "";
  const mostrarConteos = conteos.some((n) => n > 0);

  return (
    <div className="flex min-w-0 flex-col gap-1.5 md:w-[164px] lg:w-[176px]">
      <label htmlFor={id} className={ETIQUETA}>
        {icono}
        <span className="truncate">{etiqueta}</span>
      </label>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "h-11 w-full cursor-pointer appearance-none rounded-lg border bg-white pl-3 pr-9 text-sm font-medium text-ink transition-colors focus:border-primary focus:ring-2 focus:ring-primary/25 focus:outline-none",
            activo
              ? "border-primary/60 bg-primary/10"
              : "border-ink/15 hover:border-primary/40"
          )}
        >
          <option value="">{t("Todos")}</option>
          {MESES.map((mes, indice) => (
            <option key={mes} value={String(indice)}>
              {t(mes)}
              {mostrarConteos ? ` · ${conteos[indice]}` : ""}
            </option>
          ))}
        </select>
        <IconoChevron className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      </div>
    </div>
  );
}

// ===== Iconos (mismo trazo que el resto de la app) =====

function IconoBuscar({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function IconoCalendario({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}

function IconoTorta({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" />
      <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" />
      <path d="M2 21h20" />
      <path d="M7 8v3" />
      <path d="M12 8v3" />
      <path d="M17 8v3" />
      <path d="M7 4h.01" />
      <path d="M12 4h.01" />
      <path d="M17 4h.01" />
    </svg>
  );
}

function IconoCerrar({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function IconoChevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
