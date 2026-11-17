"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/input";
import { useT } from "@/components/i18n/language-provider";
import { supabase } from "@/lib/supabase";
import { enlaceWhatsapp } from "@/lib/config";
import { cn } from "@/lib/utils";
import {
  cuotasCobrables,
  estadoCuotaDe,
  fechaCorta,
  formatearMonto,
  partesMes,
  type ConfigMembresia,
  type EstadoMembresia,
  type MiembroMembresia,
  type PeriodoMembresia,
} from "@/lib/miembros";

// ============================================================================
// Página de Miembros
//
// Solo la usa el admin. La ruta y la tabla de cuotas están protegidas en el
// servidor; acá se maneja la interfaz, los pagos y los recordatorios.
// ============================================================================

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAXIMO_RECORDATORIOS = 50;

type Filtro = "todos" | "al_dia" | "pendientes" | "vencidos" | "revisar";

const FILTROS: Array<{ id: Filtro; label: string }> = [
  { id: "todos", label: "Todos" },
  { id: "al_dia", label: "Al día" },
  { id: "pendientes", label: "Pendientes" },
  { id: "vencidos", label: "Vencidos" },
  { id: "revisar", label: "Revisar" },
];

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function IconoBuscar() {
  return (
    <svg
      aria-hidden="true"
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  );
}

function IconoCorreo() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  );
}

function IconoWhatsapp() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.04 2C6.58 2 2.15 6.43 2.15 11.89c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.23h.01c5.46 0 9.89-4.43 9.89-9.88 0-2.64-1.03-5.12-2.9-6.99A9.83 9.83 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.03-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.26 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.68 4.23 3.76.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
    </svg>
  );
}

function IconoHistorial() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function IconoCerrar() {
  return (
    <svg
      aria-hidden="true"
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function EstadoBadge({
  estado,
  revisar,
}: {
  estado: EstadoMembresia;
  revisar?: boolean;
}) {
  const t = useT();
  const estilos: Record<EstadoMembresia, { label: string; clase: string }> = {
    al_dia: {
      label: "Al día",
      clase: "border-primary/30 bg-primary/15 text-ink",
    },
    pendiente: {
      label: "Por vencer",
      clase: "border-pending/40 bg-pending/15 text-ink",
    },
    vencido: {
      label: "Vencido",
      clase: "border-danger/30 bg-danger/10 text-danger",
    },
    sin_periodo: {
      label: "Sin período",
      clase: "border-ink/15 bg-ink/5 text-muted",
    },
  };
  const actual = estilos[estado];

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
          actual.clase
        )}
      >
        {t(actual.label)}
      </span>
      {revisar && (
        <span className="inline-flex items-center rounded-full border border-accent/40 bg-accent/15 px-2.5 py-1 text-[11px] font-semibold text-ink">
          {t("Revisar")}
        </span>
      )}
    </span>
  );
}

function EstadoCuotaBadge({
  periodo,
  hoy,
  diasGracia,
}: {
  periodo: PeriodoMembresia;
  hoy: string;
  diasGracia: number;
}) {
  const t = useT();
  const estado = estadoCuotaDe(periodo, hoy, diasGracia);
  const estilos = {
    pagado: {
      label: "Pagado",
      clase: "border-primary/30 bg-primary/15 text-ink",
    },
    exento: {
      label: "Regalo",
      clase: "border-mint/50 bg-mint/20 text-ink",
    },
    pendiente: {
      label: "Pendiente",
      clase: "border-pending/40 bg-pending/15 text-ink",
    },
    vencido: {
      label: "Vencido",
      clase: "border-danger/30 bg-danger/10 text-danger",
    },
  } as const;
  const actual = estilos[estado];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        actual.clase
      )}
    >
      {t(actual.label)}
    </span>
  );
}

function Metrica({
  label,
  value,
  detalle,
}: {
  label: string;
  value: string | number;
  detalle: string;
}) {
  const t = useT();
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">
        {t(label)}
      </p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-1 text-xs text-muted">{detalle}</p>
    </Card>
  );
}

