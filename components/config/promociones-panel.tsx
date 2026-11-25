"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useT } from "@/components/i18n/language-provider";
import { cn } from "@/lib/utils";
import { fechaCorta } from "@/lib/miembros";
import {
  fechaLarga,
  MAX_DESTINATARIOS,
  type Campana,
  type ErrorCampana,
  type MiembroPromocion,
} from "@/lib/campanas";

// ============================================================================
// Página de Promociones (Fase 2)
//
// Solo la usa el admin. Acá se redacta una campaña, se ve la vista previa y
// se manda a los miembros que tengan correo y no estén dados de baja. Los
// destinatarios se leen en el cliente y el envío real vive en
// /api/miembros/promocion, que valida el rol en el servidor.
// ============================================================================

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Formulario = {
  asunto: string;
  titulo: string;
  mensaje: string;
  vigenteHasta: string;
};

const FORMULARIO_VACIO: Formulario = {
  asunto: "",
  titulo: "",
  mensaje: "",
  vigenteHasta: "",
};

type Aviso = {
  tipo: "ok" | "error" | "info";
  texto: string;
};

type RespuestaEnvio = {
  ok?: boolean;
  mensaje?: string;
  enviados?: number;
  omitidos?: number;
  sinCorreo?: number;
  optOut?: number;
  errores?: ErrorCampana[];
  aviso?: string;
};

