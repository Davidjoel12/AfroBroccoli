"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useT } from "@/components/i18n/language-provider";

// Antes apuntaba a app.afrobroccoli.com (producción); ahora se genera con el origin actual.
const PUBLIC_URL = "";

export function MyQrCard() {
  const t = useT();
  const [src, setSrc] = useState<string>("");

  useEffect(() => {
    const url = `${window.location.origin}/registro`;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then(setSrc);
  }, []);

  return (
    <Card className="flex flex-col items-center gap-14 p-6">
      <h3 className="font-script text-2xl">{t("Comparte este QR para registrarse")}</h3>
      {src ? (
        <img src={src} alt={t("QR de AfroBroccoli")} className="h-56 w-56 rounded-lg border border-ink/10 p-2" />
      ) : (
        <div className="grid h-56 w-56 place-items-center rounded-lg bg-cream text-sm text-muted">
          {t("Cargando QR…")}
        </div>
      )}
      {src && (
        <a href={src} download="qr-afrobroccoli.png" className={buttonVariants()}>
          {t("Descargar QR")}
        </a>
      )}
    </Card>
  );
}
