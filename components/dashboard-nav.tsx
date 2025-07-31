"use client";

import { LogoutButton } from "@/components/logout-button";
import { User } from "lucide-react";

interface DashboardNavProps {
  userEmail: string;
}

export function DashboardNav({ userEmail }: DashboardNavProps) {
  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5" />
          <span className="font-semibold">App Dashboard</span>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground">
            {userEmail}
          </span>
          <LogoutButton />
        </div>
      </div>
    </nav>
  );
} 