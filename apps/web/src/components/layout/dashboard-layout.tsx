"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useEffect, useMemo, useState } from "react"
import {
  BarChart3Icon,
  BoxesIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  Settings2Icon,
  MenuIcon,
  UsersRoundIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { getAuthPayload, logout } from "@/lib/auth"
import { cn } from "@/lib/utils"

type DashboardShellProps = {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/users", label: "User Management", icon: UsersRoundIcon },
  { href: "/equipment", label: "Equipment", icon: BoxesIcon },
  { href: "/maintenance", label: "Maintenance", icon: Settings2Icon },
]

const pageMetadata: Record<
  string,
  {
    label: string
    showWelcome: boolean
  }
> = {
  "/dashboard": { label: "Dashboard", showWelcome: true },
  "/analytics": { label: "Analytics", showWelcome: false },
  "/users": { label: "User Management", showWelcome: false },
  "/equipment": { label: "Equipment", showWelcome: false },
  "/maintenance": { label: "Maintenance", showWelcome: false },
}

export default function DashboardLayoutShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [displayName, setDisplayName] = useState("System User")

  useEffect(() => {
    const payload = getAuthPayload()

    if (payload?.name) {
      setDisplayName(payload.name)
      return
    }

    if (payload?.employeeId) {
      setDisplayName(payload.employeeId)
      return
    }

    if (payload?.email) {
      setDisplayName(payload.email)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCollapsed(true)
    }, 1800)

    return () => window.clearTimeout(timer)
  }, [])

  const currentPage = useMemo(() => {
    const direct = pageMetadata[pathname]

    if (direct) {
      return direct
    }

    if (pathname.startsWith("/dashboard")) {
      return { label: "Dashboard", showWelcome: false }
    }

    return { label: "Dashboard", showWelcome: false }
  }, [pathname])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden border-r border-slate-200 bg-white shadow-sm transition-all duration-300 ease-in-out md:flex md:flex-col",
            collapsed ? "w-20" : "w-72",
          )}
        >
          <div className="flex h-20 items-center px-4">
            <div className="flex items-center gap-3 overflow-hidden">
              <Image
                src="/assets/lnu-logo.png"
                alt="LNU Logo"
                width={40}
                height={40}
                className="shrink-0 rounded-md"
                priority
              />
              <div className={cn("transition-opacity", collapsed ? "opacity-0" : "opacity-100")}>
                <p className="text-sm font-bold tracking-wide text-slate-900">LNU CMT</p>
                <p className="text-xs text-slate-500">Monitoring System</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="ml-auto hidden text-slate-500 hover:text-slate-900 md:inline-flex"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <ChevronRightIcon className="size-4" /> : <ChevronLeftIcon className="size-4" />}
            </Button>
          </div>

          <nav className="flex-1 space-y-2 px-3 py-4">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    collapsed && "justify-center px-2",
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-slate-700")} />
                  <span className={cn("truncate transition-opacity", collapsed ? "hidden" : "block")}>{label}</span>
                </Link>
              )
            })}
          </nav>

          <footer className="border-t border-slate-200 px-4 py-4 text-xs text-slate-500">
            <span className={collapsed ? "sr-only" : "inline"}>©LNU CMT Office</span>
            {collapsed && <span className="flex justify-center">©</span>}
          </footer>
        </aside>

        <SheetContent side="left" className="w-72 p-0" showCloseButton>
          <SheetHeader className="border-b border-slate-200 px-4 py-4 text-left">
            <SheetTitle className="flex items-center gap-2 text-slate-900">
              <Image src="/assets/lnu-logo.png" alt="LNU Logo" width={32} height={32} />
              LNU CMT
            </SheetTitle>
            <SheetDescription>Monitoring System</SheetDescription>
          </SheetHeader>
          <div className="space-y-2 px-3 py-4">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  pathname === href ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </div>
          <div className="mt-auto border-t border-slate-200 px-4 py-4 text-xs text-slate-500">©LNU CMT Office</div>
        </SheetContent>

        <div className={cn("transition-all duration-300 ease-in-out", collapsed ? "md:ml-20" : "md:ml-72")}>
          <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
            <div className="flex h-20 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-3">
                <SheetTrigger asChild className="md:hidden">
                  <Button variant="outline" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open menu">
                    <MenuIcon className="size-4" />
                  </Button>
                </SheetTrigger>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-slate-900">{currentPage.label}</p>
                  {currentPage.showWelcome && (
                    <p className="text-sm text-slate-500">Welcome back to your monitoring dashboard</p>
                  )}
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-auto gap-3 rounded-full px-2 py-1.5 hover:bg-slate-100">
                    <span className="flex size-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
                      {displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <span className="hidden text-sm font-medium text-slate-700 sm:inline">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOutIcon className="mr-2 size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="min-h-[calc(100vh-5rem)] p-4 md:p-8">{children}</main>
        </div>
      </div>
    </Sheet>
  )
}
