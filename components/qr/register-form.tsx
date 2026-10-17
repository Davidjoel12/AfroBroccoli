"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { PAISES } from "@/lib/countries";
import { SelectMenu } from "@/components/ui/select-menu";

const PREFIJOS_UNICOS = Array.from(
  new Set(PAISES.map((p) => p.prefijo).filter((p): p is string => Boolean(p)))
).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

const OPCIONES_PAIS = PAISES.map((p) => ({ value: p.iso, label: p.nombre }));

export function RegisterForm({ mostrarMembresia = true }: { mostrarMembresia?: boolean }) {
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [codigoPais, setCodigoPais] = useState("+507");
  const [telefono, setTelefono] = useState("");
  const [nacionalidad, setNacionalidad] = useState("pa");
  const [membresia, setMembresia] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const iso = nacionalidad;
    const codigo = `AB-${Math.floor(1000 + Math.random() * 9000)}`;
    const telefonoCompleto = `${codigoPais} ${telefono}`;

    // Sin .select(): el registro público no tiene permiso de lectura.
    // La fila de sellos la crea el trigger trg_crear_sellos en la base.
    const { error: errCliente } = await supabase
      .from("clientes")
      .insert({ codigo, nombre, email: correo, telefono: telefonoCompleto, pais: iso, membresia });

    if (errCliente) {
      setError("No se pudo registrar. Verificá los datos e intentá de nuevo.");
      setGuardando(false);
      return;
    }

    setGuardando(false);
    setRegistrado(true);
    setNombre("");
    setCorreo("");
    setTelefono("");
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">Formulario para registrar clientes</h2>
      <p className="mb-6 text-sm text-muted">
        Completá tus datos para crear tu cuenta y obtener tu QR.
      </p>

      {registrado && (
        <p className="mb-4 rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
          ✅ ¡Cliente registrado! Ya puede escanear el QR para entrar.
        </p>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-4" onSubmit={registrar}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo" htmlFor="cliente-nombre">
            <Input id="cliente-nombre" placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Field>
          <Field label="Correo electrónico" htmlFor="cliente-correo">
            <Input id="cliente-correo" type="email" placeholder="juang@email.com" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Field label="Código de país">
            <SelectMenu
              label="Código de país"
              value={codigoPais}
              onChange={setCodigoPais}
              searchable
              options={PREFIJOS_UNICOS.map((p) => ({ value: p, label: p }))}
            />
          </Field>
          <Field label="Número de teléfono" htmlFor="cliente-telefono">
            <Input id="cliente-telefono" type="tel" placeholder="+507 6XXX XXXX" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha de Nacimiento">
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder="Día" inputMode="numeric" />
              <Input placeholder="Mes" inputMode="numeric" />
              <Input placeholder="Año" inputMode="numeric" />
            </div>
          </Field>
          <Field label="Nacionalidad">
            <SelectMenu
              label="Nacionalidad"
              value={nacionalidad}
              onChange={setNacionalidad}
              searchable
              options={OPCIONES_PAIS}
            />
          </Field>
        </div>

        {mostrarMembresia && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              className="accent-[#6FC22D]"
              checked={membresia}
              onChange={(e) => setMembresia(e.target.checked)}
            />
            <span>Cliente con membresía</span>
          </label>
        )}

        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1 accent-[#6FC22D]" required />
          <span>Acepto el tratamiento de datos personales según la ley 81 de Panamá.</span>
        </label>

        <Button type="submit" disabled={guardando}>
          {guardando ? "Registrando…" : "Registrar y obtener QR"}
        </Button>
      </form>
    </Card>
  );
}
