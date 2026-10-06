"use client";

import { cn } from "@/lib/utils";

export function PillTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: string[];
  active: string;
  onChange: (tab: string) => void;
}) {
  return (
    <div className="flex gap-2">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={cn(
            "h-9 cursor-pointer rounded-full border px-4 text-sm font-medium transition-colors",
            active === tab
              ? "border-ink/15 bg-white text-primary"
              : "border-ink/15 bg-transparent text-muted hover:text-ink",
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}