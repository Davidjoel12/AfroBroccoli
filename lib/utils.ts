import { twMerge } from "tailwind-merge";

// Une clases solo si estan definidas y resuelve conflictos: la que va despues gana
// (asi, Card con bg-white + className="bg-ink" usa bg-ink)
export function cn(...classes: (string | false | null | undefined)[]) {
  return twMerge(classes.filter(Boolean).join(" "));
}
