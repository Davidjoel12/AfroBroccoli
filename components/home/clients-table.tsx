"use client";

import { useState } from "react";
import { Cliente } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { ToggleMembresia } from "./toggle-membresia";
import { AdminAcciones } from "./admin-acciones";
import { useT } from "@/components/i18n/language-provider";

type Orden = "az" | "sellos" | "frecuentes";

const ETIQUETA_ORDEN: Record<Orden, string> = {
  az: "A–Z",
  sellos: "Más sellos",
  frecuentes: "Más frecuentes",
};

function ordenar(clientes: Cliente[], orden: Orden): Cliente[] {
  const copia = [...clientes];
  switch (orden) {
    case "sellos":
      return copia.sort((a, b) => b.sellos - a.sellos);
    case "frecuentes":
      return copia.sort((a, b) => b.visitas - a.visitas);
    default:
      return copia.sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
}

function Sellos({ cliente }: { cliente: Cliente }) {
  const t = useT();
  const porcentaje = Math.min(100, Math.round((cliente.sellos / cliente.metaSellos) * 100));
  return (
    <div className="flex w-28 flex-col gap-1">
      <div className="h-1.5 w-full rounded-full bg-gold/30">
        <div className="h-full rounded-full bg-gold" style={{ width: `${porcentaje}%` }} />
      </div>
      <span className="text-xs font-semibold text-muted">
        {cliente.sellos}/{cliente.metaSellos} {t("sellos")}
      </span>
    </div>
  );
}

function Bandera({ pais }: { pais: string }) {
  return <span className={`fi fi-${pais} fis rounded-full`} style={{ width: 32, height: 32 }} />;
}

export function ClientsTable({ titulo, clientes, esAdmin = false, meta = 5 }: { titulo: string; clientes: Cliente[]; esAdmin?: boolean; meta?: number }) {
  const [orden, setOrden] = useState<Orden>("az");
  const t = useT();
  const clientesOrdenados = ordenar(clientes, orden);

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between gap-3 p-6 pb-4">
        <h3 className="min-w-0 truncate text-lg font-semibold">{t(titulo)}</h3>
        {/* Filtro nativo: se probó el menú custom y en móvil el <select> del sistema es más cómodo */}
        <select
          aria-label={`${t("Ordenar")} ${titulo}`}
          value={orden}
          onChange={(e) => setOrden(e.target.value as Orden)}
          className="h-9 w-[124px] shrink-0 cursor-pointer rounded-lg border border-ink/15 bg-white px-2 text-xs font-medium text-ink focus:border-primary focus:outline-none"
        >
          {(Object.keys(ETIQUETA_ORDEN) as Orden[]).map((o) => (
            <option key={o} value={o}>
              {t(ETIQUETA_ORDEN[o])}
            </option>
          ))}
        </select>
      </div>
      {clientesOrdenados.length === 0 ? (
        <p className="p-6 pt-0 text-sm text-muted">{t("No hay clientes en esta categoría.")}</p>
      ) : (
        <>
          {/* ===== Tabla (desktop) ===== */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-t border-ink/10 text-xs uppercase tracking-wide text-muted">
                  <th className="px-6 py-3">{t("País")}</th>
                  <th className="py-3">{t("Cliente")}</th>
                  <th className="py-3">{t("Sellos")}</th>
                  <th className="py-3">{t("Teléfono")}</th>
                  <th className="py-3 pr-6 text-right">{t("WhatsApp")}</th>
                  {esAdmin && <th className="py-3 pr-6 text-right">{t("Membresía")}</th>}
                  {esAdmin && <th className="py-3 pr-6 text-right">{t("Acciones")}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {clientesOrdenados.map((c) => (
                  <tr key={c.correo} className="hover:bg-cream/40">
                    <td className="px-6 py-4"><Bandera pais={c.pais} /></td>
                    <td className="py-4">
                      <p className="font-medium">{c.nombre}</p>
                      <p className="text-xs text-muted">{c.correo}</p>
                    </td>
                    <td className="py-4"><Sellos cliente={c} /></td>
                    <td className="py-4 text-muted">{c.telefonoFormato}</td>
                    <td className="py-4 pr-6 text-right">
                      <a
                        href={`https://wa.me/${c.telefono}?text=${encodeURIComponent(`Hola ${c.nombre}, te comparto tu tarjeta de cliente de AfroBroccoli 🥦`)}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${t("Enviar tarjeta de")} ${c.nombre}`}
                        title={`${t("Enviar tarjeta de")} ${c.nombre}`}
                        className="inline-grid h-9 w-9 place-items-center rounded-full bg-primary text-ink transition-colors hover:bg-primary/90"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.04 2C6.58 2 2.15 6.43 2.15 11.89c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.23h.01c5.46 0 9.89-4.43 9.89-9.88 0-2.64-1.03-5.12-2.9-6.99A9.83 9.83 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.03-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.26 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.68 4.23 3.76.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
                        </svg>
                      </a>
                    </td>
                    {esAdmin && (
                      <td className="py-4 pr-6 text-right">
                        <ToggleMembresia clienteId={c.id} membresia={c.membresia} />
                      </td>
                    )}
                    {esAdmin && (
                      <td className="py-4 pr-6 text-right">
                        <AdminAcciones cliente={c} meta={meta} />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== Filas de tarjeta (móvil) ===== */}
          <ul className="divide-y divide-ink/5 md:hidden">
            {clientesOrdenados.map((c) => (
              <li key={c.correo} className="flex flex-col gap-3 p-4">
                <div className="flex items-center gap-3">
                  <Bandera pais={c.pais} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c.nombre}</p>
                    <p className="truncate text-xs text-muted">{c.correo}</p>
                    <p className="truncate text-xs text-muted">{c.telefonoFormato}</p>
                  </div>
                  <a
                    href={`https://wa.me/${c.telefono}?text=${encodeURIComponent(`Hola ${c.nombre}, te comparto tu tarjeta de cliente de AfroBroccoli 🥦`)}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${t("Enviar tarjeta de")} ${c.nombre}`}
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-ink"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12.04 2C6.58 2 2.15 6.43 2.15 11.89c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.23h.01c5.46 0 9.89-4.43 9.89-9.88 0-2.64-1.03-5.12-2.9-6.99A9.83 9.83 0 0 0 12.04 2Zm0 18.13h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.11.82.83-3.03-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.24-8.23 2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.54-3.7 8.23-8.26 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.16.25-.64.81-.79.97-.14.16-.29.18-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.68 4.23 3.76.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z" />
                    </svg>
                  </a>
                </div>

                <div className="pl-11">
                  <Sellos cliente={c} />
                </div>

                {esAdmin && (
                  <div className="border-t border-ink/10 pt-3">
                    <div className="flex flex-wrap items-center justify-between gap-3 pl-11">
                      <ToggleMembresia clienteId={c.id} membresia={c.membresia} />
                      <AdminAcciones cliente={c} meta={meta} />
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
