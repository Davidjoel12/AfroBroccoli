"use client";

import { useState } from "react";
import { PillTabs } from "@/components/ui/pill-tabs";
import { useT } from "@/components/i18n/language-provider";
import { MyQrCard } from "@/components/qr/my-qr-card";
import { RegisterForm } from "@/components/qr/register-form";
import { ClientSearch } from "@/components/qr/client-search";
import { CameraScanner } from "@/components/qr/camera-scanner";

// El id del tab es siempre el texto en español (fuente de verdad del i18n) y la
// etiqueta muestra t(id). Así el tab activo sigue funcionando en cualquier
// idioma: antes se guardaba la etiqueta ya traducida y nunca coincidía.
const TABS = ["Formulario", "QR-Cámara"] as const;
type Tab = (typeof TABS)[number];

export default function QrView({ origen }: { origen: string }) {
  const t = useT();
  const [tab, setTab] = useState<Tab>("Formulario");

  return (
    <div className="flex flex-col gap-6">
      {/* <h1 className="font-script text-3xl leading-tight">Registrar Clientes</h1> */}

      {/* Pills: solo en móvil/tablet */}
      <div className="lg:hidden">
        <PillTabs
          tabs={TABS.map((id) => ({ id, label: t(id) }))}
          active={tab}
          onChange={(id) => setTab(id as Tab)}
        />
      </div>

      {/* Escritorio: todas las tarjetas visibles en 2 columnas */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <MyQrCard />
          <ClientSearch origen={origen} />
        </div>
        <div className="flex min-w-0 flex-col gap-6">
          <RegisterForm />
          <CameraScanner />
        </div>
      </div>

      {/* Móvil/tablet: contenido del tab activo */}
      <div className="lg:hidden">
        {tab === "Formulario" ? (
          <div className="flex flex-col gap-6">
            <RegisterForm />
            <ClientSearch origen={origen} />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <MyQrCard />
            <CameraScanner />
          </div>
        )}
      </div>
    </div>
  );
}