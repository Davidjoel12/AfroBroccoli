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

export const metadata: Metadata = {
  title: "AfroBroccoli - Gestión de clientes",
  description: "Gestion interna de clientes , sellos y equipo del salon",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${caveat.variable} ${dancingScript.variable} ${pacifico.variable} ${satisfy.variable} ${kaushanScript.variable} ${greatVibes.variable} ${alexBrush.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink">
        {children}
      </body>
    </html>
  );
}