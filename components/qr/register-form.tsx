"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

const CODIGOS_PAIS = ["+507", "+506", "+57", "+51", "+34", "+52", "+1", "+44", "Otro"];
const NACIONALIDADES = ["Panamá", "Costa Rica", "Venezuela", "Perú", "México", "Colombia", "España", "Estados Unidos", "Otro"];

export function RegisterForm() {
  const [registrado, setRegistrado] = useState(false);

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

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          setRegistrado(true);
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre completo">
            <Input placeholder="Ej. Juan Pérez" />
          </Field>
          <Field label="Correo electrónico">
            <Input type="email" placeholder="juang@email.com" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Field label="Código de país">
            <select className="h-11 rounded-lg border border-ink/20 bg-white/50 px-3.5 text-ink focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none">
              {CODIGOS_PAIS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Número de teléfono">
            <Input type="tel" placeholder="+507 6XXX XXXX" />
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
            <select className="h-11 rounded-lg border border-ink/20 bg-white/50 px-3.5 text-ink focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none">
              <option>Selecciona</option>
              {NACIONALIDADES.map((n) => <option key={n}>{n}</option>)}
            </select>
          </Field>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1 accent-[#6FC22D]" required />
          <span>Acepto el tratamiento de datos personales según la ley 81 de Panamá.</span>
        </label>

        <Button type="submit">Registrar y obtener QR</Button>
      </form>
    </Card>
  );
}
