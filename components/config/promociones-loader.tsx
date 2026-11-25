"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useT } from "@/components/i18n/language-provider";
import { supabase } from "@/lib/supabase";
import { useUsuario } from "@/lib/use-usuario";
import { devDelay } from "@/lib/dev-delay";
import {
  cargarDatosPromociones,
  type DatosPromociones,
} from "@/lib/campanas-data";
import PromocionesPanel from "./promociones-panel";
import PromocionesSkeleton from "./promociones-skeleton";

// Carga Promociones en el navegador, después de mostrar el esqueleto. Así la
// página se siente igual de rápida que Perfil y Personalizar tarjeta.
export default function PromocionesLoader() {
  const t = useT();
  const router = useRouter();
  const { usuario, cargando } = useUsuario();
  const usuarioId = usuario?.id ?? null;
  const esAdmin = usuario?.role === "admin";
  const [datos, setDatos] = useState<DatosPromociones | null>(null);
  const [error, setError] = useState(false);
  const [version, setVersion] = useState(0);

  const recargar = useCallback(() => {
    setVersion((valor) => valor + 1);
  }, []);

  useEffect(() => {
    if (cargando) return;

    if (!usuarioId) {
      router.replace("/login");
      return;
    }

    if (!esAdmin) {
      router.replace("/");
      return;
    }

    let activo = true;

    (async () => {
      setError(false);
      await devDelay();
      if (!activo) return;

      try {
        const cargados = await cargarDatosPromociones(supabase);
        if (activo) setDatos(cargados);
      } catch (err) {
        console.error("[promociones:cargar]", err);
        if (activo) setError(true);
      }
    })();

    return () => {
      activo = false;
    };
  }, [cargando, usuarioId, esAdmin, router, version]);

  if (cargando || (!datos && !error)) {
    return <PromocionesSkeleton />;
  }

  if (!datos) {
    return (
      <Card className="p-6" role="alert">
        <p className="font-semibold text-ink">
          {t("No se pudieron cargar las promociones.")}
        </p>
        <p className="mt-1 text-sm text-muted">
          {t("Revisá la conexión e intentá de nuevo.")}
        </p>
        <Button type="button" className="mt-4" onClick={recargar}>
          {t("Reintentar")}
        </Button>
      </Card>
    );
  }

  return (
    <>
      {error && (
        <div
          role="alert"
          className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-card border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
        >
          <p className="font-medium">
            {t("No se pudieron actualizar los datos.")}
          </p>
          <Button type="button" variant="subtle" onClick={recargar}>
            {t("Reintentar")}
          </Button>
        </div>
      )}
      <PromocionesPanel {...datos} onRefresh={recargar} />
    </>
  );
}
