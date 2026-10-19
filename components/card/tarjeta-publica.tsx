"use client";

import { Logo } from "@/components/ui/logo";
import { LanguageSwitch } from "@/components/i18n/language-switch";
import { TarjetaCliente } from "@/components/card/tarjeta-cliente";
import { useT } from "@/components/i18n/language-provider";

export type TarjetaPublica = {
  nombre: string;
  codigo: string;
  membresia: boolean;
  sellos: number;
  meta: number;
  recompensa: string;
  colorAcento: string;
  logoUrl: string | null;
};

/**
 * Vista de la tarjeta pública (/c/AB-0042).
 *
 * Es un Client Component a propósito: la página que lo dibuja es un Server
 * Component y no puede leer el idioma. Acá adentro sí, así el switch ES/EN
 * traduce todo lo que ve el cliente.
 */
export function TarjetaPublica({ tarjeta }: { tarjeta: TarjetaPublica | null }) {
  const t = useT();

  return (
    <main className="flex min-h-dvh flex-col items-center gap-6 bg-cream px-4 py-10">
      <div className="flex flex-col items-center gap-2 text-center">
        <Logo
          src={tarjeta?.logoUrl ?? null}
          alt="AfroBroccoli"
          width={64}
          height={64}
          className="h-16 w-16 rounded-2xl"
        />
        <h1 className="font-script text-3xl leading-tight">AfroBroccoli</h1>
        <p className="text-sm text-muted">{t("Tu tarjeta de cliente")}</p>
        <LanguageSwitch variant="light" className="mt-1" />
      </div>

      {tarjeta ? (
        <TarjetaCliente
          nombre={tarjeta.nombre}
          codigo={tarjeta.codigo}
          sellos={tarjeta.sellos}
          meta={tarjeta.meta}
          recompensa={tarjeta.recompensa}
          colorAcento={tarjeta.colorAcento}
          membresia={tarjeta.membresia}
        />
      ) : (
        <div className="w-full max-w-sm rounded-card border border-ink/15 bg-white p-6 text-center">
          <p className="text-lg font-semibold">{t("No encontramos esa tarjeta")}</p>
          <p className="mt-2 text-sm text-muted">
            {t("Revisá el link que te pasamos o pedile al salón que te lo reenvíe.")}
          </p>
        </div>
      )}

      <p className="text-center text-xs text-muted">
        {t("Mostrá este código en el salón para sumar tus sellos.")}
      </p>
    </main>
  );
}