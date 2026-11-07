"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { useT } from "@/components/i18n/language-provider";
import type { Cliente } from "@/lib/types";
import { MESES } from "@/lib/fechas";
import { PAISES } from "@/lib/countries";
import { leerConfigTarjeta } from "@/lib/config";
import { nuevoFolio } from "@/lib/premios";

const OPCIONES_PAIS = PAISES.map((p) => ({ value: p.iso, label: p.nombre }));

function IconoEditar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

function IconoBorrar() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 14H6L5 6" />
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

/**
 * Fecha `YYYY-MM-DD` a texto legible ("10 de mayo de 1990"). Se parsea a mano
 * para que la zona horaria no corra el día (una fecha `date` no tiene hora).
 */
function formatearCumpleanos(fecha: string): string | null {
  const [anio, mes, dia] = fecha.slice(0, 10).split("-").map(Number);
  const nombreMes = MESES[mes - 1];
  if (!anio || !nombreMes || !dia) return null;
  return `${dia} de ${nombreMes.toLowerCase()} de ${anio}`;
}

/** Lo mínimo que el modal necesita para editar o borrar un cliente. */
export type ClienteEditable = Pick<
  Cliente,
  | "id"
  | "codigo"
  | "nombre"
  | "correo"
  | "telefonoFormato"
  | "pais"
  | "sellos"
  | "metaSellos"
  | "fechaNacimiento"
>;

