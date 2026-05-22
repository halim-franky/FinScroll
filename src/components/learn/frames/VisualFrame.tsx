"use client";

import { useMemo } from "react";
import Lottie from "lottie-react";
import type { Card } from "@/lib/learn/types";
import { ANIMATIONS, pickAnimation } from "@/lib/learn/lottieAnimations";

interface Props {
  card: Card;
  isActive: boolean;
}

export function VisualFrame({ card, isActive }: Props) {
  const animationData = useMemo(() => {
    const key = card.animation ?? pickAnimation(card.topic, card.level);
    return ANIMATIONS[key];
  }, [card.animation, card.topic, card.level]);

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center gap-6 animate-fadeIn">
      <div className="w-full max-w-[280px] aspect-[4/3]">
        {/* Cast through unknown because hand-crafted Lottie JSON
            is structurally compatible but typed as plain object */}
        <Lottie
          animationData={animationData as unknown as object}
          loop
          autoplay={isActive}
        />
      </div>
      {card.visualData && card.visualData.length > 0 && (
        <div className="w-full max-w-xs space-y-3">
          {card.visualData.map((d) => (
            <div key={d.label} className="space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-zinc-400 font-medium">{d.label}</span>
                <span className="text-zinc-100 font-bold">{d.value}</span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-zinc-900 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-1000"
                  style={{ width: isActive ? `${d.percent}%` : "0%" }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
