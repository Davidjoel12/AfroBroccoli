import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

// Nota: antes esto era <label> envolviendo children. Eso rompe los menús
// desplegables (un <button> dentro de un <label> recibe el click dos veces).
// Ahora el texto es un <span> y se asocia con htmlFor cuando hay un input.
export function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5 text-sm font-medium text-muted">
      {htmlFor ? <label htmlFor={htmlFor}>{label}</label> : <span>{label}</span>}
      {children}
    </div>
  );
}

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 rounded-lg border border-ink/20 bg-white/50 px-5 py-2 text-ink placeholder:text-muted/70 focus:border-primary focus:ring-2 focus:ring-primary/30 focus:outline-none",
        className,
      )}
      {...props}
    />
  );
}