function Modal({
  titulo,
  subtitulo,
  onClose,
  children,
  footer,
  ancho = "max-w-lg",
}: {
  titulo: string;
  subtitulo?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  ancho?: string;
}) {
  const t = useT();
  const cerrarRef = useRef<HTMLButtonElement>(null);
  const anteriorRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    anteriorRef.current = document.activeElement as HTMLElement | null;
    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    cerrarRef.current?.focus();

    const alTeclear = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") onCloseRef.current();
    };

    document.addEventListener("keydown", alTeclear);
    return () => {
      document.body.style.overflow = overflowPrevio;
      document.removeEventListener("keydown", alTeclear);
      anteriorRef.current?.focus();
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-ink/55 p-4">
      <div className="flex min-h-full items-center justify-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={titulo}
          className={cn(
            "flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-card bg-white shadow-2xl",
            ancho
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-ink/10 p-5 sm:p-6">
            <div className="min-w-0">
              <h2 className="text-xl font-semibold text-ink">{titulo}</h2>
              {subtitulo && (
                <p className="mt-1 text-sm text-muted">{subtitulo}</p>
              )}
            </div>
            <button
              ref={cerrarRef}
              type="button"
              onClick={onClose}
              aria-label={t("Cerrar")}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-muted transition-colors hover:bg-cream hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <IconoCerrar />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
            {children}
          </div>

          {footer && (
            <div className="border-t border-ink/10 bg-cream/40 p-4 sm:px-6">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PagoModal({
  miembro,
  periodoId,
  config,
  hoy,
  onClose,
  onSaved,
}: {
  miembro: MiembroMembresia;
  periodoId?: string;
  config: ConfigMembresia;
  hoy: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const cobrables = cuotasCobrables(miembro.periodos, hoy);
  const inicial =
    cobrables.find((periodo) => periodo.id === periodoId) ??
    cobrables[0] ??
    null;

  const [seleccion, setSeleccion] = useState(inicial?.id ?? "");
  const [monto, setMonto] = useState(
    String(inicial ? inicial.monto : config.monto)
  );
  const [nota, setNota] = useState(inicial?.nota ?? "");
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  const periodo = cobrables.find((item) => item.id === seleccion) ?? null;

  function elegir(id: string) {
    const siguiente = cobrables.find((item) => item.id === id);
    setSeleccion(id);
    setMonto(String(siguiente ? siguiente.monto : config.monto));
    setNota(siguiente?.nota ?? "");
    setError("");
  }

  async function guardar() {
    if (!periodo) {
      setError(t("Elegí una cuota."));
      return;
    }

    const montoNumero = Number(monto.replace(",", "."));
    if (!Number.isFinite(montoNumero) || montoNumero < 0) {
      setError(t("El monto debe ser mayor o igual a 0."));
      return;
    }

    setGuardando(true);
    setError("");

    const { error: errGuardar } = await supabase
      .from("membresias_periodos")
      .update({
        estado: "pagado",
        monto: montoNumero,
        pagado_at: new Date().toISOString(),
        nota: nota.trim() || null,
        revisar: false,
      })
      .eq("id", periodo.id);

    if (errGuardar) {
      console.error("[miembros:pago]", errGuardar.code, errGuardar.message);
      setError(t("No se pudo guardar el pago. Intentá de nuevo."));
      setGuardando(false);
      return;
    }

    setGuardando(false);
    onSaved();
  }

  return (
    <Modal
      titulo={t("Registrar pago")}
      subtitulo={`${miembro.nombre} · ${miembro.codigo}`}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="subtle" onClick={onClose}>
            {t("Cancelar")}
          </Button>
          <Button
            type="submit"
            form="form-pago-membresia"
            disabled={guardando || !periodo}
          >
            {guardando ? t("Guardando…") : t("Guardar pago")}
          </Button>
        </div>
      }
    >
      {cobrables.length === 0 ? (
        <div className="rounded-xl bg-cream/70 p-4 text-sm text-muted">
          <p className="font-semibold text-ink">{t("No hay cuotas pendientes.")}</p>
          <p className="mt-1">{t("Esta clienta ya está al día.")}</p>
        </div>
      ) : (
        <form id="form-pago-membresia" className="flex flex-col gap-5" onSubmit={(e) => { e.preventDefault(); guardar(); }}>
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium text-muted">{t("¿Qué cuota pagó?")}</p>
            <div className="flex flex-col gap-2">
              {cobrables.map((item) => {
                const partes = partesMes(item.periodo);
                const activa = item.id === seleccion;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => elegir(item.id)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                      activa
                        ? "border-primary/50 bg-primary/10"
                        : "border-ink/15 bg-white hover:bg-cream/60"
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink">
                        {t(partes.mes)} {partes.anio}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {item.estado === "exento"
                          ? t("Primer mes de regalo")
                          : item.venceEl
                            ? `${t("Vence el")} ${fechaCorta(item.venceEl)}`
                            : t("Sin vencimiento")}
                      </span>
                    </span>
                    <span className="shrink-0 text-right">
                      <span className="block text-sm font-semibold text-ink">
                        {item.estado === "exento"
                          ? t("Regalo")
                          : formatearMonto(item.monto)}
                      </span>
                      <span className="mt-0.5 block">
                        <EstadoCuotaBadge
                          periodo={item}
                          hoy={hoy}
                          diasGracia={config.diasGracia}
                        />
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("Monto")} htmlFor="pago-monto">
              <Input
                id="pago-monto"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
              />
            </Field>
            <div className="flex flex-col gap-1.5 text-sm font-medium text-muted">
              <span>{t("Vence el")}</span>
              <div className="flex h-11 items-center rounded-lg border border-ink/15 bg-cream/50 px-4 text-ink">
                {periodo?.venceEl ? fechaCorta(periodo.venceEl) : "—"}
              </div>
            </div>
          </div>

          <Field label={t("Nota (opcional)")} htmlFor="pago-nota">
            <Input
              id="pago-nota"
              placeholder={t("Ej. pagó en efectivo, transferencia, etc.")}
              value={nota}
              onChange={(e) => setNota(e.target.value)}
            />
          </Field>

          {error && (
            <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
              {error}
            </p>
          )}

          <p className="text-xs text-muted">
            {t("Se registra solo la cuota elegida. Si hay meses anteriores pendientes, podés marcarlos uno por uno.")}
          </p>
        </form>
      )}
    </Modal>
  );
}

function DetalleModal({
  miembro,
  config,
  hoy,
  onClose,
  onPago,
  onChanged,
}: {
  miembro: MiembroMembresia;
  config: ConfigMembresia;
  hoy: string;
  onClose: () => void;
  onPago: (periodoId: string) => void;
  onChanged: (texto: string, tipo?: "ok" | "error") => void;
}) {
  const t = useT();
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  const periodos = useMemo(
    () => [...miembro.periodos].sort((a, b) => b.periodo.localeCompare(a.periodo)),
    [miembro.periodos]
  );
  const cuotaVisible = miembro.periodoActual ?? miembro.periodoPendiente;

  async function alternarRevisar(periodo: PeriodoMembresia) {
    setTrabajando(true);
    setError("");
    const { error: errGuardar } = await supabase
      .from("membresias_periodos")
      .update({ revisar: !periodo.revisar })
      .eq("id", periodo.id);

    if (errGuardar) {
      setError(t("No se pudo actualizar la marca de revisar."));
      setTrabajando(false);
      return;
    }

    setTrabajando(false);
    onChanged(
      periodo.revisar
        ? t("Se quitó la marca de revisar.")
        : t("Se marcó para revisar.")
    );
  }

  async function deshacerPago(periodo: PeriodoMembresia) {
    if (!window.confirm(t("¿Deshacer este pago? La cuota vuelve a pendiente."))) {
      return;
    }

    setTrabajando(true);
    setError("");
    const { error: errGuardar } = await supabase
      .from("membresias_periodos")
      .update({ estado: "pendiente", pagado_at: null, revisar: false })
      .eq("id", periodo.id);

    if (errGuardar) {
      setError(t("No se pudo deshacer el pago."));
      setTrabajando(false);
      return;
    }

    setTrabajando(false);
    onChanged(t("Pago deshecho. La cuota volvió a pendiente."));
  }

  async function quitarMembresia() {
    if (
      !window.confirm(
        t(
          "¿Quitar la membresía? La clienta sigue como cliente regular y conserva sus sellos."
        )
      )
    ) {
      return;
    }

    setTrabajando(true);
    setError("");
    const { error: errGuardar } = await supabase
      .from("clientes")
      .update({
        membresia: false,
        membresia_desde: null,
        membresia_primer_mes_gratis: false,
      })
      .eq("id", miembro.id);

    if (errGuardar) {
      setError(t("No se pudo quitar la membresía."));
      setTrabajando(false);
      return;
    }

    setTrabajando(false);
    onChanged(t("Membresía quitada. Sigue como cliente regular."));
  }

  return (
    <Modal
      titulo={miembro.nombre}
      subtitulo={`${miembro.codigo} · ${miembro.correo || t("Sin correo cargado")}`}
      onClose={onClose}
      ancho="max-w-2xl"
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl bg-cream/70 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <EstadoBadge estado={miembro.estado} revisar={miembro.revisar} />
            {miembro.adeudos > 0 && (
              <span className="text-xs font-medium text-muted">
                {miembro.adeudos} {miembro.adeudos === 1 ? t("cuota pendiente") : t("cuotas pendientes")}
              </span>
            )}
          </div>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">{t("Miembro desde")}</dt>
              <dd className="font-semibold text-ink">
                {fechaCorta(miembro.membresiaDesde)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t("Teléfono")}</dt>
              <dd className="font-semibold text-ink">
                {miembro.telefonoFormato || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t("Cuota actual")}</dt>
              <dd className="font-semibold text-ink">
                {cuotaVisible
                  ? cuotaVisible.estado === "exento"
                    ? t("Primer mes de regalo")
                    : formatearMonto(cuotaVisible.monto)
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted">{t("Último pago")}</dt>
              <dd className="font-semibold text-ink">
                {miembro.ultimoPago?.pagadoAt
                  ? fechaCorta(miembro.ultimoPago.pagadoAt)
                  : "—"}
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-ink">{t("Historial de cuotas")}</h3>
            <span className="text-xs text-muted">
              {t("Total pagado:")} {formatearMonto(miembro.totalPagado)}
            </span>
          </div>

          {periodos.length === 0 ? (
            <p className="mt-3 rounded-lg bg-cream/60 px-4 py-3 text-sm text-muted">
              {t("Todavía no hay cuotas generadas.")}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-ink/10">
              {periodos.map((periodo) => {
                const partes = partesMes(periodo.periodo);
                const estado = estadoCuotaDe(periodo, hoy, config.diasGracia);
                const pagado = estado === "pagado";
                const regalo = estado === "exento";

                return (
                  <li key={periodo.id} className="flex flex-col gap-2 py-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">
                          {t(partes.mes)} {partes.anio}
                        </p>
                        <p className="mt-0.5 text-xs text-muted">
                          {regalo
                            ? t("Primer mes de regalo")
                            : `${formatearMonto(periodo.monto)} · ${
                                periodo.venceEl
                                  ? `${t("Vence el")} ${fechaCorta(periodo.venceEl)}`
                                  : t("Sin vencimiento")
                              }`}
                          {pagado && periodo.pagadoAt
                            ? ` · ${t("Pagado el")} ${fechaCorta(periodo.pagadoAt)}`
                            : ""}
                        </p>
                        {periodo.nota && (
                          <p className="mt-1 text-xs text-muted">
                            {t("Nota:")} {periodo.nota}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                        <EstadoCuotaBadge
                          periodo={periodo}
                          hoy={hoy}
                          diasGracia={config.diasGracia}
                        />
                        {periodo.revisar && (
                          <span className="rounded-full border border-accent/40 bg-accent/15 px-2 py-1 text-[10px] font-semibold text-ink">
                            {t("Revisar")}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {!pagado && !regalo && (
                        <button
                          type="button"
                          onClick={() => onPago(periodo.id)}
                          className="inline-flex h-9 items-center rounded-full bg-primary px-3 text-xs font-semibold text-ink transition-colors hover:bg-primary/90"
                        >
                          {t("Registrar pago")}
                        </button>
                      )}
                      {regalo && (
                        <span className="text-xs font-medium text-muted">
                          {t("Mes de regalo, no se cobra.")}
                        </span>
                      )}
                      {pagado && (
                        <button
                          type="button"
                          disabled={trabajando}
                          onClick={() => deshacerPago(periodo)}
                          className="inline-flex h-9 items-center rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-muted transition-colors hover:bg-cream hover:text-ink disabled:opacity-50"
                        >
                          {t("Deshacer pago")}
                        </button>
                      )}
                      {((!pagado && !regalo) || periodo.revisar) && (
                        <button
                          type="button"
                          disabled={trabajando}
                          onClick={() => alternarRevisar(periodo)}
                          className={cn(
                            "inline-flex h-9 items-center rounded-full border px-3 text-xs font-semibold transition-colors disabled:opacity-50",
                            periodo.revisar
                              ? "border-accent/40 bg-accent/15 text-ink hover:bg-accent/20"
                              : "border-ink/15 bg-white text-muted hover:bg-cream hover:text-ink"
                          )}
                        >
                          {periodo.revisar ? t("Quitar revisar") : t("Marcar para revisar")}
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {error && (
          <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 pt-4">
          <button
            type="button"
            disabled={trabajando}
            onClick={quitarMembresia}
            className="inline-flex h-9 items-center rounded-full border border-danger/25 bg-danger/5 px-3 text-xs font-semibold text-danger transition-colors hover:bg-danger/10 disabled:opacity-50"
          >
            {t("Quitar membresía")}
          </button>
          <p className="text-xs text-muted">
            {t("La clienta sigue acumulando sellos en su tarjeta regular.")}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function ConfirmarRecordatorio({
  cantidad,
  enviando,
  onClose,
  onConfirm,
}: {
  cantidad: number;
  enviando: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useT();
  return (
    <Modal
      titulo={t("Recordar a pendientes")}
      onClose={onClose}
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="subtle" onClick={onClose} disabled={enviando}>
            {t("Cancelar")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={enviando || cantidad === 0}>
            {enviando ? t("Enviando…") : t("Enviar recordatorios")}
          </Button>
        </div>
      }
    >
      <p className="text-sm leading-6 text-muted">
        {t("Se enviará un correo a")}{" "}
        <strong className="text-ink">
          {cantidad} {cantidad === 1 ? t("clienta") : t("clientas")}
        </strong>{" "}
        {t("con cuotas pendientes y correo cargado.")}
      </p>
      <p className="mt-3 rounded-lg bg-cream/70 px-4 py-3 text-xs text-muted">
        {t("Se manda un solo recordatorio por clienta, por la cuota más vieja pendiente.")}
      </p>
    </Modal>
  );
}

export default function MiembrosPanel({
  miembros,
  config,
  hoy,
  setupError,
}: {
  miembros: MiembroMembresia[];
  config: ConfigMembresia;
  hoy: string;
  setupError: string | null;
}) {
  const t = useT();
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");
  const [montoDefecto, setMontoDefecto] = useState(String(config.monto));
  const [guardandoMonto, setGuardandoMonto] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(
    null
  );
  const [pago, setPago] = useState<{
    miembro: MiembroMembresia;
    periodoId?: string;
  } | null>(null);
  const [detalle, setDetalle] = useState<MiembroMembresia | null>(null);
  const [confirmarRecordatorio, setConfirmarRecordatorio] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [recordandoId, setRecordandoId] = useState<string | null>(null);

  const resumen = useMemo(() => {
    const alDia = miembros.filter((miembro) => miembro.estado === "al_dia").length;
    const revisar = miembros.filter((miembro) => miembro.revisar).length;
    const porCobrar = miembros.reduce(
      (total, miembro) => total + miembro.porCobrar,
      0
    );
    const cuotasPendientes = miembros.reduce(
      (total, miembro) => total + miembro.adeudos,
      0
    );
    const cobradoMes = miembros.reduce(
      (total, miembro) => total + miembro.cobradoMes,
      0
    );
    const pagosMes = miembros.reduce(
      (total, miembro) => total + miembro.pagosMes,
      0
    );

    return {
      total: miembros.length,
      alDia,
      revisar,
      porCobrar,
      cuotasPendientes,
      cobradoMes,
      pagosMes,
    };
  }, [miembros]);

  const recordables = useMemo(
    () =>
      miembros.filter(
        (miembro) =>
          Boolean(miembro.periodoPendiente) &&
          CORREO_VALIDO.test(miembro.correo)
      ),
    [miembros]
  );

  const filtrados = useMemo(() => {
    const texto = normalizar(busqueda);

    return miembros
      .filter((miembro) => {
        if (texto) {
          const contenido = normalizar(
            `${miembro.nombre} ${miembro.codigo} ${miembro.correo}`
          );
          if (!contenido.includes(texto)) return false;
        }

        switch (filtro) {
          case "al_dia":
            return miembro.estado === "al_dia";
          case "pendientes":
            return (
              miembro.estado === "pendiente" || miembro.estado === "vencido"
            );
          case "vencidos":
            return miembro.estado === "vencido";
          case "revisar":
            return miembro.revisar;
          default:
            return true;
        }
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [miembros, busqueda, filtro]);

  function abrirPago(miembro: MiembroMembresia, periodoId?: string) {
    setDetalle(null);
    setPago({ miembro, periodoId });
  }

  function pagoGuardado() {
    setPago(null);
    setAviso({ tipo: "ok", texto: t("Pago registrado.") });
    router.refresh();
  }

  async function guardarMonto() {
    const montoNumero = Number(montoDefecto.replace(",", "."));
    if (!Number.isFinite(montoNumero) || montoNumero < 0) {
      setAviso({ tipo: "error", texto: t("El monto debe ser mayor o igual a 0.") });
      return;
    }

    setGuardandoMonto(true);
    setAviso(null);

    const { error } = await supabase
      .from("config")
      .update({ membresia_monto: montoNumero })
      .eq("id", 1);

    if (error) {
      console.error("[miembros:config]", error.code, error.message);
      setAviso({
        tipo: "error",
        texto: t("No se pudo guardar el monto. Intentá de nuevo."),
      });
      setGuardandoMonto(false);
      return;
    }

    setGuardandoMonto(false);
    setAviso({ tipo: "ok", texto: t("Monto guardado.") });
    router.refresh();
  }

  async function enviarRecordatorio(miembro: MiembroMembresia) {
    const periodo = miembro.periodoPendiente;
    if (!periodo) return;

    if (!CORREO_VALIDO.test(miembro.correo)) {
      setAviso({
        tipo: "error",
        texto: t("La clienta no tiene un correo válido."),
      });
      return;
    }

    setRecordandoId(miembro.id);
    setAviso(null);

    try {
      const respuesta = await fetch("/api/miembros/recordatorio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ periodoIds: [periodo.id] }),
      });
      const data = (await respuesta.json().catch(() => null)) as
        | {
            ok?: boolean;
            mensaje?: string;
            enviados?: number;
            errores?: Array<{ mensaje?: string }>;
          }
        | null;

      if (!respuesta.ok || !data?.ok) {
        throw new Error(data?.mensaje ?? `Error ${respuesta.status}`);
      }

      if (data.errores?.length) {
        setAviso({
          tipo: "error",
          texto: data.errores[0]?.mensaje ?? t("No se pudo enviar el recordatorio."),
        });
      } else {
        setAviso({
          tipo: "ok",
          texto: `${t("Recordatorio enviado a")} ${miembro.correo}`,
        });
      }
      router.refresh();
    } catch (error) {
      setAviso({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : t("No se pudo enviar el recordatorio."),
      });
    } finally {
      setRecordandoId(null);
    }
  }

  async function enviarRecordatoriosPendientes() {
    if (recordables.length === 0) return;

    const ids = recordables
      .map((miembro) => miembro.periodoPendiente?.id)
      .filter((id): id is string => Boolean(id));
    const lotes: string[][] = [];
    for (let i = 0; i < ids.length; i += MAXIMO_RECORDATORIOS) {
      lotes.push(ids.slice(i, i + MAXIMO_RECORDATORIOS));
    }

    setEnviando(true);
    setAviso(null);

    try {
      let enviados = 0;
      let omitidos = 0;
      const errores: Array<{ mensaje?: string }> = [];

      for (const lote of lotes) {
        const respuesta = await fetch("/api/miembros/recordatorio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ periodoIds: lote }),
        });
        const data = (await respuesta.json().catch(() => null)) as
          | {
              ok?: boolean;
              mensaje?: string;
              enviados?: number;
              omitidos?: number;
              errores?: Array<{ mensaje?: string }>;
            }
          | null;

        if (!respuesta.ok || !data?.ok) {
          throw new Error(data?.mensaje ?? `Error ${respuesta.status}`);
        }

        enviados += Number(data.enviados) || 0;
        omitidos += Number(data.omitidos) || 0;
        if (Array.isArray(data.errores)) errores.push(...data.errores);
      }

      const partes = [
        `${t("Se enviaron")} ${enviados} ${enviados === 1 ? t("recordatorio") : t("recordatorios")}.`,
      ];
      if (omitidos > 0) partes.push(`${omitidos} ${t("omitidos")}.`);
      if (errores.length > 0) {
        const primero = errores[0]?.mensaje;
        partes.push(
          `${errores.length} ${t("con error")}${primero ? `: ${primero}` : ""}.`
        );
      }

      setAviso({
        tipo: errores.length > 0 ? "error" : "ok",
        texto: partes.join(" "),
      });
      setConfirmarRecordatorio(false);
      router.refresh();
    } catch (error) {
      setAviso({
        tipo: "error",
        texto:
          error instanceof Error
            ? error.message
            : t("No se pudieron enviar los recordatorios."),
      });
    } finally {
      setEnviando(false);
    }
  }

  function textoCuota(miembro: MiembroMembresia) {
    const cuota = miembro.periodoPendiente ?? miembro.periodoActual;
    if (!cuota) return "—";
    return cuota.estado === "exento"
      ? t("Regalo")
      : formatearMonto(cuota.monto);
  }

  function vencimientoVisible(miembro: MiembroMembresia) {
    return (
      miembro.periodoPendiente?.venceEl ??
      miembro.periodoActual?.venceEl ??
      null
    );
  }

  function mensajeWhatsapp(miembro: MiembroMembresia) {
    const periodo = miembro.periodoPendiente ?? miembro.periodoActual;
    const partes = periodo ? partesMes(periodo.periodo) : null;
    const mes = partes ? `${partes.mes.toLowerCase()} ${partes.anio}` : "del mes";
    const monto = periodo ? formatearMonto(periodo.monto) : formatearMonto(config.monto);
    return `Hola ${miembro.nombre}, te recordamos que la cuota de ${mes} de tu membresía de AfroBroccoli está pendiente (${monto}). Si ya pagaste, ignorá este mensaje. ¡Gracias!`;
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden p-0">
        <div className="bg-ink p-6 text-cream sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mint">
                {t("Membresía mensual")}
              </p>
              <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                {t("Miembros")}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-nav">
                {t("Cuota de")} {formatearMonto(config.monto)} ·{" "}
                {t("vence el")} {config.diaCobro} {t("de cada mes")} ·{" "}
                {config.diasGracia} {t("días de gracia")}.{" "}
                {t("El primer mes de una membresía nueva es de regalo.")}
              </p>
            </div>
            <div className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-nav">
                {t("Cuota por defecto")}
              </p>
              <p className="mt-1 text-xl font-semibold text-cream">
                {formatearMonto(config.monto)}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-3 p-5 sm:p-6">
          <Field label={t("Monto por defecto")} htmlFor="membresia-monto">
            <Input
              id="membresia-monto"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={montoDefecto}
              onChange={(e) => setMontoDefecto(e.target.value)}
              className="w-36"
            />
          </Field>
          <Button
            type="button"
            variant="subtle"
            onClick={guardarMonto}
            disabled={guardandoMonto}
          >
            {guardandoMonto ? t("Guardando…") : t("Guardar monto")}
          </Button>
          <p className="pb-2 text-xs text-muted">
            {t("Se aplica a las cuotas nuevas. Las cuotas ya creadas conservan su monto.")}
          </p>
        </div>
      </Card>

      {setupError && (
        <div className="rounded-card border border-pending/50 bg-pending/10 p-4 text-sm">
          <p className="font-semibold text-ink">
            {t("Falta correr el SQL de Miembros en Supabase.")}
          </p>
          <p className="mt-1 text-muted">
            {t("Ejecutá el archivo supabase/fase-1-miembros.sql en el SQL Editor. Mientras tanto, la página puede quedar en modo lectura.")}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs font-semibold text-ink">
              {t("Detalle técnico")}
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-lg bg-white/60 p-3 text-xs text-muted">
              {setupError}
            </pre>
          </details>
        </div>
      )}

      {aviso && (
        <div
          className={cn(
            "flex items-start justify-between gap-3 rounded-card border px-4 py-3 text-sm",
            aviso.tipo === "ok"
              ? "border-primary/30 bg-primary/10 text-ink"
              : "border-danger/30 bg-danger/10 text-danger"
          )}
          role={aviso.tipo === "error" ? "alert" : "status"}
        >
          <p className="font-medium">{aviso.texto}</p>
          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label={t("Cerrar")}
            className="shrink-0 rounded-full p-1 hover:bg-white/50"
          >
            <IconoCerrar />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <Metrica
          label="Miembros"
          value={resumen.total}
          detalle={`${resumen.alDia} ${t("al día")}`}
        />
        <Metrica
          label="Al día"
          value={resumen.alDia}
          detalle={`${t("de")} ${resumen.total}`}
        />
        <Metrica
          label="Por cobrar"
          value={formatearMonto(resumen.porCobrar)}
          detalle={`${resumen.cuotasPendientes} ${resumen.cuotasPendientes === 1 ? t("cuota pendiente") : t("cuotas pendientes")}`}
        />
        <Metrica
          label="Cobrado este mes"
          value={formatearMonto(resumen.cobradoMes)}
          detalle={`${resumen.pagosMes} ${
            resumen.pagosMes === 1
              ? t("pago registrado")
              : t("pagos registrados")
          }`}
        />
      </div>

      <Card className="p-4 sm:p-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative min-w-0 flex-1 lg:max-w-sm">
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted">
                <IconoBuscar />
              </span>
              <Input
                aria-label={t("Buscar por nombre, código o correo")}
                placeholder={t("Nombre, código o correo")}
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="pl-11"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {FILTROS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={filtro === item.id}
                  onClick={() => setFiltro(item.id)}
                  className={cn(
                    "inline-flex h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors",
                    filtro === item.id
                      ? "border-ink/20 bg-ink text-cream"
                      : "border-ink/15 bg-white text-muted hover:border-ink/30 hover:text-ink"
                  )}
                >
                  {t(item.label)}
                  {item.id === "revisar" && resumen.revisar > 0 && (
                    <span className="rounded-full bg-accent px-1.5 text-[10px] font-bold text-ink">
                      {resumen.revisar}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <Button
              type="button"
              variant="accent"
              className="!h-9 !px-4 text-xs"
              disabled={recordables.length === 0 || enviando}
              onClick={() => setConfirmarRecordatorio(true)}
            >
              {t("Recordar a pendientes")}
              {recordables.length > 0 && (
                <span className="rounded-full bg-ink/10 px-1.5 text-[10px] font-bold">
                  {recordables.length}
                </span>
              )}
            </Button>
          </div>

          {filtrados.length === 0 ? (
            <div className="rounded-xl bg-cream/60 px-5 py-8 text-center">
              <p className="font-semibold text-ink">
                {miembros.length === 0
                  ? t("Todavía no hay miembros.")
                  : t("Ningún miembro coincide con los filtros.")}
              </p>
              <p className="mt-1 text-sm text-muted">
                {miembros.length === 0
                  ? t("Marcá a una clienta como miembro desde Home para empezar.")
                  : t("Probá con otro nombre o limpiá los filtros.")}
              </p>
            </div>
          ) : (
            <>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead>
                    <tr className="border-t border-ink/15 text-[11px] uppercase tracking-wide text-muted">
                      <th className="py-3 pr-4">{t("Miembro")}</th>
                      <th className="py-3 pr-4">{t("Estado")}</th>
                      <th className="py-3 pr-4">{t("Cuota")}</th>
                      <th className="py-3 pr-4">{t("Vence el")}</th>
                      <th className="py-3 pr-4">{t("Último pago")}</th>
                      <th className="py-3 text-right">{t("Acciones")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/10">
                    {filtrados.map((miembro) => {
                      const periodoPago = miembro.periodoPendiente;
                      const puedeRecordar =
                        Boolean(miembro.periodoPendiente) &&
                        CORREO_VALIDO.test(miembro.correo);

                      return (
                        <tr key={miembro.id} className="align-top hover:bg-cream/40">
                          <td className="py-4 pr-4">
                            <p className="font-semibold text-ink">{miembro.nombre}</p>
                            <p className="mt-0.5 text-xs font-medium text-muted">
                              {miembro.codigo}
                            </p>
                            <p className="mt-0.5 break-all text-xs text-muted">
                              {miembro.correo || t("Sin correo cargado")}
                            </p>
                          </td>
                          <td className="py-4 pr-4">
                            <EstadoBadge
                              estado={miembro.estado}
                              revisar={miembro.revisar}
                            />
                            {miembro.adeudos > 1 && (
                              <p className="mt-1 text-[11px] text-muted">
                                {miembro.adeudos} {t("cuotas")}
                              </p>
                            )}
                          </td>
                          <td className="py-4 pr-4 font-medium text-ink">
                            {textoCuota(miembro)}
                          </td>
                          <td className="py-4 pr-4 text-muted">
                            {fechaCorta(vencimientoVisible(miembro))}
                          </td>
                          <td className="py-4 pr-4 text-muted">
                            {miembro.ultimoPago?.pagadoAt
                              ? fechaCorta(miembro.ultimoPago.pagadoAt)
                              : "—"}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              {periodoPago && (
                                <button
                                  type="button"
                                  onClick={() => abrirPago(miembro, periodoPago.id)}
                                  className="inline-flex h-9 items-center rounded-full bg-primary px-3 text-xs font-semibold text-ink transition-colors hover:bg-primary/90"
                                >
                                  {t("Marcar al día")}
                                </button>
                              )}
                              <button
                                type="button"
                                title={t("Enviar recordatorio")}
                                aria-label={t("Enviar recordatorio")}
                                disabled={!puedeRecordar || recordandoId === miembro.id}
                                onClick={() => enviarRecordatorio(miembro)}
                                className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 bg-white text-muted transition-colors hover:bg-cream hover:text-ink disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <IconoCorreo />
                              </button>
                              {miembro.telefono && miembro.periodoPendiente && (
                                <a
                                  href={enlaceWhatsapp(
                                    miembro.telefono,
                                    mensajeWhatsapp(miembro)
                                  )}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={t("Enviar por WhatsApp")}
                                  aria-label={t("Enviar por WhatsApp")}
                                  className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 bg-white text-muted transition-colors hover:bg-cream hover:text-ink"
                                >
                                  <IconoWhatsapp />
                                </a>
                              )}
                              <button
                                type="button"
                                title={t("Ver historial")}
                                aria-label={t("Ver historial")}
                                onClick={() => setDetalle(miembro)}
                                className="grid h-9 w-9 place-items-center rounded-full border border-ink/15 bg-white text-muted transition-colors hover:bg-cream hover:text-ink"
                              >
                                <IconoHistorial />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <ul className="divide-y divide-ink/10 md:hidden">
                {filtrados.map((miembro) => {
                  const periodoPago = miembro.periodoPendiente;
                  const puedeRecordar =
                    Boolean(miembro.periodoPendiente) &&
                    CORREO_VALIDO.test(miembro.correo);

                  return (
                    <li key={miembro.id} className="flex flex-col gap-3 py-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-semibold text-ink">{miembro.nombre}</p>
                          <p className="mt-0.5 text-xs font-medium text-muted">
                            {miembro.codigo}
                          </p>
                          <p className="mt-0.5 break-all text-xs text-muted">
                            {miembro.correo || t("Sin correo cargado")}
                          </p>
                        </div>
                        <EstadoBadge
                          estado={miembro.estado}
                          revisar={miembro.revisar}
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-2 rounded-xl bg-cream/60 p-3 text-xs">
                        <div>
                          <p className="text-muted">{t("Cuota")}</p>
                          <p className="mt-0.5 font-semibold text-ink">
                            {textoCuota(miembro)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted">{t("Vence el")}</p>
                          <p className="mt-0.5 font-semibold text-ink">
                            {fechaCorta(vencimientoVisible(miembro))}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted">{t("Último pago")}</p>
                          <p className="mt-0.5 font-semibold text-ink">
                            {miembro.ultimoPago?.pagadoAt
                              ? fechaCorta(miembro.ultimoPago.pagadoAt)
                              : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {periodoPago && (
                          <button
                            type="button"
                            onClick={() => abrirPago(miembro, periodoPago.id)}
                            className="inline-flex h-9 items-center rounded-full bg-primary px-3 text-xs font-semibold text-ink"
                          >
                            {t("Marcar al día")}
                          </button>
                        )}
                        <button
                          type="button"
                          disabled={!puedeRecordar || recordandoId === miembro.id}
                          onClick={() => enviarRecordatorio(miembro)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-muted disabled:opacity-40"
                        >
                          <IconoCorreo />
                          {t("Recordar")}
                        </button>
                        {miembro.telefono && miembro.periodoPendiente && (
                          <a
                            href={enlaceWhatsapp(
                              miembro.telefono,
                              mensajeWhatsapp(miembro)
                            )}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-muted"
                          >
                            <IconoWhatsapp />
                            WhatsApp
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => setDetalle(miembro)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-muted"
                        >
                          <IconoHistorial />
                          {t("Detalle")}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </Card>

      {pago && (
        <PagoModal
          miembro={pago.miembro}
          periodoId={pago.periodoId}
          config={config}
          hoy={hoy}
          onClose={() => setPago(null)}
          onSaved={pagoGuardado}
        />
      )}

      {detalle && (
        <DetalleModal
          miembro={detalle}
          config={config}
          hoy={hoy}
          onClose={() => setDetalle(null)}
          onPago={(periodoId) => abrirPago(detalle, periodoId)}
          onChanged={(texto, tipo = "ok") => {
            setDetalle(null);
            setAviso({ tipo, texto });
            router.refresh();
          }}
        />
      )}

      {confirmarRecordatorio && (
        <ConfirmarRecordatorio
          cantidad={recordables.length}
          enviando={enviando}
          onClose={() => setConfirmarRecordatorio(false)}
          onConfirm={enviarRecordatoriosPendientes}
        />
      )}
    </div>
  );
}
