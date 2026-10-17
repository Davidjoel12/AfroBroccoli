"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { useT } from "@/components/i18n/language-provider";

export default function LoginForm() {
  const t = useT();
  const router = useRouter();
  const [pantalla, setPantalla] = useState<"login" | "recuperar">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "error">("idle");
  const [emailRecuperacion, setEmailRecuperacion] = useState("");
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEstado("loading");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setEstado("error");
    } else {
      setEstado("idle");
      router.push("/");
      router.refresh();
    }
  }

  // ---- Vista: recuperar contraseña ----
  if (pantalla === "recuperar") {
    return (
      <div className="flex w-full max-w-md flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold">{t("Recuperar contraseña")}</h2>
          <p className="text-sm text-muted">
            {t("Escribí tu correo y te enviamos un enlace para restablecerla.")}
          </p>
        </div>

        <Field label={t("Correo electrónico")} htmlFor="recuperar-correo">
          <Input
            id="recuperar-correo"
            type="email"
            placeholder="martha@afrobroccoli.com"
            value={emailRecuperacion}
            onChange={(e) => setEmailRecuperacion(e.target.value)}
          />
        </Field>

        {enlaceEnviado ? (
          <p className="rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium text-ink">
            {t("✅ Listo. Revisá tu correo: te enviamos el enlace para restablecer tu contraseña.")}
          </p>
        ) : (
          <Button
            onClick={async () => {
              if (emailRecuperacion) {
                await supabase.auth.resetPasswordForEmail(emailRecuperacion);
                setEnlaceEnviado(true);
              }
            }}
          >
            {t("Enviar enlace")}
          </Button>
        )}

        <button
          className="self-start text-sm font-medium text-muted hover:text-ink"
          onClick={() => {
            setPantalla("login");
            setEnlaceEnviado(false);
          }}
        >
          {t("← Volver a iniciar sesión")}
        </button>
      </div>
    );
  }

  // ---- Vista: login ----
  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold">{t("Iniciar sesión")}</h2>
        <p className="text-sm text-muted">{t("Entrá con tu cuenta del equipo")}</p>
      </div>

      {estado === "error" && (
        <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          {t("Correo o contraseña incorrectos. Verificá e intentá de nuevo.")}
        </p>
      )}

      <Field label={t("Correo electrónico")} htmlFor="login-correo">
        <Input
          id="login-correo"
          type="email"
          autoComplete="email"
          placeholder="martha@afrobroccoli.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label={t("Contraseña")} htmlFor="login-password">
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          name="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <button
        type="button"
        className="self-end text-sm font-medium text-accent hover:underline"
        onClick={() => setPantalla("recuperar")}
      >
        {t("¿Olvidaste tu contraseña?")}
      </button>

      <Button type="submit" disabled={estado === "loading"}>
        {estado === "loading" ? t("Entrando…") : t("Entrar")}
      </Button>

      <p className="text-center text-xs text-muted">
        {t("Tu rol se detecta automáticamente al iniciar sesión")}
      </p>
    </form>
  );
}