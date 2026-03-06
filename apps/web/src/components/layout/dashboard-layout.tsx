"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { ReactNode, useEffect, useMemo, useState, useSyncExternalStore } from "react"
import {
  BarChart3Icon,
  BoxesIcon,
  ChevronDownIcon,
  LayoutDashboardIcon,
  LogOutIcon,
  SettingsIcon,
  Settings2Icon,
  MenuIcon,
  UsersRoundIcon,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { getAuthPayload, logout } from "@/lib/auth"
import { cn } from "@/lib/utils"
import { UserAvatar } from "@/components/ui/user-avatar"

type DashboardShellProps = {
  children: ReactNode
}

type NavItem = {
  href: string
  label: string
  userLabel?: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboardIcon },
  { href: "/analytics", label: "Analytics", icon: BarChart3Icon },
  { href: "/users", label: "User Management", userLabel: "Profile", icon: UsersRoundIcon },
  { href: "/equipment", label: "Equipment", icon: BoxesIcon },
  { href: "/maintenance", label: "Maintenance", icon: Settings2Icon },
]
const SIDEBAR_COLLAPSED_KEY = "dashboard_sidebar_collapsed"
const SIDEBAR_AUTO_COLLAPSE_BREAKPOINT = 1100

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
  "/settings": { label: "Settings", showWelcome: false },
}

let shellHydrated = false
const shellHydrationSubscribers = new Set<() => void>()

function subscribeShellHydration(callback: () => void) {
  shellHydrationSubscribers.add(callback)

  if (!shellHydrated) {
    shellHydrated = true
    Promise.resolve().then(() => {
      for (const subscriber of shellHydrationSubscribers) {
        subscriber()
      }
    })
  }

  return () => {
    shellHydrationSubscribers.delete(callback)
  }
}

function getShellHydrationSnapshot() {
  return shellHydrated
}

function getShellHydrationServerSnapshot() {
  return false
}

