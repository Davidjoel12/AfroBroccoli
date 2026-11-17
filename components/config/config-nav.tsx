"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n/language-provider";
import { useUsuario } from "@/lib/use-usuario";

const ITEMS = [
  {
    href: "/configuracion",
    label: "Perfil",
    soloAdmin: false,
    // Sello festoneado con check (Tabler "rosette-discount-check", ISC)
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M5 7.2a2.2 2.2 0 0 1 2.2 -2.2h1a2.2 2.2 0 0 0 1.55 -.64l.7 -.7a2.2 2.2 0 0 1 3.12 0l.7 .7c.412 .41 .97 .64 1.55 .64h1a2.2 2.2 0 0 1 2.2 2.2v1c0 .58 .23 1.138 .64 1.55l.7 .7a2.2 2.2 0 0 1 0 3.12l-.7 .7a2.2 2.2 0 0 0 -.64 1.55v1a2.2 2.2 0 0 1 -2.2 2.2h-1a2.2 2.2 0 0 0 -1.55 .64l-.7 .7a2.2 2.2 0 0 1 -3.12 0l-.7 -.7a2.2 2.2 0 0 0 -1.55 -.64h-1a2.2 2.2 0 0 1 -2.2 -2.2v-1a2.2 2.2 0 0 0 -.64 -1.55l-.7 -.7a2.2 2.2 0 0 1 0 -3.12l.7 -.7a2.2 2.2 0 0 0 .64 -1.55v-1" />
        <path d="M9 12l2 2l4 -4" />
      </svg>
    ),
  },
  {
    href: "/configuracion/personalizar-tarjeta",
    label: "Personalizar tarjeta",
    soloAdmin: false,
    // Rodillo de pintura (Lucide "paint-roller", ISC)
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect width="16" height="6" x="2" y="2" rx="2" />
        <path d="M10 16v-2a2 2 0 0 1 2-2h8a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect width="4" height="6" x="8" y="16" rx="1" />
      </svg>
    ),
  },
  {
    href: "/configuracion/miembros",
    label: "Miembros",
    soloAdmin: true,
    // Personas (Lucide "users", ISC)
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

export default function ConfigNav() {
  const pathname = usePathname();
  const t = useT();
  const { usuario } = useUsuario();
  const items = ITEMS.filter(
    (item) => !item.soloAdmin || usuario?.role === "admin"
  );
  const activa = (href: string) =>
    href === "/configuracion"
      ? pathname === "/configuracion"
      : pathname.startsWith(href);

  return (
    <>
      {/* Móvil / tablet: pills */}
      <nav
        aria-label="Secciones de configuración"
        className="flex flex-wrap gap-2 lg:hidden"
      >
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={activa(item.href) ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center whitespace-nowrap rounded-full border bg-white px-4 text-sm font-medium transition-colors",
              activa(item.href)
                ? "border-primary/40 text-primary"
                : "border-ink/15 text-ink hover:border-ink/30",
            )}
          >
            {t(item.label)}
          </Link>
        ))}
      </nav>

      {/* Desktop: menú lateral (tarjeta blanca) */}
      <aside className="hidden rounded-card bg-white p-2 shadow-sm lg:block">
        <nav aria-label="Secciones de configuración" className="flex flex-col">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activa(item.href) ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-colors",
                activa(item.href)
                  ? "bg-primary/15 text-ink"
                  : "text-ink/80 hover:bg-ink/5 hover:text-ink",
              )}
            >
              {activa(item.href) && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 inset-y-1.5 w-1.5 rounded-r-full bg-primary"
                />
              )}
              <span className="shrink-0">{item.icon}</span>
              {t(item.label)}
            </Link>
          ))}
        </nav>
      </aside>
    </>
  );
}
