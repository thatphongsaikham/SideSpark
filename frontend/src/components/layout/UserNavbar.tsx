// components/layout/UserNavbar.tsx
"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { signOut } from "next-auth/react"
import { useEffect, useRef, useState } from "react"
import {
  Search, FolderKanban, Award, Menu, X,
  Settings, Crown, BookOpen, LogOut, ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
interface Props {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
  }
}

// ─── Nav Links ────────────────────────────────────────────────────────────────
const NAV_LINKS = [
  { name: "สำรวจไอเดีย", href: "/main", icon: Search },
  { name: "จัดการโปรเจกต์", href: "/main/projects", icon: FolderKanban },
  { name: "ความสำเร็จ", href: "/main/success", icon: Award },
]

// ─── Component ────────────────────────────────────────────────────────────────
export default function UserNavbar({ user }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Close menu on route change
  useEffect(() => { setMenuOpen(false) }, [pathname])

  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U"

  return (
    <nav
      data-user-navbar
      className="sticky top-0 z-50 border-b border-gray-200/50 dark:border-gray-800/50 bg-[#F8FAFC]/80 dark:bg-[#1E293B]/80 backdrop-blur-md"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">

        {/* Left: Logo */}
        <div className="flex items-center w-auto md:w-1/4">
          <Link href="/main">
            <img
              src="/images/logo.jpg"
              alt="SideSpark"
              width="100"
              className="rounded mix-blend-multiply dark:mix-blend-normal hover:opacity-90 transition-opacity"
            />
          </Link>
        </div>

        {/* Center: Nav Links (ซ่อนในมือถือ) */}
        <div className="hidden md:flex items-center justify-center gap-1 flex-1">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/main" && pathname.startsWith(link.href))
            return (
              <Link key={link.name} href={link.href}>
                <button
                  className={cn(
                    "flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#8A2BE2]/10 text-[#8A2BE2]"
                      : "text-gray-600 hover:text-[#8A2BE2] hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                  )}
                >
                  <link.icon className="w-4 h-4" />
                  {link.name}
                </button>
              </Link>
            )
          })}
        </div>

        {/* Right: Hamburger Menu */}
        <div className="flex items-center justify-end w-auto md:w-1/4" ref={menuRef}>
          <div className="relative">
            {/* Trigger Button */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className={cn(
                "flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full border transition-all",
                menuOpen
                  ? "bg-white dark:bg-gray-800 border-[#7F77DD]/40 shadow-md"
                  : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-900"
              )}
              aria-label="เมนู"
            >
              {menuOpen
                ? <X className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                : <Menu className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              }
              {/* Avatar */}
              <div className="w-7 h-7 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[#534AB7] text-xs font-bold border border-[#AFA9EC]/40">
                {initials}
              </div>
            </button>

            {/* Dropdown Menu */}
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl shadow-black/10 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150 z-50">

                {/* User Info Header */}
                <div className="px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#EEEDFE] flex items-center justify-center text-[#534AB7] text-sm font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
                        {user?.name ?? "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Mobile Navigation Links (แสดงเฉพาะมือถือ) */}
                <div className="md:hidden border-b border-gray-100 dark:border-gray-800 py-1.5">
                  {NAV_LINKS.map((link) => {
                    const isActive =
                      pathname === link.href ||
                      (link.href !== "/main" && pathname.startsWith(link.href))
                    return (
                      <MenuItem
                        key={link.name}
                        icon={<link.icon className="w-4 h-4" />}
                        label={link.name}
                        labelClass={isActive ? "text-[#8A2BE2] font-semibold" : ""}
                        iconClass={isActive ? "text-[#8A2BE2]" : "text-gray-500"}
                        onClick={() => router.push(link.href)}
                      />
                    )
                  })}
                </div>

                {/* Menu Items (Settings, etc.) */}
                <div className="py-1.5">
                  {/* Settings */}
                  <MenuItem
                    icon={<Settings className="w-4 h-4" />}
                    label="Settings"
                    onClick={() => router.push("/settings")}
                  />

                  {/* Upgrade Plan */}
                  <MenuItem
                    icon={<Crown className="w-4 h-4 text-[#534AB7]" />}
                    label="Upgrade plan"
                    labelClass="text-[#534AB7] font-semibold"
                    badge="Pro"
                    onClick={() => router.push("/upgrade")}
                  />

                  {/* Learn More */}
                  <MenuItem
                    icon={<BookOpen className="w-4 h-4" />}
                    label="Learn more"
                    onClick={() => router.push("/learn")}
                  />
                </div>

                {/* Divider + Logout */}
                <div className="border-t border-gray-100 dark:border-gray-800 py-1.5">
                  <MenuItem
                    icon={<LogOut className="w-4 h-4" />}
                    label="Log out"
                    labelClass="text-red-500"
                    iconClass="text-red-400"
                    onClick={() => signOut({ callbackUrl: "/" })}
                  />
                </div>

              </div>
            )}
          </div>
        </div>

      </div>
    </nav>
  )
}

// ─── Menu Item Sub-component ──────────────────────────────────────────────────
function MenuItem({
  icon,
  label,
  labelClass = "",
  iconClass = "text-gray-500",
  badge,
  onClick,
}: {
  icon: React.ReactNode
  label: string
  labelClass?: string
  iconClass?: string
  badge?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group"
    >
      <span className={cn("shrink-0", iconClass)}>{icon}</span>
      <span className={cn("flex-1 text-sm text-left text-gray-700 dark:text-gray-200", labelClass)}>
        {label}
      </span>
      {badge && (
        <span className="text-[10px] bg-[#EEEDFE] text-[#534AB7] font-bold px-2 py-0.5 rounded-full">
          {badge}
        </span>
      )}
      {!badge && (
        <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-400 transition-colors" />
      )}
    </button>
  )
}
