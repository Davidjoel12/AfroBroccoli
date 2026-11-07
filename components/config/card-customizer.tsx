"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/use-usuario";
import { useT } from "@/components/i18n/language-provider";
import { TarjetaCliente } from "@/components/card/tarjeta-cliente";
import {
  guardarConfigTarjeta,
  leerConfigTarjeta,
  normalizarSellos,
  rutaTarjeta,
  METAS,
  type ConfigTarjeta,
} from "@/lib/config";
import { cn } from "@/lib/utils";

const ACENTOS = [
  { nombre: "Rosa", hex: "#FF66C4" },
  { nombre: "Verde", hex: "#6FC22D" },
  { nombre: "Dorado", hex: "#FFD700" },
  { nombre: "Menta", hex: "#85D2CA" },
];

// Datos fijos de la vista previa. El código "AB-0000" no lo genera nunca el
// formulario de registro (que saca entre AB-1000 y AB-9999), así que el QR
// de la vista previa no lleva a ninguna tarjeta real.
const EJEMPLO = { nombre: "Swanny", codigo: "AB-0000", sellos: 2 };

const selectClases =
  "h-11 w-full cursor-pointer rounded-lg border border-ink/20 bg-cream/50 px-3.5 text-ink focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60";

export default function CardCustomizer() {
  const t = useT();
  const [config, setConfig] = useState<ConfigTarjeta | null>(null);
  const [metaInicial, setMetaInicial] = useState<number | null>(null);
  const [guardado, setGuardado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [error, setError] = useState("");
  const { usuario } = useUsuario();
  const esAdmin = usuario?.role === "admin";

  // Cargar la configuración guardada en Supabase
  useEffect(() => {
    (async () => {
      const cargada = await leerConfigTarjeta(supabase);
      setConfig(cargada);
      setMetaInicial(cargada.meta);
    })();
  }, []);

  async function guardar() {
    if (!config) return;
    setError("");
    setAviso("");
    const ok = await guardarConfigTarjeta(supabase, config);
    if (!ok) {
      setGuardado(false);
      setError(t("No se pudieron guardar los cambios. Intentá de nuevo."));
      return;
    }
    setGuardado(true);

    // Si cambió la meta, las tarjetas que ya la superaban quedarían en la
    // meta hasta el próximo escaneo. Se regularizan en el momento: premio
    // pendiente + contador en 0.
    if (metaInicial !== null && config.meta !== metaInicial) {
      const resultado = await normalizarSellos(supabase);
      if (!resultado.ok) {
        setGuardado(false);
        setError(
          t("La tarjeta se guardó, pero no se pudieron regularizar los sellos. Corré el SQL de normalización en Supabase.")
        );
      } else if (resultado.total > 0) {
        setAviso(
          `${resultado.total} ${t("tarjetas regularizadas: sellos en 0 y premios pendientes.")}`
        );
        setMetaInicial(config.meta);
      } else {
        setAviso(t("No había tarjetas en o por encima de la nueva meta."));
        setMetaInicial(config.meta);
      }
    }
  }

  // While loading, show a skeleton-ish preview rather than fake data
  const accent = config?.colorAcento ?? "#FF66C4";
  const meta = config?.meta ?? 5;
  const recompensa = config?.recompensa ?? "1 servicio gratis";

  function actualizar(parcial: Partial<ConfigTarjeta>) {
    setConfig((prev) => (prev ? { ...prev, ...parcial } : prev));
    setGuardado(false);
    setAviso("");
    setError("");
  }

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Controles */}
      <Card>
        <h2 className="text-xl font-semibold">{t("Personalizar tarjeta")}</h2>
        <p className="mb-5 text-sm text-muted">
          {t("Elegí el color de acento y la recompensa de tu programa. Todos los clientes, incluidos los miembros, usan la misma tarjeta de sellos.")}
        </p>

        {guardado && (
          <p className="mb-4 rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
            {t("✅ Tarjeta de cliente actualizada.")}
          </p>
        )}

        {error && (
          <p className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
            {error}
          </p>
        )}

        {aviso && (
          <p className="mb-4 rounded-lg bg-mint/40 px-4 py-3 text-sm font-medium text-ink">
            {aviso}
          </p>
        )}

        <div className="flex flex-col gap-5">
          {!esAdmin && usuario && (
            <p className="rounded-lg bg-pending/15 px-4 py-3 text-sm font-medium">
              {t("Solo el administrador puede modificar la tarjeta. Estás viendo la configuración actual.")}
            </p>
          )}

          <div>
            <p className="mb-2 text-sm font-medium text-muted">{t("Color de acento")}</p>
            <div className="flex gap-3">
              {ACENTOS.map((a) => (
                <button
                  key={a.hex}
                  type="button"
                  aria-label={a.nombre}
                  aria-pressed={accent === a.hex}
                  disabled={!esAdmin}
                  onClick={() => actualizar({ colorAcento: a.hex })}
                  className={cn(
                    "h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60",
                    accent === a.hex && "scale-110 ring-2 ring-ink/40",
                  )}
                  style={{ backgroundColor: a.hex }}
                />
              ))}
            </div>
          </div>

          {/* --- Una sola tarjeta para todos --- */}
          <fieldset
            disabled={!esAdmin}
            className="flex flex-col gap-4 rounded-card bg-cream/60 p-4 disabled:opacity-90"
          >
            <legend className="px-1 text-sm font-semibold text-ink">
              {t("Tarjeta de sellos")}
            </legend>

            <Field label={t("Recompensas")}>
              <Input
                value={recompensa}
                onChange={(e) => actualizar({ recompensa: e.target.value })}
                placeholder={t("Ej. 1 servicio gratis")}
              />
            </Field>

            <Field label={t("Meta de sellos")}>
              <select
                className={selectClases}
                value={String(meta)}
                onChange={(e) => actualizar({ meta: Number(e.target.value) })}
              >
                {METAS.map((m) => (
                  <option key={m} value={m}>
                    {m} {t("sellos")}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>

          <p className="rounded-lg bg-mint/40 px-4 py-3 text-sm text-ink">
            {t("La membresía es una suscripción mensual aparte. Los miembros usan esta misma tarjeta y siguen acumulando sellos.")}
          </p>

          {esAdmin && (
            <Button onClick={guardar} disabled={!config} className="w-full sm:w-auto">
              {t("Guardar y aplicar")}
            </Button>
          )}
        </div>
      </Card>

      {/* Vista previa: exactamente la tarjeta que recibe el cliente */}
      <Card className="flex flex-col items-center gap-4">
        <div className="w-full">
          <h3 className="font-script text-2xl">{t("Así ve su tarjeta el cliente")}</h3>
          <p className="mt-1 text-sm text-muted">
            {t("Es la misma tarjeta que el cliente abre desde el link de WhatsApp.")}
          </p>
        </div>

        <TarjetaCliente
          nombre={EJEMPLO.nombre}
          codigo={EJEMPLO.codigo}
          sellos={EJEMPLO.sellos}
          meta={meta}
          recompensa={recompensa}
          colorAcento={accent}
          url={rutaTarjeta(EJEMPLO.codigo)}
        />

        <p className="text-center text-xs text-muted">
          {t("Tarjeta de ejemplo con datos ficticios. La de cada cliente se arma sola con su nombre, su código y sus sellos.")}
        </p>
      </Card>
    </div>
  );
}