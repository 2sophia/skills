"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UserMenu() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? "—";
  const name = session?.user?.name ?? email.split("@")[0];

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-end leading-tight">
        <span className="text-sm font-medium">{name}</span>
        <span className="text-xs text-muted-foreground">{email}</span>
      </div>
      <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
        {name.charAt(0).toUpperCase()}
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => signOut({ callbackUrl: "/auth" })}
        aria-label="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </div>
  );
}
