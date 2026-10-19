"use client";

import { Logo } from "@/components/ui/logo";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { RegisterForm } from "@/components/qr/register-form";
import { useT } from "@/components/i18n/language-provider";

// Registro público: no requiere login (el proxy la deja pasar).
// Client Component para poder traducir el encabezado con el switch ES/EN.
export default function RegistroPage() {
  const t = useT();

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-cream px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo alt="AfroBroccoli" width={72} height={72} className="rounded-2xl" />
        <h1 className="font-script text-4xl leading-tight">AfroBroccoli</h1>
        <p className="text-sm text-muted">{t("Registrate para obtener tu tarjeta de cliente")}</p>
        <LanguageSwitch variant="light" className="mt-2" />
      </div>
      <div className="w-full max-w-xl">
        {/* redirigir: al autoregistrarse, la clienta va directo a su tarjeta */}
        <RegisterForm mostrarMembresia={false} redirigir />
      </div>
    </main>
  );
}