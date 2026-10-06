"use client";

import { useState } from "react";
import { PillTabs } from "@/components/ui/pill-tabs";
import { MyQrCard } from "@/components/qr/my-qr-card";
import { RegisterForm } from "@/components/qr/register-form";
import { ClientSearch } from "@/components/qr/client-search";
import { CameraScanner } from "@/components/qr/camera-scanner";

const TABS = ["Formulario", "QR-Cámara"] as const;

export default function QRPage() {
  const [tab, setTab] = useState<"Formulario" | "QR-Cámara">("Formulario");

  return (
    <div className="flex flex-col gap-6">
      {/* <h1 className="font-script text-3xl leading-tight">Registrar Clientes</h1> */}

      {/* Pills: solo en móvil/tablet */}
      <div className="lg:hidden">
        <PillTabs
          tabs={[...TABS]}
          active={tab}
          onChange={(t) => setTab(t as "Formulario" | "QR-Cámara")}
        />
      </div>

      {/* Escritorio: todas las tarjetas visibles en 2 columnas */}
      <div className="hidden gap-6 lg:grid lg:grid-cols-2">
        <div className="flex min-w-0 flex-col gap-6">
          <MyQrCard />
          <ClientSearch />
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
            <ClientSearch />
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
