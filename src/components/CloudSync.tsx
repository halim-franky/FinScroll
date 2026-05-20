"use client";

import { useEffect } from "react";
import { pullState } from "@/lib/cloudSync";

interface Props {
  userId: string;
}

/**
 * Mounted in (app)/layout. Pulls the server-side state once on mount
 * and merges into localStorage. Renders nothing.
 *
 * Subsequent writes are debounced from each site that mutates state.
 */
export function CloudSync({ userId }: Props) {
  useEffect(() => {
    if (!userId || userId === "guest") return;
    void pullState(userId);
  }, [userId]);

  return null;
}
