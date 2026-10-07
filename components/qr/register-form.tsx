"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";

const CODIGOS_PAIS = ["+507", "+506", "+57", "+51", "+34", "+52", "+1", "+44", "Otro"];
const NACIONALIDADES: { nombre: string; iso: string }[] = [
  { nombre: "Panamá", iso: "pa" },
  { nombre: "Costa Rica", iso: "cr" },
  { nombre: "Venezuela", iso: "ve" },
  { nombre: "Perú", iso: "pe" },
  { nombre: "México", iso: "mx" },
  { nombre: "Colombia", iso: "co" },
  { nombre: "España", iso: "es" },
  { nombre: "Estados Unidos", iso: "us" },
  { nombre: "Otro", iso: "pa" },
];

export function RegisterForm() {
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [codigoPais, setCodigoPais] = useState(CODIGOS_PAIS[0]);
  const [telefono, setTelefono] = useState("");
  const [nacionalidad, setNacionalidad] = useState(NACIONALIDADES[0].nombre);
  const [membresia, setMembresia] = useState(false);

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setError("");

    const iso = NACIONALIDADES.find((n) => n.nombre === nacionalidad)?.iso ?? "pa";
    const codigo = `AB-${Math.floor(1000 + Math.random() * 9000)}`;
    const telefonoCompleto = `${codigoPais} ${telefono}`;

    const { data: cliente, error: errCliente } = await supabase
      .from("clientes")
      .insert({ codigo, nombre, email: correo, telefono: telefonoCompleto, pais: iso, membresia })
      .select("id")
      .single();

    if (errCliente || !cliente) {
      setError("No se pudo registrar. Verificá los datos e intentá de nuevo.");
      setGuardando(false);
      return;
    }

    // Fila de sellos en cero para el cliente nuevo
    await supabase.from("sellos").insert({ cliente_id: cliente.id, cantidad: 0 });

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
          <Field label="Nombre completo">
            <Input placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Field>
          <Field label="Correo electrónico">
            <Input type="email" placeholder="juang@email.com" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Field label="Código de país">
            <select value={codigoPais} onChange={(e) => setCodigoPais(e.target.value)} className="h-11 rounded-lg border border-ink/20 bg-white/50 px-3.5 text-ink focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none">
              {CODIGOS_PAIS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Número de teléfono">
            <Input type="tel" placeholder="+507 6XXX XXXX" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
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
            <select value={nacionalidad} onChange={(e) => setNacionalidad(e.target.value)} className="h-11 rounded-lg border border-ink/20 bg-white/50 px-3.5 text-ink focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none">
              {NACIONALIDADES.map((n) => <option key={n.nombre}>{n.nombre}</option>)}
            </select>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            className="accent-[#6FC22D]"
            checked={membresia}
            onChange={(e) => setMembresia(e.target.checked)}
          />
          <span>Cliente con membresía</span>
        </label>

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
