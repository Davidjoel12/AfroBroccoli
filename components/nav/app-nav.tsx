"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

const RUTAS = [
  { href: "/", label: "Home" },
  { href: "/qr", label: "Código QR" },
  { href: "/configuracion", label: "Configuración" },
];

function IconMenu() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function IconClose() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function IconBell() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
    </svg>
  );
}

export default function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [menuAbierto, setMenuAbierto] = useState(false);

  async function cerrarSesion() {
    await supabase.auth.signOut();
    setMenuAbierto(false);
    router.push("/login");
    router.refresh();
  }

  const esActiva = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* ===== Barra superior (desktop) ===== */}
      <header className="hidden bg-ink lg:block">
        <nav className="flex w-full items-stretch justify-around px-6 py-3">
          {RUTAS.map((ruta) => (
            <Link
              key={ruta.href}
              href={ruta.href}
              className="flex flex-col items-center gap-1 px-4 pb-1 pt-1"
            >
              <span
                className={`font-script text-xl ${
                  esActiva(ruta.href)
                    ? "text-cream"
                    : "text-muted-nav hover:text-cream"
                }`}
              >
                {ruta.label}
              </span>
              {/* Línea indicadora de 2-3px en verde cuando está activa */}
              <span
                className={`h-[3px] w-full rounded-full ${
                  esActiva(ruta.href) ? "bg-primary" : "bg-transparent"
                }`}
              />
            </Link>
          ))}
          <button
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            onClick={cerrarSesion}
            className="ml-auto flex cursor-pointer items-center rounded-lg px-3 text-muted-nav transition-colors hover:bg-white/5 hover:text-cream"
          >
            <IconLogout />
          </button>
        </nav>
      </header>

      {/* ===== Encabezado (móvil y tablet) ===== */}
      <header className="flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <button
          aria-label="Abrir menú"
          onClick={() => setMenuAbierto(true)}
          className="cursor-pointer text-cream"
        >
          <IconMenu />
        </button>

        <Link href="/" className="font-script text-2xl text-cream">
          AfroBroccoli
        </Link>

        <button
          aria-label="Notificaciones"
          className="relative cursor-pointer text-cream"
        >
          <IconBell />
          {/* Insignia rosa por uso futuro */}
          <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-accent" />
        </button>
      </header>

      {/* ===== Menú lateral (drawer) ===== */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Fondo semitransparente que cierra el menú */}
          <div
            className="absolute inset-0 animate-fade-in bg-ink/50 motion-reduce:animate-none"
            onClick={() => setMenuAbierto(false)}
          />
          <nav className="absolute left-0 top-0 flex w-auto min-w-[220px] animate-drawer-down flex-col gap-2 rounded-br-[20px] bg-cream p-6 shadow-xl motion-reduce:animate-none">
            <div className="mb-6 flex items-center justify-between">
              <span className="font-script text-2xl text-ink">
                AfroBroccoli
              </span>
              <button
                aria-label="Cerrar menú"
                onClick={() => setMenuAbierto(false)}
                className="cursor-pointer text-muted hover:text-ink"
              >
                <IconClose />
              </button>
            </div>

            {RUTAS.map((ruta) => (
              <Link
                key={ruta.href}
                href={ruta.href}
                onClick={() => setMenuAbierto(false)}
                className={`rounded-lg px-4 py-3 font-script text-xl ${
                  esActiva(ruta.href)
                    ? "bg-primary/20 text-ink"
                    : "text-muted hover:bg-ink/5"
                }`}
              >
                {ruta.label}
              </Link>
            ))}

            <button
              onClick={cerrarSesion}
              className="mt-2 flex items-center gap-2 rounded-lg px-4 py-3 text-left font-script text-xl text-muted hover:bg-ink/5 hover:text-ink"
            >
              <IconLogout />
              Salir
            </button>
          </nav>
        </div>
      )}
    </>
  );
}
