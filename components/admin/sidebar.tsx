"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Package,
  Settings,
  LogOut,
  BarChart3,
  FileText,
  ShoppingCart,
  FolderTree,
  Newspaper,
  Building2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"

const navigation = [
  {
    name: "Products",
    href: "/admin/products",
    icon: Package,
  },
  {
    name: "Price Quotes",
    href: "/admin/quotes",
    icon: FileText,
  },
  {
    name: "News",
    href: "/admin/news",
    icon: Newspaper,
  },
  {
    name: "Special Order",
    href: "/admin/special-orders",
    icon: ShoppingCart,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: FolderTree,
  },
  {
    name: "Reports",
    href: "/admin/reports",
    icon: BarChart3,
  },
  {
    name: "Company Info",
    href: "/admin/company-info",
    icon: Building2,
  },
  {
    name: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-4 sm:px-6">
        <h1 className="text-lg sm:text-xl font-bold truncate">Bayanundur Admin</h1>
      </div>
      <nav className="flex-1 space-y-1 p-2 sm:p-4 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-2 sm:gap-3 rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span className="truncate">{item.name}</span>
            </Link>
          )
        })}
      </nav>
      <div className="border-t p-2 sm:p-4 space-y-2">
        {user && (
          <div className="px-2 sm:px-3 py-2 text-xs sm:text-sm text-muted-foreground">
            <p className="font-medium text-foreground truncate">{user.displayName || user.email || "User"}</p>
            <p className="text-xs truncate">{user.email}</p>
            {user.role && <p className="text-xs">{user.role}</p>}
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start text-xs sm:text-sm"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}

