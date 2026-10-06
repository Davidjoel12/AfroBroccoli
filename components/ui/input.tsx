import { InputHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-muted">
      {label}
      {children}
    </label>
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