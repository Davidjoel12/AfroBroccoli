"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

// Usuario de mentira mientras no hay backend
const USUARIO_MOCK = { email: "martha@afrobroccoli.com", password: "afro123" };

export default function LoginForm() {
  const [pantalla, setPantalla] = useState<"login" | "recuperar">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [estado, setEstado] = useState<"idle" | "loading" | "error">("idle");
  const [emailRecuperacion, setEmailRecuperacion] = useState("");
  const [enlaceEnviado, setEnlaceEnviado] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setEstado("loading");
    // Simulamos la demora del servidor
    setTimeout(() => {
      if (email === USUARIO_MOCK.email && password === USUARIO_MOCK.password) {
        setEstado("idle");
        // TODO: cuando haya backend, acá va Supabase Auth y la redirección al Home
        alert("¡Sesión iniciada, Swanny!");
      } else {
        setEstado("error");
      }
    }, 800);
  }

  // ---- Vista: recuperar contraseña ----
  if (pantalla === "recuperar") {
    return (
      <div className="flex w-full max-w-md flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-bold">Recuperar contraseña</h2>
          <p className="text-sm text-muted">
            Escribí tu correo y te enviamos un enlace para restablecerla.
          </p>
        </div>

        <Field label="Correo electrónico">
          <Input
            type="email"
            placeholder="martha@afrobroccoli.com"
            value={emailRecuperacion}
            onChange={(e) => setEmailRecuperacion(e.target.value)}
          />
        </Field>

        {enlaceEnviado ? (
          <p className="rounded-lg bg-primary/15 px-4 py-3 text-sm font-medium text-ink">
            ✅ Listo. Revisá tu correo: te enviamos el enlace para
            restablecer tu contraseña.
          </p>
        ) : (
          <Button
            onClick={() => {
              if (emailRecuperacion) setEnlaceEnviado(true);
            }}
          >
            Enviar enlace
          </Button>
        )}

        <button
          className="self-start text-sm font-medium text-muted hover:text-ink"
          onClick={() => {
            setPantalla("login");
            setEnlaceEnviado(false);
          }}
        >
          ← Volver a iniciar sesión
        </button>
      </div>
    );
  }

  // ---- Vista: login ----
  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-5">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold">Iniciar sesión</h2>
        <p className="text-sm text-muted">Entrá con tu cuenta del equipo</p>
      </div>

      {estado === "error" && (
        <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm font-medium text-danger">
          Correo o contraseña incorrectos. Verificá e intentá de nuevo.
        </p>
      )}

      <Field label="Correo electrónico">
        <Input
          type="email"
          placeholder="martha@afrobroccoli.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </Field>

      <Field label="Contraseña">
        <Input
          type="password"
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
        ¿Olvidaste tu contraseña?
      </button>

      <Button type="submit" disabled={estado === "loading"}>
        {estado === "loading" ? "Entrando…" : "Entrar"}
      </Button>

      <p className="text-center text-xs text-muted">
        Tu rol se detecta automáticamente al iniciar sesión
      </p>
    </form>
  );
}