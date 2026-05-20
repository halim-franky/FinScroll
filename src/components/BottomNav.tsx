"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, Flame, Calculator, MessageCircle } from "lucide-react";

const tabs = [
  { href: "/feed", icon: TrendingUp, label: "Learn" },
  { href: "/roast", icon: Flame, label: "Roast" },
  { href: "/calculate", icon: Calculator, label: "Wealth" },
  { href: "/chat", icon: MessageCircle, label: "AI Coach" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 z-50">
      <div className="flex items-stretch">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                active ? "text-emerald-400" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`}
                strokeWidth={active ? 2.5 : 1.75}
              />
              <span
                className={`text-[10px] font-bold tracking-wide ${
                  active ? "text-emerald-400" : "text-zinc-600"
                }`}
              >
                {label}
              </span>
              {active && (
                <span className="absolute top-0 h-0.5 w-8 bg-emerald-400 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
