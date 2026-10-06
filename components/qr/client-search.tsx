"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { clientes } from "@/lib/data";

export function ClientSearch() {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<typeof clientes>([]);
  const [buscado, setBuscado] = useState(false);

  function buscar() {
    const q = query.trim().toLowerCase();
    if (!q) {
      setResultados([]);
      setBuscado(true);
      return;
    }
    setResultados(
      clientes.filter(
        (c) =>
          c.nombre.toLowerCase().includes(q) ||
          c.correo.toLowerCase().includes(q) ||
          c.telefonoFormato.replace(/\s/g, "").includes(q.replace(/\s/g, "")),
      ),
    );
    setBuscado(true);
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
        <Button type="submit" className="!h-11 whitespace-nowrap">Buscar</Button>
      </form>

      {buscado && resultados.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          No se encontraron clientes para "{query}". Verificá el nombre, teléfono o correo.
        </p>
      )}

      {resultados.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/5">
          {resultados.map((c) => (
            <li key={c.correo} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{c.nombre}</p>
                <p className="text-xs text-muted">{c.correo} · {c.telefonoFormato}</p>
              </div>
              <a
                href={`https://wa.me/${c.telefono}`}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-semibold text-primary hover:underline"
              >
                WhatsApp
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
