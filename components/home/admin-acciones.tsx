"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { SelectMenu } from "@/components/ui/select-menu";
import { useT } from "@/components/i18n/language-provider";
import type { Cliente } from "@/lib/types";
import { PAISES } from "@/lib/countries";

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

// Acciones de admin: editar datos del cliente y eliminarlo
export function AdminAcciones({ cliente, meta }: { cliente: Cliente; meta: number }) {
  const router = useRouter();
  const t = useT();
  const [editando, setEditando] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [nombre, setNombre] = useState(cliente.nombre);
  const [correo, setCorreo] = useState(cliente.correo);
  const [telefono, setTelefono] = useState(cliente.telefonoFormato);
  const [pais, setPais] = useState<string>(cliente.pais ?? "");
  // Texto (no número) para poder borrar el 0 y escribir vacío en el móvil
  const [sellos, setSellos] = useState(String(cliente.sellos));

  function limitar(valor: string) {
    const n = Number(valor);
    if (Number.isNaN(n)) return "0";
    return String(Math.max(0, Math.min(meta, Math.floor(n))));
  }

  async function guardar() {
    setGuardando(true);
    const cantidad = Number(limitar(sellos));
    await supabase
      .from("clientes")
      .update({ nombre, email: correo, telefono, pais })
      .eq("id", cliente.id);
    await supabase
      .from("sellos")
      .upsert({ cliente_id: cliente.id, cantidad, updated_at: new Date().toISOString() });
    setGuardando(false);
    setEditando(false);
    router.refresh();
  }

  async function eliminar() {
    setGuardando(true);
    await supabase.from("clientes").delete().eq("id", cliente.id);
    setGuardando(false);
    setConfirmando(false);
    router.refresh();
  }

  return (
    <>
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setEditando(true)}
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
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4 text-left" onClick={() => setEditando(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`${t("Editar")} ${cliente.nombre}`}
            className="w-full max-w-md rounded-card bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">{t("Editar cliente")}</h3>
            <p className="mt-1 text-sm text-muted">{t("Los cambios se guardan al instante.")}</p>

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
              <Field label={t("Sellos acumulados")} htmlFor={`sellos-${cliente.id}`}>
                <Input
                  id={`sellos-${cliente.id}`}
                  inputMode="numeric"
                  value={sellos}
                  onChange={(e) => setSellos(e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => setSellos((v) => limitar(v))}
                />
                <span className="text-xs font-normal text-muted">
                  {t("Máximo")} {meta} {t("sellos")} ({t("meta definida en Configuración")}).
                </span>
              </Field>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="subtle" onClick={() => setEditando(false)}>{t("Cancelar")}</Button>
              <Button onClick={guardar} disabled={guardando}>
                {guardando ? t("Guardando…") : t("Guardar cambios")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirmar borrado ===== */}
      {confirmando && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 px-4 text-left" onClick={() => setConfirmando(false)}>
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label={t("Eliminar cliente")}
            className="w-full max-w-md rounded-card bg-white p-6 shadow-xl"
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
      )}
    </>
  );
}