"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  TrendingUp, MessageCircle, BarChart3, UserCircle2,
} from "lucide-react";
import { SPRING_TIGHT } from "@/lib/motion";

const tabs = [
  { href: "/feed", icon: TrendingUp, label: "Learn" },
  { href: "/chat", icon: MessageCircle, label: "Coach" },
  { href: "/stats", icon: BarChart3, label: "Stats" },
  { href: "/account", icon: UserCircle2, label: "Account" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-800 z-50">
      <div className="flex items-stretch relative">
        {tabs.map(({ href, icon: Icon, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors relative ${
                active ? "text-emerald-400" : "text-zinc-300 hover:text-white"
              }`}
            >
              {active && (
                // Shared layout pill that smoothly slides between tabs
                <motion.span
                  layoutId="bottom-nav-pill"
                  transition={{ ...SPRING_TIGHT, mass: 0.6 }}
                  className="absolute top-0 h-0.5 w-8 bg-emerald-400 rounded-full"
                />
              )}
              <motion.div
                whileTap={{ scale: 0.85 }}
                transition={SPRING_TIGHT}
                animate={
                  active
                    ? { scale: [1, 1.18, 1.1], transition: { duration: 0.4 } }
                    : { scale: 1 }
                }
              >
                <Icon className="w-5 h-5" strokeWidth={active ? 2.5 : 1.75} />
              </motion.div>
              <span
                className={`text-[10px] font-bold tracking-wide ${
                  active ? "text-emerald-400" : "text-zinc-400"
                }`}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
