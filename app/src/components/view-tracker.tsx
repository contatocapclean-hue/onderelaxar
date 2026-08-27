"use client";

import { useEffect } from "react";

export function ViewTracker({ professionalId }: { professionalId: string }) {
  useEffect(() => {
    fetch("/api/stats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ professionalId, field: "views" }),
    }).catch(() => {});
  }, [professionalId]);

  return null;
}
