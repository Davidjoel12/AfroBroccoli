import type { Metadata } from "next";
import {
  caveat,
  dancingScript,
  pacifico,
  satisfy,
  kaushanScript,
  greatVibes,
  alexBrush,
  inter,
} from "../fonts";
import "./globals.css";
import "flag-icons/css/flag-icons.min.css";
import { cookies } from "next/headers";
import { LanguageProvider } from "@/components/i18n/language-provider";
import type { Idioma } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "AfroBroccoli - Gestión de clientes",
  description: "Gestion interna de clientes , sellos y equipo del salon",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Idioma elegido por el usuario (cookie) para no parpadear al cargar
  const cookie = (await cookies()).get("afrobroccoli-idioma")?.value;
  const idioma: Idioma = cookie === "en" ? "en" : "es";

  return (
    <html
      lang={idioma}
      className={`${inter.variable} ${caveat.variable} ${dancingScript.variable} ${pacifico.variable} ${satisfy.variable} ${kaushanScript.variable} ${greatVibes.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        <LanguageProvider inicial={idioma}>{children}</LanguageProvider>
      </body>
    </html>
  );
}