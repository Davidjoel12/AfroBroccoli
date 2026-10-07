"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/use-usuario";
import { cn } from "@/lib/utils";

const ACENTOS = [
  { nombre: "Rosa", hex: "#FF66C4" },
  { nombre: "Verde", hex: "#6FC22D" },
  { nombre: "Dorado", hex: "#FFD700" },
  { nombre: "Menta", hex: "#85D2CA" },
];

const METAS = ["4", "5", "8", "10"];

// Código único del cliente — mock; el backend lo generará por cliente.
const CODIGO_CLIENTE = "AB-0042";
const QR_URL = `https://app.afrobroccoli.com/c/${CODIGO_CLIENTE}`;

export default function CardCustomizer() {
  const [acento, setAcento] = useState(ACENTOS[0].hex);
  const [recompensa, setRecompensa] = useState("1 servicio gratis");
  const [meta, setMeta] = useState("5");
  const [guardado, setGuardado] = useState(false);
  const [qr, setQr] = useState<string>("");
  const { usuario } = useUsuario();
  const esAdmin = usuario?.role === "admin";

  // Cargar la configuración guardada en Supabase
  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("config").select("meta, color_acento, recompensa").eq("id", 1).single();
      if (data) {
        setAcento(data.color_acento);
        setRecompensa(data.recompensa);
        setMeta(String(data.meta));
      }
    })();
  }, []);

  async function guardar() {
    const { error } = await supabase
      .from("config")
      .update({ meta: Number(meta), color_acento: acento, recompensa })
      .eq("id", 1);
    if (!error) setGuardado(true);
  }

  useEffect(() => {
    QRCode.toDataURL(QR_URL, {
      width: 160,
      margin: 1,
      color: { dark: "#221B19", light: "#FFFFFF" },
    })
      .then(setQr)
      .catch(() => setQr(""));
  }, []);

  const sellos = Number(meta);
  const completados = Math.min(3, sellos);

  return (
    <div className="grid gap-5 xl:grid-cols-2">
      {/* Controles */}
      <Card>
        <h2 className="text-xl font-semibold">Personalizar tarjeta</h2>
        <p className="mb-5 text-sm text-muted">
          Elegí el color de acento, la recompensa y la meta de sellos de tu programa.
        </p>

        {guardado && (
          <p className="mb-4 rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
            ✅ Tarjeta de cliente actualizada.
          </p>
        )}

        <div className="flex flex-col gap-5">
          {!esAdmin && usuario && (
            <p className="rounded-lg bg-pending/15 px-4 py-3 text-sm font-medium">
              Solo el administrador puede modificar la tarjeta. Estás viendo la configuración actual.
            </p>
          )}
          <div>
            <p className="mb-2 text-sm font-medium text-muted">Color de acento</p>
            <div className="flex gap-3">
              {ACENTOS.map((a) => (
                <button
                  key={a.hex}
                  aria-label={a.nombre}
                  disabled={!esAdmin}
                  onClick={() => setAcento(a.hex)}
                  className={cn(
                    "h-8 w-8 cursor-pointer rounded-full transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60",
                    acento === a.hex && "scale-110 ring-2 ring-ink/40",
                  )}
                  style={{ backgroundColor: a.hex }}
                />
              ))}
            </div>
          </div>

          <Field label="Recompensas">
            <Input
              value={recompensa}
              disabled={!esAdmin}
              onChange={(e) => setRecompensa(e.target.value)}
              placeholder="Ej. 1 servicio gratis"
            />
            <span className="text-xs font-normal text-muted">
              Aparece en la tarjeta como «por completar {meta} sellos».
            </span>
          </Field>

          <Field label="Meta de sellos">
            <select
              disabled={!esAdmin}
              className="h-11 rounded-lg border border-ink/20 bg-cream/50 px-3.5 text-ink focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
            >
              {METAS.map((m) => (
                <option key={m} value={m}>{m} sellos</option>
              ))}
            </select>
          </Field>

          {esAdmin && (
            <Button onClick={guardar} className="w-full sm:w-auto">
              Guardar y aplicar
            </Button>
          )}
        </div>
      </Card>

      {/* Vista previa */}
      <Card className="flex flex-col items-center justify-center gap-4">
        <h3 className="font-script text-2xl">Vista previa</h3>
        <div
          className="w-full max-w-xs rounded-[20px] p-5 text-cream shadow-xl"
          style={{ backgroundColor: "#221B19" }}
        >
          <div className="mb-3 h-2 w-full rounded-full" style={{ backgroundColor: acento }} />
          <p className="font-script text-3xl leading-tight">AfroBroccoli</p>
          <p className="mt-1 text-sm text-muted-nav">{recompensa}</p>

          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {Array.from({ length: sellos }).map((_, i) => (
              <span
                key={i}
                className="h-4 w-4 rounded-full"
                style={{
                  backgroundColor:
                    i < completados ? acento : "rgba(255,248,238,0.2)",
                }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-nav">Por completar {meta} sellos</p>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-cream/10 pt-3">
            <p className="min-w-0 flex-1 text-[11px] leading-snug text-muted-nav">
              Código único del cliente
              {/* <span className="block font-semibold text-cream">{CODIGO_CLIENTE}</span> */}
            </p>
            <div className="shrink-0 rounded-lg bg-white p-1.5">
              {qr ? (
                <img
                  src={qr}
                  alt={`Código QR único del cliente ${CODIGO_CLIENTE}`}
                  className="h-14 w-14"
                />
              ) : (
                <div className="h-14 w-14 animate-pulse rounded bg-ink/10" />
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
