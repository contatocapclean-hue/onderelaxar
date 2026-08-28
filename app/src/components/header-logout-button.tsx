"use client";

import { useRouter } from "next/navigation";

export function HeaderLogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="inline-flex items-center rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-beige-soft transition-colors"
    >
      Sair
    </button>
  );
}
