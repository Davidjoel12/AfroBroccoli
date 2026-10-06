"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

export default function ProfileForm() {
  const [guardado, setGuardado] = useState(false);

  return (
    <Card className="p-6 sm:p-8">
      <h2 className="text-2xl font-semibold">Perfil</h2>
      <p className="mb-6 mt-1 text-base text-muted">Actualiza tus datos de la empresa</p>

      {guardado && (
        <p className="mb-4 rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
          ✅ Cambios guardados correctamente.
        </p>
      )}

      <div className="flex flex-col gap-6">
        {/* Logo de la empresa */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <Image
            src="/logo.jpg"
            alt="Logo de AfroBroccoli"
            width={176}
            height={176}
            className="h-24 w-24 shrink-0 rounded-card object-cover sm:h-36 sm:w-36 lg:h-44 lg:w-44"
          />
          <div className="flex min-w-[168px] flex-1 flex-col gap-2 sm:w-56 sm:flex-none">
            <Button
              variant="primary"
              className="!h-10 w-full whitespace-nowrap"
              onClick={() => setGuardado(false)}
            >
              Subir nueva imagen
            </Button>
            <button
              className="h-10 w-full cursor-pointer whitespace-nowrap rounded-[10px] border border-ink/15 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-cream"
              onClick={() => setGuardado(false)}
            >
              Eliminar avatar
            </button>
          </div>
        </div>

        <form
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            setGuardado(true);
          }}
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Nombre completo">
              <Input placeholder="Ej. Juan Pérez" />
            </Field>
            <Field label="Correo electrónico">
              <Input type="email" placeholder="juang@email.com" />
            </Field>
          </div>
          <Field label="Número de teléfono">
            <Input type="tel" placeholder="+507 6XXX XXXX" />
          </Field>
          <Button type="submit" className="w-full">Guardar cambios</Button>
        </form>
      </div>
    </Card>
  );
}
