"use client";

import { Logo } from "@/components/ui/logo";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { useT } from "@/components/i18n/language-provider";

// Panel de marca del login (cliente para que el cambio de idioma sea instantáneo)
export default function LoginBrand() {
  const t = useT();

  return (
    <section className="flex items-center justify-center bg-ink px-8 py-12 lg:w-1/2 lg:py-20">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="grid h-30 w-30 place-items-center rounded-2xl bg-black">
          <Logo alt="AfroBroccoli" width={160} height={160} className="rounded-2xl" />
        </div>
        <h1 className="font-script text-5xl leading-tight text-cream">AfroBroccoli</h1>
        <p className="text-sm font-medium text-mint">
          {t("Gestión interna de clientes, sellos y equipo.")}
        </p>
        <LanguageSwitch variant="light" className="mt-2" />
      </div>
    </section>
  );
}