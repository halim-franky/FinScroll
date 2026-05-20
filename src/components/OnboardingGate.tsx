"use client";

import { useEffect, useState } from "react";
import { OnboardingModal, readOnboarding, type OnboardingData } from "./OnboardingModal";

interface Props {
  userId: string;
  children: React.ReactNode;
}

export function OnboardingGate({ userId, children }: Props) {
  // null = unknown (still reading), true = needs modal, false = completed
  const [needs, setNeeds] = useState<boolean | null>(null);

  useEffect(() => {
    const data = readOnboarding(userId);
    setNeeds(data === null);
  }, [userId]);

  if (needs === null) {
    // Loading state — invisible to avoid flash
    return <div className="h-full bg-zinc-950" />;
  }

  if (needs) {
    return (
      <OnboardingModal
        userId={userId}
        onComplete={(_data: OnboardingData) => setNeeds(false)}
      />
    );
  }

  return <>{children}</>;
}
