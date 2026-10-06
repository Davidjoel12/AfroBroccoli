import {
  Caveat,
  Dancing_Script,
  Pacifico,
  Satisfy,
  Kaushan_Script,
  Great_Vibes,
  Alex_Brush,
  Inter,
} from "next/font/google";

// Tipografia manuscrita: Logo, nombre de marca, titulos tipo "Registrar clientes"
export const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600", "700"],
});

export const dancingScript = Dancing_Script({
  subsets: ["latin"],
  variable: "--font-dancing",
  weight: ["400", "500", "600", "700"],
});

export const pacifico = Pacifico({
  subsets: ["latin"],
  variable: "--font-pacifico",
  weight: "400",
});

export const satisfy = Satisfy({
  subsets: ["latin"],
  variable: "--font-satisfy",
  weight: "400",
});

export const kaushanScript = Kaushan_Script({
  subsets: ["latin"],
  variable: "--font-kaushan",
  weight: "400",
});

export const greatVibes = Great_Vibes({
  subsets: ["latin"],
  variable: "--font-great-vibes",
  weight: "400",
});

export const alexBrush = Alex_Brush({
  subsets: ["latin"],
  variable: "--font-alex-brush",
  weight: "400",
});

// Tipografia sans: todo el contenido (formularios, tablas, cuerpo)
export const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
