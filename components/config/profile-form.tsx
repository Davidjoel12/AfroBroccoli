"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/use-usuario";

const BUCKET = "logo";
const LOGO_POR_DEFECTO = "/logo.jpg";

export default function ProfileForm() {
  const [guardado, setGuardado] = useState(false);
  const { usuario, cargando } = useUsuario();
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [logoUrl, setLogoUrl] = useState<string>(LOGO_POR_DEFECTO);
  const [subiendo, setSubiendo] = useState(false);
  const [errorLogo, setErrorLogo] = useState("");
  const inputArchivo = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (usuario?.nombre) setNombre(usuario.nombre);
  }, [usuario]);

  useEffect(() => {
    if (usuario?.telefono) setTelefono(usuario.telefono);
  }, [usuario]);

  // Carga el logo guardado en config (si hay)
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("config")
        .select("logo_url")
        .eq("id", 1)
        .single();
      if (data?.logo_url) setLogoUrl(data.logo_url);
    })();
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    const { error } = await supabase
      .from("profiles")
      .update({ nombre, telefono })
      .eq("id", usuario.id);
    if (!error) setGuardado(true);
  }

  async function subirImagen(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0];
    e.target.value = ""; // permite reelegir el mismo archivo
    if (!archivo) return;
    if (!archivo.type.startsWith("image/")) {
      setErrorLogo("Ese archivo no es una imagen.");
      return;
    }
    setSubiendo(true);
    setErrorLogo("");

    const extension = archivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const ruta = `logo-${Date.now()}.${extension}`;

    const { error: errSubida } = await supabase.storage
      .from(BUCKET)
      .upload(ruta, archivo, { contentType: archivo.type, upsert: true });

    if (errSubida) {
      setErrorLogo("No se pudo subir la imagen. Intentá de nuevo.");
      setSubiendo(false);
      return;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(ruta);
    const url = data.publicUrl;
    setLogoUrl(url);
    await supabase.from("config").update({ logo_url: url }).eq("id", 1);
    setSubiendo(false);
    setGuardado(true);
  }

  async function eliminarAvatar() {
    setSubiendo(true);
    setErrorLogo("");
    // Borra los archivos del bucket (el logo es uno solo)
    const { data: archivos } = await supabase.storage.from(BUCKET).list("");
    if (archivos?.length) {
      await supabase.storage
        .from(BUCKET)
        .remove(archivos.filter((a) => a.name.startsWith("logo-")).map((a) => a.name));
    }
    await supabase.from("config").update({ logo_url: null }).eq("id", 1);
    setLogoUrl(LOGO_POR_DEFECTO);
    setSubiendo(false);
    setGuardado(true);
  }

  const esAdmin = usuario?.role === "admin";
  // Mientras no sepamos el rol, mostramos la carga para no filtrar controles por error
  const soloLectura = !cargando && !esAdmin;

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
            src={logoUrl}
            alt="Logo de AfroBroccoli"
            width={176}
            height={176}
            unoptimized={logoUrl.startsWith("http")}
            className="h-24 w-24 shrink-0 rounded-card object-cover sm:h-36 sm:w-36 lg:h-44 lg:w-44"
          />
          {!soloLectura && (
            <div className="flex min-w-[168px] flex-1 flex-col gap-2 sm:w-56 sm:flex-none">
              {/* Input oculto: en móvil abre la galería, en escritorio el explorador de archivos */}
              <input
                ref={inputArchivo}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={subirImagen}
              />
              <Button
                variant="primary"
                className="!h-10 w-full whitespace-nowrap"
                disabled={subiendo}
                onClick={() => inputArchivo.current?.click()}
              >
                {subiendo ? "Subiendo…" : "Subir nueva imagen"}
              </Button>
              <button
                className="h-10 w-full cursor-pointer whitespace-nowrap rounded-[10px] border border-ink/15 bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-cream disabled:cursor-not-allowed disabled:opacity-50"
                disabled={subiendo}
                onClick={eliminarAvatar}
              >
                Eliminar avatar
              </button>
              {errorLogo && (
                <p className="text-xs font-medium text-danger">{errorLogo}</p>
              )}
            </div>
          )}
        </div>

        {soloLectura ? (
          // Vista de solo lectura para staff: ven el logo y su rol, sin edición
          <div className="flex flex-col gap-4 rounded-card bg-cream/60 p-5">
            <p className="text-sm text-muted">
              Los datos del negocio los administra el administrador del salón. Preguntale a la
              dueña si necesitás cambiar algo.
            </p>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-muted">Tu nombre</dt>
                <dd className="font-semibold text-ink">{nombre || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted">Tu correo</dt>
                <dd className="font-semibold break-all text-ink">{usuario?.email ?? "—"}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={guardar}>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Nombre completo" htmlFor="perfil-nombre">
                <Input
                  id="perfil-nombre"
                  name="nombre"
                  autoComplete="name"
                  placeholder="Ej. Juan Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </Field>
              <Field label="Correo electrónico" htmlFor="perfil-correo">
                <Input id="perfil-correo" type="email" name="email" readOnly value={usuario?.email ?? ""} />
              </Field>
            </div>
            <Field label="Número de teléfono" htmlFor="perfil-telefono">
              <Input
                id="perfil-telefono"
                name="telefono"
                type="tel"
                autoComplete="tel"
                placeholder="+507 6XXX XXXX"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
              />
            </Field>
            <Button type="submit" className="w-full">Guardar cambios</Button>
          </form>
        )}

        {!cargando && usuario && (
          <p className="text-sm text-muted">
            Rol:{" "}
            <span className="font-semibold text-ink">
              {usuario.role === "admin" ? "Administrador" : "Staff"}
            </span>
          </p>
        )}
      </div>
    </Card>
  );
}
