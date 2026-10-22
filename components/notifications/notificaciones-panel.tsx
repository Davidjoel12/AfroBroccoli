"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  colorPorTipo,
  type Notificacion,
} from "@/lib/notificaciones";
import { useT } from "@/components/i18n/language-provider";
import { useNotificaciones } from "@/components/notifications/notificaciones-provider";

type NotificacionesPanelProps = {
  onCerrar: () => void;
  onNotificacionClick?: (n: Notificacion) => void;
  variante?: "drawer" | "popup";
};

const NOTIFICACIONES_DEMO: Notificacion[] = [
  {
    id: "demo-cumpleanos",
    tipo: "cumpleanos",
    clienteId: "demo-1",
    clienteNombre: "María Gonzalez",
    clienteCodigo: "AB-1001",
    telefono: "50760000001",
    titulo: "Cumpleaños proximo",
    cuerpo: "Faltan 2 dias para el cumpleaños de Maria Gonzalez.",
    leida: false,
    fecha: new Date().toISOString(),
  },
  {
    id: "demo-sellos",
    tipo: "sellos_completos",
    clienteId: "demo-2",
    clienteNombre: "Carlos Ruiz",
    clienteCodigo: "AB-1002",
    telefono: "50760000002",
    titulo: "Recompensa lista",
    cuerpo: "Carlos Ruiz completo sus 5 sellos.",
    leida: false,
    fecha: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: "demo-inactivo",
    tipo: "inactividad",
    clienteId: "demo-3",
    clienteNombre: "Lucia Fernandez",
    clienteCodigo: "AB-1003",
    telefono: "50760000003",
    titulo: "Cliente inactivo",
    cuerpo: "Lucia Fernandez no vuelve hace 45 dias. Reagenda su cita.",
    leida: true,
    fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
];

function IconoNotificacion({ tipo, color }: { tipo: Notificacion["tipo"]; color: string }) {
  const iconos: Record<Notificacion["tipo"], string> = {
    cumpleanos: "A",
    sellos_completos: "S",
    inactividad: "I",
  };
  return (
    <span
      style={{ color, fontSize: 18, lineHeight: 1 }}
      role="img"
      aria-label={tipo}
    >
      {iconos[tipo]}
    </span>
  );
}

function abrirWhatsApp(telefono: string | undefined, mensaje: string) {
  if (!telefono) return;
  const limpio = telefono.replace(/[^0-9]/g, "");
  const url = `https://wa.me/${limpio}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank");
}

export function NotificacionesPanel({
  onCerrar,
  onNotificacionClick,
  variante = "drawer",
}: NotificacionesPanelProps) {
  const t = useT();
  const router = useRouter();
  const pathname = usePathname();
  const { notificaciones: notificacionesProvider } = useNotificaciones();
  const [leidas, setLeidas] = useState<Set<string>>(new Set());
  const [demo, setDemo] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const notificacionesReales = notificacionesProvider;
  const hayNotificacionesReales = notificacionesReales.length > 0;
  const mostrarDemo = demo || (!hayNotificacionesReales && !demo);
  const notificaciones = mostrarDemo ? NOTIFICACIONES_DEMO : notificacionesReales;
  const noLeidas = notificaciones.filter((n) => !leidas.has(n.id));

  const marcarLeida = (id: string) => {
    setLeidas((prev) => new Set([...prev, id]));
  };

  const marcarTodasLeidas = () => {
    setLeidas(new Set(notificaciones.map((n) => n.id)));
  };

  const volverAtras = () => {
    onCerrar();
    if (variante === "drawer" && pathname !== "/") {
      router.back();
    }
  };

  const manejarClickNotificacion = (n: Notificacion) => {
    marcarLeida(n.id);
    onNotificacionClick?.(n);
    if (n.tipo === "inactividad" && n.telefono) {
      const mensaje = `Hola ${n.clienteNombre}, te extrañamos en AfroBroccoli. Hace tiempo que no nos visitas. ¿Te gustaría reagendar tu cita?`;
      abrirWhatsApp(n.telefono, mensaje);
    } else if (n.tipo === "cumpleanos" && n.telefono) {
      const mensaje = `Feliz cumpleaños ${n.clienteNombre}. Te esperamos en AfroBroccoli para celebrarte.`;
      abrirWhatsApp(n.telefono, mensaje);
    }
  };

  const esPopup = variante === "popup";

  // Cerrar popup al hacer clic fuera del mismo (escritorio)
  useEffect(() => {
    if (!esPopup) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        onCerrar();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [esPopup, onCerrar]);

  return esPopup ? (
    <div
      ref={panelRef}
      className="absolute top-16 right-4 w-96 max-h-[calc(100vh-5rem)] bg-cream border border-ink/15 rounded-xl shadow-2xl flex flex-col motion-reduce:animate-none z-50"
    >
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-t-xl border-b border-ink/10">
        <button
          onClick={volverAtras}
          className="flex items-center gap-1.5 text-xs font-semibold text-ink hover:text-accent transition-colors"
          aria-label="Volver atras"
        >
          &larr; Atras
        </button>
        <h2 className="font-script text-xl text-ink">{t("Notificaciones")}</h2>
        {noLeidas.length > 0 && !demo && (
          <button
            onClick={marcarTodasLeidas}
            className="text-[10px] font-semibold text-primary hover:text-primary/90 underline underline-offset-2"
          >
            {t("Marcar todo como leído")}
          </button>
        )}
      </div>

      {mostrarDemo && !hayNotificacionesReales && (
        <div className="px-3 py-1.5 bg-gold/10 border-b border-gold/30">
          <p className="text-[10px] text-center text-gold/90 font-medium">
            Demo - Asi se ven las notificaciones
          </p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {notificaciones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span style={{ fontSize: 20 }}>!</span>
            <p className="font-semibold text-ink mt-2">{t("Sin notificaciones")}</p>
            <p className="mt-1 text-xs text-muted">
              {t("Cuando haya algo nuevo, aparecera aqui.")}
            </p>
          </div>
        ) : (
          notificaciones.map((n) => {
            const color = colorPorTipo(n.tipo);
            const yaLeida = leidas.has(n.id);
            return (
              <div
                key={n.id}
                className={cn(
                  "group flex items-start gap-2 p-2 rounded-lg border transition-colors cursor-pointer",
                  yaLeida
                    ? "bg-transparent border-transparent"
                    : "bg-white border-ink/10"
                )}
                onClick={() => manejarClickNotificacion(n)}
              >
                {!yaLeida && (
                  <div className="shrink-0 mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                )}

                <div className="shrink-0 mt-0.5 h-6 w-6 rounded-md flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                  <IconoNotificacion tipo={n.tipo} color={color} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-1.5">
                    <h3 className="font-semibold text-xs text-ink leading-tight">{n.titulo}</h3>
                    <span className="text-[9px] font-medium text-muted uppercase tracking-wider">
                      {n.tipo === "cumpleanos" && n.cuerpo.includes("Hoy")
                        ? t("HOY")
                        : t("AHORA")}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted leading-snug">{n.cuerpo}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-3 py-2 border-t border-ink/10 bg-white/50 rounded-b-xl">
        <p className="text-[10px] text-muted">
          {t("Total")}: {notificaciones.length} · {t("Sin leer")}: {noLeidas.length}
        </p>
        {demo && (
          <button
            onClick={() => setDemo(false)}
            className="mt-1 text-[10px] text-primary underline underline-offset-2 hover:text-primary/90"
          >
            {t("Ocultar demostración")}
          </button>
        )}
        {!demo && !hayNotificacionesReales && (
          <button
            onClick={() => setDemo(true)}
            className="mt-1 text-[10px] text-primary underline underline-offset-2 hover:text-primary/90"
          >
            {t("Ver demostración")}
          </button>
        )}
      </div>
    </div>
  ) : (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 animate-fade-in bg-ink/50 motion-reduce:animate-none"
        onClick={() => {
          onCerrar();
        }}
      />

      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-cream border-l border-ink/15 shadow-xl flex flex-col motion-reduce:animate-none lg:hidden">
        <div className="flex items-center justify-between bg-white px-6 py-4 border-b border-ink/10">
          <button
            onClick={volverAtras}
            className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent transition-colors"
            aria-label="Volver atras"
          >
            &larr; Atras
          </button>
          <h2 className="font-script text-2xl text-ink flex-1 text-center">
            {t("Notificaciones")}
          </h2>
          {noLeidas.length > 0 && !demo && (
            <button
              onClick={marcarTodasLeidas}
              className="text-xs font-semibold text-primary hover:text-primary/90 underline underline-offset-2"
            >
              {t("Marcar todo como leído")}
            </button>
          )}
        </div>

        {mostrarDemo && !hayNotificacionesReales && (
          <div className="px-4 py-2 bg-gold/10 border-b border-gold/30">
            <p className="text-xs text-center text-gold/90 font-medium">
              Demo - Asi se ven las notificaciones
            </p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3">
          {notificaciones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <span style={{ fontSize: 24 }}>!</span>
              </div>
              <p className="font-semibold text-ink">{t("Sin notificaciones")}</p>
              <p className="mt-1 text-sm text-muted">
                {t("Cuando haya algo nuevo, aparecera aqui.")}
              </p>
            </div>
          ) : (
            notificaciones.map((n) => {
              const color = colorPorTipo(n.tipo);
              const yaLeida = leidas.has(n.id);
              return (
                <div
                  key={n.id}
                  className={cn(
                    "group flex items-start gap-3 p-3 rounded-xl border transition-colors cursor-pointer",
                    yaLeida
                      ? "bg-transparent border-transparent"
                      : "bg-white border-ink/10"
                  )}
                  onClick={() => manejarClickNotificacion(n)}
                >
                  {!yaLeida && (
                    <div className="shrink-0 mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  )}

                    <div className="shrink-0 mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                      <IconoNotificacion tipo={n.tipo} color={color} />
                    </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <h3 className="font-semibold text-sm text-ink leading-tight">{n.titulo}</h3>
                      <span className="text-[10px] font-medium text-muted uppercase tracking-wider">
                        {n.tipo === "cumpleanos" && n.cuerpo.includes("Hoy")
                          ? t("HOY")
                          : t("AHORA")}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted leading-snug">{n.cuerpo}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="px-6 py-4 border-t border-ink/10 bg-white/50">
          <p className="text-xs text-muted">
            {t("Total")}: {notificaciones.length} · {t("Sin leer")}: {noLeidas.length}
          </p>
          {demo && (
            <button
              onClick={() => setDemo(false)}
              className="mt-2 text-xs text-primary underline underline-offset-2 hover:text-primary/90"
            >
              {t("Ocultar demostración")}
            </button>
          )}
          {!demo && !hayNotificacionesReales && (
            <button
              onClick={() => setDemo(true)}
              className="mt-2 text-xs text-primary underline underline-offset-2 hover:text-primary/90"
            >
              {t("Ver demostración")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
