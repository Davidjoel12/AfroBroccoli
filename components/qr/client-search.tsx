"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/use-usuario";
import { ToggleMembresia } from "@/components/home/toggle-membresia";
import { AdminAcciones, type ClienteEditable } from "@/components/home/admin-acciones";
import { useT } from "@/components/i18n/language-provider";
import {
  enlaceTarjeta,
  enlaceWhatsapp,
  leerConfigTarjeta,
  mensajeTarjeta,
  metaDeCliente,
} from "@/lib/config";

// Lo mismo que trae ClienteEditable (el modal de editar) + lo de la lista.
type Resultado = ClienteEditable & { codigo: string; telefono: string; membresia: boolean };

export function ClientSearch({ origen }: { origen: string }) {
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [buscado, setBuscado] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState("");
  const { usuario } = useUsuario();
  const t = useT();
  const esAdmin = usuario?.role === "admin";

  async function buscar() {
    const q = query.trim();
    setBuscado(true);
    setError("");
    if (!q) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    // La meta de sellos la necesita el modal de editar (es el tope del campo)
    const config = await leerConfigTarjeta(supabase);
    const { data, error } = await supabase
      .from("clientes")
      .select("id, codigo, nombre, email, telefono, pais, membresia, sellos(cantidad)")
      .or(`nombre.ilike.%${q}%,email.ilike.%${q}%,telefono.ilike.%${q}%`)
      .limit(10);

    // Antes `error` se ignoraba y una consulta denegada se veía igual que
    // "no hay resultados". Ahora se distingue.
    if (error) {
      setError(t("No se pudo buscar. Revisá tu conexión e intentá de nuevo."));
      setResultados([]);
      setBuscando(false);
      return;
    }
    setResultados(
      (data ?? []).map((c) => {
        const join = c.sellos as unknown;
        const sellos = Array.isArray(join)
          ? (join[0] as { cantidad: number } | undefined)?.cantidad ?? 0
          : (join as { cantidad: number } | null)?.cantidad ?? 0;
        return {
          id: c.id,
          codigo: c.codigo ?? "",
          nombre: c.nombre,
          correo: c.email ?? "",
          telefono: c.telefono ?? "",
          telefonoFormato: c.telefono ?? "",
          pais: c.pais ?? null,
          sellos,
          metaSellos: metaDeCliente(c.membresia, config),
          membresia: c.membresia,
        };
      })
    );
    setBuscando(false);
  }

  /** Tras editar o borrar, la lista se actualiza sola. */
  function refrescarResultados(accion: "guardar" | "eliminar", clienteId: string) {
    if (accion === "guardar") {
      // El nombre pudo cambiar: re-consultamos con el mismo texto.
      buscar();
    } else {
      // Si lo borramos, sale de la lista sin volver a pegarle a Supabase.
      setResultados((prev) => prev.filter((r) => r.id !== clienteId));
    }
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
        {t("Búsqueda manual de clientes")}
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
          placeholder={t("Buscar por nombre, teléfono o correo")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Button type="submit" disabled={buscando} className="!h-11 whitespace-nowrap">
          {buscando ? t("Buscando…") : t("Buscar")}
        </Button>
      </form>

      {error && (
        <p className="mt-4 rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      {buscado && !error && resultados.length === 0 && (
        <p className="mt-4 text-sm text-muted">
          {t("No se encontraron clientes para")} &quot;{query}&quot;. {t("Verificá el nombre, teléfono o correo.")}
        </p>
      )}

      {resultados.length > 0 && (
        <ul className="mt-4 divide-y divide-ink/15">
          {resultados.map((c) => (
            <li key={c.id} className="flex flex-col gap-2 py-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{c.nombre}</p>
                  <p className="truncate text-xs text-muted">
                    {c.correo} · {c.telefono}
                  </p>
                </div>
                <a
                  href={enlaceTarjetaDe(c, origen)}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`${t("Enviar tarjeta de")} ${c.nombre}`}
                  className="shrink-0 text-xs font-semibold text-primary hover:underline"
                >
                  {t("WhatsApp")}
                </a>
              </div>

              {esAdmin && (
                <div className="flex items-center justify-between gap-2">
                  <ToggleMembresia
                    clienteId={c.id}
                    membresia={c.membresia}
                    onChanged={() =>
                      setResultados((prev) =>
                        prev.map((r) => (r.id === c.id ? { ...r, membresia: !r.membresia } : r))
                      )
                    }
                  />
                  <AdminAcciones cliente={c} onChanged={refrescarResultados} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

// Link de wa.me con el mensaje y la tarjeta del cliente.
function enlaceTarjetaDe(c: Resultado, origen: string) {
  const url = c.codigo ? enlaceTarjeta(c.codigo, origen) : "";
  return enlaceWhatsapp(c.telefono, mensajeTarjeta(c.nombre, 0, 0, url));
}
