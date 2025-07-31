"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { 
  Home, 
  LayoutDashboard, 
  Package, 
  FileText, 
  BarChart3, 
  Users,
  Settings,
  Bell,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProductsNavProps {
  userEmail: string;
}

export function ProductsNav({ userEmail }: ProductsNavProps) {
  const pathname = usePathname();

  const navigation = [
    { name: "Home", href: "/", icon: Home },
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Products", href: "/products", icon: Package },
    { name: "Invoices", href: "/invoices", icon: FileText },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Users", href: "/users", icon: Users },
  ];

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between">
          {/* Left side */}
          <div className="flex">
            {/* Logo */}
            <div className="flex flex-shrink-0 items-center">
              <div className="w-8 h-8 theme-bg rounded-lg flex items-center justify-center">
                <span className="text-white font-semibold text-sm">U</span>
              </div>
              <span className="ml-2 text-xl font-semibold text-gray-900">Untitled UI</span>
            </div>

            {/* Navigation links */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                                         className={cn(
                       "inline-flex items-center border-b-2 px-1 pt-1 text-sm font-medium",
                       isActive
                         ? "border-[var(--theme-green)] text-gray-900"
                         : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                     )}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Upgrade button */}
            <button className="btn-pri inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-green)]">
              <Zap className="mr-2 h-4 w-4" />
              Upgrade now
            </button>

            {/* Settings */}
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Settings className="h-5 w-5" />
            </button>

            {/* Notifications */}
            <button className="p-2 text-gray-400 hover:text-gray-500">
              <Bell className="h-5 w-5" />
            </button>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-500">
                {userEmail}
              </div>
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 font-medium text-sm">
                  {userEmail.charAt(0).toUpperCase()}
                </span>
              </div>
              <LogoutButton />
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
} 