// Acciones de admin: editar datos del cliente y eliminarlo
export function AdminAcciones({
  cliente,
  onChanged,
}: {
  cliente: ClienteEditable;
  /** Se dispara al guardar o al borrar, para que quien lo muestra actualice su lista. */
  onChanged?: (accion: "guardar" | "eliminar", clienteId: string) => void;
}) {
  const router = useRouter();
  const t = useT();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState("");

  // La meta es la misma para todos: la tarjeta regular.
  const meta = cliente.metaSellos;

  const [nombre, setNombre] = useState(cliente.nombre);
  const [correo, setCorreo] = useState(cliente.correo);
  const [telefono, setTelefono] = useState(cliente.telefonoFormato);
  const [pais, setPais] = useState<string>(cliente.pais ?? "");
  const [fechaNacimiento, setFechaNacimiento] = useState(cliente.fechaNacimiento ?? "");
  // Texto (no número) para poder borrar el 0 y escribir vacío en el móvil
  const [sellos, setSellos] = useState(String(cliente.sellos));
  // Solo tocamos `sellos` si el admin cambió el campo. Así, editar el nombre o
  // el teléfono no altera por accidente una tarjeta que ya estaba en la meta.
  const [sellosTocados, setSellosTocados] = useState(false);

  const cumpleanosFormateado = fechaNacimiento ? formatearCumpleanos(fechaNacimiento) : null;

  function limitar(valor: string) {
    const n = Number(valor);
    if (Number.isNaN(n)) return "0";
    return String(Math.max(0, Math.min(meta, Math.floor(n))));
  }

  async function guardar() {
    setGuardando(true);
    setAviso("");
    const cantidad = Number(limitar(sellos));
    const datos = { nombre, email: correo, telefono, pais };

    const { error } = await supabase
      .from("clientes")
      .update({ ...datos, cumpleanos: fechaNacimiento || null })
      .eq("id", cliente.id);

    if (error) {
      setAviso(t("No se pudieron guardar los cambios. Intentá de nuevo."));
      setGuardando(false);
      return;
    }

    // Misma regla que el escáner: si el admin carga la meta, el ciclo se cierra.
    // Se genera un premio pendiente y el contador vuelve a 0. Si el campo no se
    // tocó, no se reescribe el contador (importante para los datos viejos).
    if (sellosTocados) {
      const completoMeta = meta > 0 && cantidad >= meta;

      if (completoMeta) {
        const { data: pendiente } = await supabase
          .from("premios")
          .select("id")
          .eq("cliente_id", cliente.id)
          .eq("estado", "pendiente")
          .limit(1)
          .maybeSingle();

        // Si ya hay un premio pendiente no duplicamos; solo reiniciamos.
        if (!pendiente) {
          const config = await leerConfigTarjeta(supabase);
          const folio = nuevoFolio(cliente.codigo || cliente.id);
          const { error: errPremio } = await supabase.from("premios").insert({
            cliente_id: cliente.id,
            folio,
            recompensa: config.recompensa,
            meta,
            // El premio es de la tarjeta regular; la membresía no cambia el ciclo.
            membresia: false,
          });

          if (errPremio) {
            console.error("[premio:admin]", errPremio.code, errPremio.message);
            setAviso(
              t("Los datos se guardaron, pero no se pudo generar el premio. Los sellos no se modificaron.")
            );
            setGuardando(false);
            return;
          }
        }
      }

      const { error: errSellos } = await supabase
        .from("sellos")
        .upsert({
          cliente_id: cliente.id,
          cantidad: completoMeta ? 0 : cantidad,
          updated_at: new Date().toISOString(),
        });

      if (errSellos) {
        console.error("[sellos:admin]", errSellos.code, errSellos.message);
        setAviso(
          t("Los datos se guardaron, pero no se pudieron actualizar los sellos. Intentá de nuevo.")
        );
        setGuardando(false);
        return;
      }
    }

    setGuardando(false);
    setEditando(false);
    onChanged?.("guardar", cliente.id);
    router.refresh();
  }

  async function eliminar() {
    setGuardando(true);
    await supabase.from("clientes").delete().eq("id", cliente.id);
    setGuardando(false);
    setConfirmando(false);
    onChanged?.("eliminar", cliente.id);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => {
            setAviso("");
            setEditando(true);
          }}
          aria-label={`${t("Editar")} ${cliente.nombre}`}
          title={t("Editar")}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-ink/15 text-ink transition-colors hover:border-primary/50 hover:bg-cream"
        >
          <IconoEditar />
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(true)}
          aria-label={`${t("Eliminar")} ${cliente.nombre}`}
          title={t("Eliminar")}
          className="grid h-9 w-9 cursor-pointer place-items-center rounded-full border border-danger/30 text-danger transition-colors hover:bg-danger/10"
        >
          <IconoBorrar />
        </button>
      </div>

      {/* ===== Editar ===== */}
      {editando && (
        // text-left: el modal vive dentro del <td> de Acciones (text-right) y heredaría esa alineación
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/50 text-left"
          onClick={() => setEditando(false)}
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${t("Editar")} ${cliente.nombre}`}
              className="w-full max-w-md rounded-card bg-white p-5 shadow-xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-semibold">{t("Editar cliente")}</h3>
            <p className="mt-1 text-sm text-muted">{t("Los cambios se guardan al instante.")}</p>

            <div className="mt-4 flex items-center gap-3 rounded-xl border border-primary/15 bg-primary/5 px-3.5 py-2.5">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <IconoTorta className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {t("Cumpleaños")}
                </p>
                <p
                  aria-live="polite"
                  className={`truncate text-sm font-medium ${
                    cumpleanosFormateado ? "text-ink" : "text-muted"
                  }`}
                >
                  {cumpleanosFormateado ?? t("Sin fecha cargada")}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-4">
              <Field label={t("Nombre completo")} htmlFor={`nombre-${cliente.id}`}>
                <Input id={`nombre-${cliente.id}`} value={nombre} onChange={(e) => setNombre(e.target.value)} />
              </Field>
              <Field label={t("Correo electrónico")} htmlFor={`correo-${cliente.id}`}>
                <Input id={`correo-${cliente.id}`} type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
              </Field>
              <Field label={t("Teléfono")} htmlFor={`tel-${cliente.id}`}>
                <Input id={`tel-${cliente.id}`} type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
              </Field>
              <Field label={t("País")}>
                <SelectMenu
                  label={t("País")}
                  value={pais}
                  onChange={setPais}
                  searchable
                  options={OPCIONES_PAIS}
                />
              </Field>
              <Field label={t("Fecha de nacimiento")} htmlFor={`nacimiento-${cliente.id}`}>
                <Input
                  id={`nacimiento-${cliente.id}`}
                  type="date"
                  value={fechaNacimiento}
                  onChange={(e) => setFechaNacimiento(e.target.value)}
                />
                <span className="text-xs font-normal text-muted">
                  {t("Opcional. Se usa para el filtro y las notificaciones de cumpleaños.")}
                </span>
              </Field>
              <Field label={t("Sellos acumulados")} htmlFor={`sellos-${cliente.id}`}>
                <Input
                  id={`sellos-${cliente.id}`}
                  inputMode="numeric"
                  value={sellos}
                  onChange={(e) => {
                    setSellosTocados(true);
                    setSellos(e.target.value.replace(/[^\d]/g, ""));
                  }}
                  onBlur={() => setSellos((v) => limitar(v))}
                />
                <span className="text-xs font-normal text-muted">
                  {t("Máximo")} {meta} {t("sellos")} ({t("meta definida en Configuración")}).{" "}
                  {t("Si ponés la meta, se genera un premio pendiente y el contador vuelve a 0.")}
                </span>
              </Field>
            </div>

            {aviso && (
              <p className="mt-4 rounded-lg bg-pending/20 px-4 py-3 text-sm font-medium text-ink">
                {aviso}
              </p>
            )}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="subtle" onClick={() => setEditando(false)}>{t("Cancelar")}</Button>
              <Button onClick={guardar} disabled={guardando}>
                {guardando ? t("Guardando…") : t("Guardar cambios")}
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* ===== Confirmar borrado ===== */}
      {confirmando && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto overscroll-contain bg-ink/50 text-left"
          onClick={() => setConfirmando(false)}
        >
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
            <div
              role="alertdialog"
              aria-modal="true"
              aria-label={t("Eliminar cliente")}
              className="w-full max-w-md rounded-card bg-white p-5 shadow-xl sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
            <h3 className="text-lg font-semibold">{t("Eliminar cliente")}</h3>
            <p className="mt-2 text-sm text-muted">
              {t("Vas a eliminar a")}{" "}
              <span className="font-semibold text-ink">{cliente.nombre}</span>{" "}
              {t("junto con su historial de visitas y sellos. Esta acción no se puede deshacer.")}
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="subtle" onClick={() => setConfirmando(false)}>{t("Cancelar")}</Button>
              <Button
                onClick={eliminar}
                disabled={guardando}
                className="!bg-danger !text-white hover:!bg-danger/90"
              >
                {guardando ? t("Eliminando…") : t("Sí, eliminar")}
              </Button>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
}