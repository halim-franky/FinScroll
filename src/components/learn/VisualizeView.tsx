"use client";

import { useMemo } from "react";
import Lottie from "lottie-react";
import type { Card } from "@/lib/learn/types";
import { ANIMATIONS, pickAnimation } from "@/lib/learn/lottieAnimations";

interface Props {
  cards: readonly Card[];
}

/**
 * Visualize mode strips text down to the bare minimum and lets the
 * animations + numbers do the talking. Same content as Story mode,
 * different cognitive load — pure visual scan.
 */
export function VisualizeView({ cards }: Props) {
  return (
    <div className="h-full overflow-y-auto bg-zinc-950 snap-y snap-mandatory">
      {cards.map((card) => (
        <VisualizeCard key={card.id} card={card} />
      ))}
    </div>
  );
}

function VisualizeCard({ card }: { card: Card }) {
  const animationData = useMemo(() => {
    const key = card.animation ?? pickAnimation(card.topic, card.level);
    return ANIMATIONS[key];
  }, [card.animation, card.topic, card.level]);

  return (
    <div
      className="relative w-full snap-start shrink-0 flex flex-col items-center justify-center px-6"
      style={{ height: "100dvh" }}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${card.gradient}`} />
      <div className="absolute inset-0 bg-black/40" />

      <div className="relative z-10 flex flex-col items-center gap-6 text-center max-w-sm">
        <div className="w-full max-w-[260px] aspect-square">
          <Lottie animationData={animationData as unknown as object} loop autoplay />
        </div>
        <div className="space-y-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
            {card.impactLabel}
          </span>
          <div className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-emerald-300 to-emerald-500">
            {card.impactValue}
          </div>
          <p className="text-sm text-zinc-300 font-medium pt-2">{card.title}</p>
        </div>
      </div>
    </div>
  );
}
