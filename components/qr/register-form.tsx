"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { PAISES } from "@/lib/countries";
import { SelectMenu } from "@/components/ui/select-menu";
import { useT } from "@/components/i18n/language-provider";
import { rutaTarjeta } from "@/lib/config";

const PREFIJOS_UNICOS = Array.from(
  new Set(PAISES.map((p) => p.prefijo).filter((p): p is string => Boolean(p)))
).sort((a, b) => Number(a.slice(1)) - Number(b.slice(1)));

const OPCIONES_PAIS = PAISES.map((p) => ({ value: p.iso, label: p.nombre }));

/**
 * Formulario de registro de clientes.
 *
 * `redirigir` solo se activa en el registro público (/registro, el que escanea
 * la clienta por su cuenta): ahí, al terminar, va directo a su tarjeta. En el
 * /qr del salón NO se redirige, porque el staff tiene que seguir ahí para
 * registrar más clientes, verlos o escanearlos.
 */
export function RegisterForm({
  mostrarMembresia = true,
  redirigir = false,
}: {
  mostrarMembresia?: boolean;
  redirigir?: boolean;
}) {
  const t = useT();
  const router = useRouter();
  const [registrado, setRegistrado] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [codigoNuevo, setCodigoNuevo] = useState("");
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [codigoPais, setCodigoPais] = useState("+507");
  const [telefono, setTelefono] = useState("");
  const [nacionalidad, setNacionalidad] = useState("pa");
  const [membresia, setMembresia] = useState(false);

  // Autoregistro: al terminar, la clienta pasa a su propia tarjeta (/c/AB-0000).
  // El aviso de "registrado" queda un instante para que vea que salió bien.
  useEffect(() => {
    if (!redirigir || !registrado || !codigoNuevo) return;
    const timer = setTimeout(() => router.push(rutaTarjeta(codigoNuevo)), 900);
    return () => clearTimeout(timer);
  }, [redirigir, registrado, codigoNuevo, router]);

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
      setError(t("No se pudo registrar. Verificá los datos e intentá de nuevo."));
      setGuardando(false);
      return;
    }

    setGuardando(false);
    setRegistrado(true);
    setCodigoNuevo(codigo);
    setNombre("");
    setCorreo("");
    setTelefono("");
  }

  return (
    <Card>
      <h2 className="text-xl font-semibold">{t("Formulario para registrar clientes")}</h2>
      <p className="mb-6 text-sm text-muted">
        {t("Completá tus datos para crear tu cuenta y obtener tu QR.")}
      </p>

      {registrado && (
        <div className="mb-4 rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium">
          <p>
            {redirigir
              ? t("✅ ¡Listo! Este es tu código de cliente. Te llevamos a tu tarjeta.")
              : t("✅ ¡Cliente registrado! Ya puede escanear el QR para entrar.")}
          </p>
          {codigoNuevo && (
            <p className="mt-1 text-xs text-muted">
              {t("Código")} <span className="font-semibold text-ink">{codigoNuevo}</span>
            </p>
          )}
          {redirigir && codigoNuevo && (
            <a
              href={rutaTarjeta(codigoNuevo)}
              className="mt-2 inline-block font-semibold text-primary hover:underline"
            >
              {t("Ver mi tarjeta ahora ↗")}
            </a>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {error}
        </p>
      )}

      <form className="flex flex-col gap-4" onSubmit={registrar}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Nombre completo")} htmlFor="cliente-nombre">
            <Input id="cliente-nombre" placeholder="Ej. Juan Pérez" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </Field>
          <Field label={t("Correo electrónico")} htmlFor="cliente-correo">
            <Input id="cliente-correo" type="email" placeholder="juang@email.com" value={correo} onChange={(e) => setCorreo(e.target.value)} required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
          <Field label={t("Código de país")}>
            <SelectMenu
              label={t("Código de país")}
              value={codigoPais}
              onChange={setCodigoPais}
              searchable
              options={PREFIJOS_UNICOS.map((p) => ({ value: p, label: p }))}
            />
          </Field>
          <Field label={t("Número de teléfono")} htmlFor="cliente-telefono">
            <Input id="cliente-telefono" type="tel" placeholder="+507 6XXX XXXX" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("Fecha de Nacimiento")}>
            <div className="grid grid-cols-3 gap-2">
              <Input placeholder={t("Día")} inputMode="numeric" />
              <Input placeholder={t("Mes")} inputMode="numeric" />
              <Input placeholder={t("Año")} inputMode="numeric" />
            </div>
          </Field>
          <Field label={t("Nacionalidad")}>
            <SelectMenu
              label={t("Nacionalidad")}
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
            <span>{t("Cliente con membresía")}</span>
          </label>
        )}

        <label className="flex items-start gap-2 text-sm text-muted">
          <input type="checkbox" className="mt-1 accent-[#6FC22D]" required />
          <span>{t("Acepto el tratamiento de datos personales según la ley 81 de Panamá.")}</span>
        </label>

        <Button type="submit" disabled={guardando}>
          {guardando ? t("Registrando…") : t("Registrar y obtener QR")}
        </Button>
      </form>
    </Card>
  );
}