export default function DashboardLayoutShell({ children }: DashboardShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: currentUser } = useCurrentUser()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapseReady, setCollapseReady] = useState(false)
  const hydrated = useSyncExternalStore(
    subscribeShellHydration,
    getShellHydrationSnapshot,
    getShellHydrationServerSnapshot,
  )
  const displayName = useMemo(() => {
    if (currentUser?.name) {
      return currentUser.name
    }

    if (!hydrated) {
      return "System User"
    }

    const payload = getAuthPayload()

    if (payload?.name) {
      return payload.name
    }

    if (payload?.employeeId) {
      return payload.employeeId
    }

    if (payload?.email) {
      return payload.email
    }

    return "System User"
  }, [currentUser, hydrated])
  const currentRole = useMemo(() => {
    if (currentUser?.role) {
      return currentUser.role
    }

    if (!hydrated) {
      return null
    }

    return getAuthPayload()?.role ?? null
  }, [currentUser, hydrated])
  const profileImagePath = useMemo(() => {
    if (currentUser?.profileImagePath) {
      return currentUser.profileImagePath
    }

    if (!hydrated) {
      return null
    }

    return getAuthPayload()?.profileImagePath ?? null
  }, [currentUser, hydrated])
  const visibleNavItems = useMemo(() => {
    if (currentRole === "SUPER_ADMIN") {
      return navItems
    }

    return navItems.filter((item) => !item.adminOnly)
  }, [currentRole])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const storedValue = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY)

    if (storedValue === "true" || storedValue === "false") {
      setCollapsed(storedValue === "true")
      setCollapseReady(true)
      return
    }

    setCollapsed(window.innerWidth < SIDEBAR_AUTO_COLLAPSE_BREAKPOINT)
    setCollapseReady(true)
  }, [])

  useEffect(() => {
    if (!collapseReady || typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
  }, [collapseReady, collapsed])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleResize = () => {
      if (window.innerWidth < SIDEBAR_AUTO_COLLAPSE_BREAKPOINT) {
        setCollapsed(true)
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    if (window.innerWidth < SIDEBAR_AUTO_COLLAPSE_BREAKPOINT) {
      setCollapsed(true)
    }
  }, [pathname])

  const currentPage = useMemo(() => {
    if (pathname === "/users" && currentRole === "USER") {
      return { label: "Profile", showWelcome: false }
    }

    const direct = pageMetadata[pathname]

    if (direct) {
      return direct
    }

    if (pathname.startsWith("/dashboard")) {
      return { label: "Dashboard", showWelcome: false }
    }

    return { label: "Dashboard", showWelcome: false }
  }, [currentRole, pathname])

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  const handleOpenSettings = () => {
    if (currentRole === "USER") {
      router.push("/users")
      return
    }

    router.push("/settings")
  }

  return (
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
      <div className="min-h-screen overflow-x-hidden bg-slate-50 text-slate-900 [--sidebar-collapsed:3.75rem] [--sidebar-expanded:18rem]">
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden overflow-hidden border-r border-slate-200 bg-white shadow-sm transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] md:flex md:flex-col",
            collapsed ? "w-[var(--sidebar-collapsed)]" : "w-[var(--sidebar-expanded)]",
          )}
        >
          <div className={cn("flex h-20 items-center", collapsed ? "justify-center px-2" : "px-4")}>
            <button
              type="button"
              onClick={() => setCollapsed((value) => !value)}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="group flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white shadow-sm transition-colors duration-200 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            >
              <Image
                src="/assets/lnu-logo.png"
                alt="LNU Logo"
                width={40}
                height={40}
                className="h-10 w-10 shrink-0 rounded-md object-contain"
                priority
              />
            </button>
            <div
              className={cn(
                "min-w-0 overflow-hidden transition-[max-width,opacity,transform,margin] duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
                collapsed ? "pointer-events-none ml-0 max-w-0 -translate-x-2 opacity-0" : "ml-3 max-w-[11rem] translate-x-0 opacity-100",
              )}
            >
                <p className="text-sm font-bold tracking-wide text-slate-900">LNU CMT</p>
                <p className="text-xs text-slate-500">Monitoring System</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-2 py-4">
            {visibleNavItems.map(({ href, label, userLabel, icon: Icon }) => {
              const active = pathname === href
              const effectiveLabel =
                currentRole === "USER" && userLabel ? userLabel : label

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "group relative flex h-10 items-center rounded-lg text-sm font-medium transition-[background-color,color,padding,transform] duration-300",
                    active
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                    collapsed ? "justify-center px-0" : "gap-3 px-3",
                  )}
                >
                  <Icon className={cn("size-5 shrink-0", active ? "text-white" : "text-slate-500 group-hover:text-slate-700")} />
                  <span
                    className={cn(
                      "overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      collapsed ? "max-w-0 -translate-x-1 opacity-0" : "max-w-[10rem] translate-x-0 opacity-100",
                    )}
                  >
                    {effectiveLabel}
                  </span>
                </Link>
              )
            })}
          </nav>

          <footer className={cn("border-t border-slate-200 py-4 text-xs text-slate-500 transition-[padding] duration-300", collapsed ? "px-2 text-center" : "px-4")}>
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
            {visibleNavItems.map(({ href, label, userLabel, icon: Icon }) => (
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
                {currentRole === "USER" && userLabel ? userLabel : label}
              </Link>
            ))}
          </div>
          <div className="mt-auto border-t border-slate-200 px-4 py-4 text-xs text-slate-500">©LNU CMT Office</div>
        </SheetContent>

        <div
          className={cn(
            "transition-[margin-left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
            collapsed ? "md:ml-[var(--sidebar-collapsed)]" : "md:ml-[var(--sidebar-expanded)]",
          )}
        >
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
                  <Button variant="ghost" className="group h-auto gap-3 rounded-full px-2 py-1.5 hover:bg-slate-100">
                    <UserAvatar
                      name={displayName}
                      profileImagePath={profileImagePath}
                      loading="eager"
                    />
                    <span className="hidden text-sm font-medium text-slate-700 sm:inline">{displayName}</span>
                    <ChevronDownIcon className="anim-caret hidden size-4 text-slate-500 sm:inline group-data-[state=open]:rotate-180" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleOpenSettings} className="cursor-pointer">
                    <SettingsIcon className="mr-2 size-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600">
                    <LogOutIcon className="mr-2 size-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="min-h-[calc(100vh-5rem)] p-4 md:p-8">
            <div key={pathname} className="anim-page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Sheet>
  )
}
