"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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
  const [cargando, setCargando] = useState(false);

  async function alternar() {
    setCargando(true);
    await supabase
      .from("clientes")
      .update({ membresia: !membresia })
      .eq("id", clienteId);
    setCargando(false);
    onChanged?.();
    router.refresh();
  }

  return (
    <button
      onClick={alternar}
      disabled={cargando}
      className="rounded-full border border-ink/15 bg-white px-3 py-1 text-xs font-semibold text-ink transition-colors hover:bg-cream disabled:opacity-50"
    >
      {cargando ? "Guardando…" : membresia ? "Quitar membresía" : "Hacer miembro"}
    </button>
  );
}