function Banner({ aviso, onClose }: { aviso: Aviso; onClose: () => void }) {
  const t = useT();

  return (
    <div
      role={aviso.tipo === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm",
        aviso.tipo === "ok" && "border-primary/30 bg-primary/10 text-ink",
        aviso.tipo === "error" && "border-danger/30 bg-danger/10 text-danger",
        aviso.tipo === "info" && "border-pending/40 bg-pending/10 text-ink"
      )}
    >
      <p className="min-w-0">{aviso.texto}</p>
      <button
        type="button"
        onClick={onClose}
        aria-label={t("Cerrar")}
        className="shrink-0 rounded-full px-1 opacity-70 transition-opacity hover:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

function ConfirmarEnvioModal({
  asunto,
  titulo,
  cantidad,
  enviando,
  onClose,
  onConfirm,
}: {
  asunto: string;
  titulo: string;
  cantidad: number;
  enviando: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useT();

  return (
    <Modal
      titulo={t("Enviar promoción")}
      subtitulo={`${cantidad} ${cantidad === 1 ? t("miembro") : t("miembros")}`}
      onClose={() => {
        if (!enviando) onClose();
      }}
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="subtle"
            onClick={onClose}
            disabled={enviando}
          >
            {t("Cancelar")}
          </Button>
          <Button type="button" onClick={onConfirm} disabled={enviando}>
            {enviando ? t("Enviando…") : t("Sí, enviar")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-cream/70 p-4">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-muted">{t("Asunto")}</dt>
              <dd className="font-semibold text-ink">{asunto}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("Título")}</dt>
              <dd className="font-semibold text-ink">{titulo}</dd>
            </div>
            <div>
              <dt className="text-muted">{t("Destinatarios")}</dt>
              <dd className="font-semibold text-ink">
                {cantidad} {cantidad === 1 ? t("miembro") : t("miembros")}
              </dd>
            </div>
          </dl>
        </div>
        <p className="text-sm leading-6 text-muted">
          {t(
            "No se puede deshacer. Revisá la vista previa antes de enviar."
          )}
        </p>
      </div>
    </Modal>
  );
}

function CampanaDetalleModal({
  campana,
  onClose,
  onReutilizar,
}: {
  campana: Campana;
  onClose: () => void;
  onReutilizar: () => void;
}) {
  const t = useT();

  return (
    <Modal
      titulo={campana.asunto}
      subtitulo={`${fechaCorta(campana.enviadaAt)} · ${campana.enviados} ${
        campana.enviados === 1 ? t("enviado") : t("enviados")
      }`}
      onClose={onClose}
      ancho="max-w-2xl"
      footer={
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="button" variant="subtle" onClick={onClose}>
            {t("Cerrar")}
          </Button>
          <Button type="button" onClick={onReutilizar}>
            {t("Reutilizar")}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-xl bg-cream/70 p-4">
          <div className="flex flex-wrap gap-3 text-xs text-muted">
            <span>
              {t("Enviados:")} <strong className="text-ink">{campana.enviados}</strong>
            </span>
            <span>
              {t("Omitidos:")} <strong className="text-ink">{campana.omitidos}</strong>
            </span>
            <span>
              {t("Con error:")}{" "}
              <strong className="text-ink">{campana.errores.length}</strong>
            </span>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("Título")}
          </p>
          <p className="mt-1 text-base font-semibold text-ink">{campana.titulo}</p>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("Mensaje")}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">
            {campana.mensaje}
          </p>
        </div>

        {campana.vigenteHasta && (
          <p className="text-sm text-muted">
            {t("Válida hasta el")}{" "}
            <strong className="text-ink">{fechaLarga(campana.vigenteHasta)}</strong>
          </p>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            {t("Errores")}
          </p>
          {campana.errores.length === 0 ? (
            <p className="mt-1 text-sm text-muted">{t("No hubo errores.")}</p>
          ) : (
            <ul className="mt-2 divide-y divide-ink/10 rounded-lg border border-ink/10">
              {campana.errores.map((error, indice) => (
                <li key={`${error.correo}-${indice}`} className="px-3 py-2 text-xs">
                  <p className="font-semibold text-ink">
                    {error.nombre || error.correo || t("Miembro")}
                  </p>
                  <p className="mt-0.5 text-danger">{error.mensaje}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default function PromocionesPanel({
  miembros,
  campanas,
  setupError,
  hoy,
  onRefresh,
}: {
  miembros: MiembroPromocion[];
  campanas: Campana[];
  setupError: string | null;
  hoy: string;
  onRefresh: () => void;
}) {
  const t = useT();

  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [errorForm, setErrorForm] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [confirmar, setConfirmar] = useState(false);
  const [detalle, setDetalle] = useState<Campana | null>(null);
  const enviandoRef = useRef(false);

  const destinatarios = useMemo(
    () =>
      miembros.filter(
        (miembro) =>
          !miembro.optOut &&
          Boolean(miembro.codigo) &&
          CORREO_VALIDO.test(miembro.correo)
      ),
    [miembros]
  );

  const sinCorreo = useMemo(
    () =>
      miembros.filter(
        (miembro) =>
          !Boolean(miembro.codigo) || !CORREO_VALIDO.test(miembro.correo)
      ).length,
    [miembros]
  );

  const optOut = useMemo(
    () => miembros.filter((miembro) => miembro.optOut).length,
    [miembros]
  );

  const nombreEjemplo = destinatarios[0]?.nombre ?? t("Cliente");
  const formularioValido =
    formulario.asunto.trim().length >= 3 &&
    formulario.titulo.trim().length >= 3 &&
    formulario.mensaje.trim().length >= 10;

  const puedeProbar = !setupError && !enviando && formularioValido;
  const puedeEnviar =
    puedeProbar &&
    destinatarios.length > 0 &&
    destinatarios.length <= MAX_DESTINATARIOS;

  function actualizar(campo: keyof Formulario, valor: string) {
    setFormulario((previo) => ({ ...previo, [campo]: valor }));
    setErrorForm("");
    setAviso(null);
  }

  function limpiar() {
    setFormulario(FORMULARIO_VACIO);
    setErrorForm("");
    setAviso(null);
  }

  function reutilizar(campana: Campana) {
    setFormulario({
      asunto: campana.asunto,
      titulo: campana.titulo,
      mensaje: campana.mensaje,
      vigenteHasta:
        campana.vigenteHasta && campana.vigenteHasta >= hoy
          ? campana.vigenteHasta
          : "",
    });
    setDetalle(null);
    setErrorForm("");
    setAviso({ tipo: "info", texto: t("Campaña cargada en el compositor.") });
    const reducirMovimiento = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    document.getElementById("compositor-promocion")?.scrollIntoView({
      behavior: reducirMovimiento ? "auto" : "smooth",
      block: "start",
    });
  }

  async function enviar(prueba: boolean) {
    if (setupError || enviandoRef.current) return;

    if (!formularioValido) {
      setErrorForm(t("Completá asunto, título y mensaje antes de enviar."));
      setConfirmar(false);
      return;
    }

    if (!prueba && destinatarios.length === 0) {
      setErrorForm(t("No hay miembros con correo válido para enviar."));
      setConfirmar(false);
      return;
    }

    if (!prueba && destinatarios.length > MAX_DESTINATARIOS) {
      setErrorForm(
        `${t("Por ahora se pueden enviar hasta")} ${MAX_DESTINATARIOS} ${t(
          "miembros por campaña."
        )}`
      );
      setConfirmar(false);
      return;
    }

    enviandoRef.current = true;
    setEnviando(true);
    setErrorForm("");
    setAviso(null);

    try {
      const respuesta = await fetch("/api/miembros/promocion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          asunto: formulario.asunto,
          titulo: formulario.titulo,
          mensaje: formulario.mensaje,
          vigenteHasta: formulario.vigenteHasta || null,
          prueba,
        }),
      });

      const data = (await respuesta
        .json()
        .catch(() => null)) as RespuestaEnvio | null;

      if (!respuesta.ok || !data?.ok) {
        setAviso({
          tipo: "error",
          texto: data?.mensaje ?? t("No se pudo enviar la promoción."),
        });
        setConfirmar(false);
        return;
      }

      if (prueba) {
        setAviso({
          tipo: "ok",
          texto: t("Correo de prueba enviado a tu correo."),
        });
        return;
      }

      const enviados = Number(data.enviados) || 0;
      const omitidos = Number(data.omitidos) || 0;
      const errores = Array.isArray(data.errores) ? data.errores : [];

      const partes = [
        `${enviados} ${
          enviados === 1 ? t("correo enviado") : t("correos enviados")
        }`,
      ];
      if (omitidos > 0) partes.push(`${omitidos} ${t("omitidos")}`);
      if (errores.length > 0) partes.push(`${errores.length} ${t("con error")}`);

      setAviso({
        tipo: errores.length > 0 ? "info" : "ok",
        texto: `${t("Campaña enviada:")} ${partes.join(" · ")}.${
          data.aviso ? ` ${data.aviso}` : ""
        }`,
      });
      setFormulario(FORMULARIO_VACIO);
      setConfirmar(false);
      onRefresh();
    } catch (err) {
      console.error("[promociones:enviar]", err);
      setAviso({
        tipo: "error",
        texto: t("No se pudo conectar con el servidor. Intentá de nuevo."),
      });
      setConfirmar(false);
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <Card className="overflow-hidden p-0">
        <div className="bg-ink p-6 text-cream sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-mint">
            {t("Campañas para miembros")}
          </p>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
            {t("Promociones")}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-nav">
            {t(
              "Escribí una promoción del mes y enviála por correo a tus miembros."
            )}
          </p>
        </div>
      </Card>

      {setupError && (
        <div className="rounded-xl border border-danger/25 bg-danger/5 p-4 text-sm text-danger">
          <p className="font-semibold">
            {t("Falta correr el SQL de Promociones en Supabase.")}
          </p>
          <p className="mt-1 text-xs">
            {t("Mientras tanto, el envío está desactivado.")}
          </p>
          <details className="mt-2 text-xs">
            <summary className="cursor-pointer font-medium">
              {t("Detalle técnico")}
            </summary>
            <p className="mt-1 break-words opacity-80">{setupError}</p>
          </details>
        </div>
      )}

      {aviso && <Banner aviso={aviso} onClose={() => setAviso(null)} />}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <Card id="compositor-promocion" className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink">
                {t("Enviar promoción")}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {t("El correo saluda con el nombre de cada clienta.")}
              </p>
            </div>
            <button
              type="button"
              onClick={limpiar}
              className="text-xs font-semibold text-muted transition-colors hover:text-ink"
            >
              {t("Limpiar")}
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-4">
            <Field label={t("Asunto")} htmlFor="promo-asunto">
              <Input
                id="promo-asunto"
                value={formulario.asunto}
                onChange={(evento) =>
                  actualizar("asunto", evento.target.value)
                }
                maxLength={140}
                placeholder={t("Ej.: 20% en tu próximo servicio")}
              />
            </Field>

            <Field label={t("Título de la promoción")} htmlFor="promo-titulo">
              <Input
                id="promo-titulo"
                value={formulario.titulo}
                onChange={(evento) =>
                  actualizar("titulo", evento.target.value)
                }
                maxLength={120}
                placeholder={t("Ej.: 20% de descuento para miembros")}
              />
            </Field>

            <Field label={t("Mensaje")} htmlFor="promo-mensaje">
              <Textarea
                id="promo-mensaje"
                value={formulario.mensaje}
                onChange={(evento) =>
                  actualizar("mensaje", evento.target.value)
                }
                rows={8}
                maxLength={4000}
                placeholder={t(
                  "Escribí el mensaje que van a recibir tus miembros."
                )}
              />
            </Field>

            <div className="flex flex-wrap items-end justify-between gap-3">
              <div className="w-full max-w-[220px]">
                <Field
                  label={`${t("Válida hasta")} ${t("(opcional)")}`}
                  htmlFor="promo-vigencia"
                >
                  <Input
                    id="promo-vigencia"
                    type="date"
                    min={hoy}
                    value={formulario.vigenteHasta}
                    onChange={(evento) =>
                      actualizar("vigenteHasta", evento.target.value)
                    }
                  />
                </Field>
              </div>
              <p className="max-w-md text-xs leading-5 text-muted">
                {t(
                  "No hace falta saludar: el correo ya incluye el nombre de la clienta."
                )}
              </p>
            </div>

            <div className="rounded-xl bg-cream/70 p-4">
              <p className="text-sm font-semibold text-ink">
                {t("Destinatarios")}
              </p>
              <p className="mt-1 text-sm text-muted">
                {t("Se enviará a")}{" "}
                <strong className="text-ink">{destinatarios.length}</strong>{" "}
                {t("miembros con correo válido.")}
              </p>
              <p className="mt-1 text-xs text-muted">
                {sinCorreo} {t("sin correo")} · {optOut} {t("dados de baja")}
              </p>
              {destinatarios.length > MAX_DESTINATARIOS && (
                <p className="mt-2 text-xs font-medium text-danger">
                  {t("Por ahora se pueden enviar hasta")} {MAX_DESTINATARIOS}{" "}
                  {t("miembros por campaña.")}
                </p>
              )}
              {miembros.length === 0 && (
                <p className="mt-2 text-xs text-muted">
                  {t("Todavía no hay miembros.")}
                </p>
              )}
            </div>

            {errorForm && (
              <p className="text-sm font-medium text-danger">{errorForm}</p>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                variant="subtle"
                onClick={() => enviar(true)}
                disabled={!puedeProbar}
              >
                {t("Enviar prueba a mi correo")}
              </Button>
              <Button
                type="button"
                onClick={() => setConfirmar(true)}
                disabled={!puedeEnviar}
              >
                {t("Enviar a miembros")}
              </Button>
              {enviando && (
                <span className="text-xs text-muted">{t("Enviando…")}</span>
              )}
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-5 xl:sticky xl:top-6">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-ink">
                {t("Vista previa")}
              </h3>
              <p className="mt-0.5 text-xs text-muted">
                {t("Así lo va a ver la clienta")}
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-ink/15 bg-white shadow-sm">
            <div className="bg-ink px-5 py-6 text-center">
              <p className="font-script text-2xl text-cream">AfroBroccoli</p>
              <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
                {t("Promoción para miembros")}
              </p>
            </div>
            <div className="p-5">
              <p className="text-sm text-muted">
                {t("Hola")}{" "}
                <strong className="text-ink">{nombreEjemplo}</strong>,
              </p>
              <h4 className="mt-3 font-serif text-xl font-semibold leading-tight text-ink">
                {formulario.titulo || t("Título de la promoción")}
              </h4>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                {formulario.mensaje || t("Tu mensaje aparecerá acá.")}
              </p>

              {formulario.vigenteHasta && fechaLarga(formulario.vigenteHasta) && (
                <div className="mt-4 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-center text-sm font-semibold text-ink">
                  {t("Válida hasta el")}{" "}
                  {fechaLarga(formulario.vigenteHasta)}
                </div>
              )}

              <div className="mt-5 text-center">
                <span className="inline-flex h-10 items-center rounded-full bg-accent px-5 text-sm font-semibold text-ink">
                  {t("Ver mi tarjeta")}
                </span>
              </div>
            </div>
            <div className="border-t border-ink/10 bg-cream/60 px-5 py-4 text-center text-[11px] leading-5 text-muted">
              {t("Si no querés recibir promociones, avisanos en el salón.")}
            </div>
          </div>
        </Card>

        <Card className="p-5 sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-ink">
                {t("Campañas enviadas")}
              </h3>
              <p className="mt-1 text-sm text-muted">
                {t("Historial de las últimas campañas.")}
              </p>
            </div>
          </div>

          {campanas.length === 0 ? (
            <p className="mt-4 rounded-lg bg-cream/70 px-4 py-3 text-sm text-muted">
              {t("Todavía no enviaste campañas.")}
            </p>
          ) : (
            <ul className="mt-2 divide-y divide-ink/10">
              {campanas.map((campana) => (
                <li
                  key={campana.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">
                      {campana.asunto}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {fechaCorta(campana.enviadaAt)} · {campana.enviados}{" "}
                      {campana.enviados === 1 ? t("enviado") : t("enviados")}
                      {campana.omitidos > 0
                        ? ` · ${campana.omitidos} ${t("omitidos")}`
                        : ""}
                      {campana.errores.length > 0
                        ? ` · ${campana.errores.length} ${t("con error")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setDetalle(campana)}
                      className="inline-flex h-9 items-center rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-muted transition-colors hover:bg-cream hover:text-ink"
                    >
                      {t("Ver")}
                    </button>
                    <button
                      type="button"
                      onClick={() => reutilizar(campana)}
                      className="inline-flex h-9 items-center rounded-full border border-ink/15 bg-white px-3 text-xs font-semibold text-muted transition-colors hover:bg-cream hover:text-ink"
                    >
                      {t("Reutilizar")}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {confirmar && (
        <ConfirmarEnvioModal
          asunto={formulario.asunto}
          titulo={formulario.titulo}
          cantidad={destinatarios.length}
          enviando={enviando}
          onClose={() => {
            if (!enviando) setConfirmar(false);
          }}
          onConfirm={() => enviar(false)}
        />
      )}

      {detalle && (
        <CampanaDetalleModal
          campana={detalle}
          onClose={() => setDetalle(null)}
          onReutilizar={() => reutilizar(detalle)}
        />
      )}
    </div>
  );
}
