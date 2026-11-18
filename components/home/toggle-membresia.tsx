"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/i18n/language-provider";
import { claveDia } from "@/lib/fechas";

// Botón para alternar la membresía de un cliente (solo lo ve el admin)
export function ToggleMembresia({
  clienteId,
  membresia,
  onChanged,
}: {
  clienteId: string;
  membresia: boolean;
  onChanged?: () => void;
}) {
  const router = useRouter();
  const t = useT();
  const [cargando, setCargando] = useState(false);

  async function alternar() {
    setCargando(true);
    const nuevaMembresia = !membresia;
    const { error } = await supabase
      .from("clientes")
      .update({
        membresia: nuevaMembresia,
        membresia_desde: nuevaMembresia ? claveDia() : null,
      })
      .eq("id", clienteId);

    if (error) {
      console.error("[membresia:toggle]", error.code, error.message);
      setCargando(false);
      window.alert(
        t("No se pudo actualizar la membresía. Revisá que el SQL de Miembros esté corrido.")
      );
      return;
    }

    setCargando(false);
    onChanged?.();
    router.refresh();
  }

  return (
    <button
      onClick={alternar}
      disabled={cargando}
      title={
        membresia
          ? t("Quitar membresía (sigue como cliente regular)")
          : t("Hacer miembro (sigue acumulando sellos)")
      }
      className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-50"
    >
      {cargando ? t("Guardando…") : membresia ? t("Quitar membresía") : t("Hacer miembro")}
    </button>
  );
}
