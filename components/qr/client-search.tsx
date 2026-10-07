"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/use-usuario";
import { ToggleMembresia } from "@/components/home/toggle-membresia";

type Resultado = { id: string; nombre: string; correo: string; telefono: string; membresia: boolean };

export function ClientSearch() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscado, setBuscado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const { usuario } = useUsuario();
  const esAdmin = usuario?.role === "admin";

  async function buscar() {
    const q = query.trim();
    setBuscado(true);
    if (!q) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    const { data } = await supabase
      .from("clientes")
      .select("id, nombre, email, telefono, membresia")
      .or(`nombre.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`)
      .limit(10);
    setResultados(
      (data ?? []).map((c) => ({ id: c.id, nombre: c.nombre, correo: c.email ?? "", telefono: c.telefono ?? "", membresia: c.membresia }))
    );
    setBuscando(false);
  }

  return (
    <Card className="flex flex-col gap-3 p-6">
      <h2 className="mb-0 flex items-center gap-3 text-lg font-semibold">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gold text-ink">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        Búsqueda manual de clientes
      </h2>

      <form
         className="flex min-w-0 gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          buscar();
        }}
      >
        <Input
          className="min-w-0 flex-1"
          placeholder="Buscar por nombre, teléfono o correo"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={buscando} className="!h-11 whitespace-nowrap">
          {buscando ? "Buscando…" : "Buscar"}
        </Button>
      </form>

      {buscado && resultados.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No se encontraron clientes para "{query}". Verificá el nombre, teléfono o correo.
        </p>
      )}

      {resultados.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/5">
          {resultados.map((c) => (
            <li key={`${c.nombre}-${c.telefono}`} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{c.nombre}</p>
                <p className="text-xs text-muted">{c.correo} · {c.telefono}</p>
              </div>
              <div className="flex items-center gap-2">
                {esAdmin && (
                  <ToggleMembresia
                    clienteId={c.id}
                    membresia={c.membresia}
                    onChanged={() =>
                      setResultados((prev) =>
                        prev.map((r) => (r.id === c.id ? { ...r, membresia: !r.membresia } : r))
                      )
                    }
                  />
                )}
                <a
                  href={`https://wa.me/${c.telefono}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  WhatsApp
                </a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
