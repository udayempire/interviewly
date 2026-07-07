"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
    LayoutDashboard,
    Mic2,
    User,
    Settings,
    LogOut,
} from "lucide-react"
import { useEffect, useState } from "react"

const mainNav = [
    { label: "Home", href: "/home", icon: LayoutDashboard },
    { label: "Interviews", href: "/interview", icon: Mic2 },
]

const accountNav = [
    { label: "Profile", href: "/profile", icon: User },
    { label: "Settings", href: "/settings", icon: Settings },
]

export function AppSidebar() {
    const pathname = usePathname()
    const [userName, setUserName] = useState("You")
    const [userInitial, setUserInitial] = useState("Y")

    useEffect(() => {
        try {
            const raw = localStorage.getItem("user")
            if (raw) {
                const u = JSON.parse(raw)
                if (u?.name) {
                    setUserName(u.name)
                    setUserInitial(u.name.charAt(0).toUpperCase())
                }
            }
        } catch { /* ignore */ }
    }, [])

    return (
        <Sidebar collapsible="icon">

            {/* ── Header: app logo ── */}
            <SidebarHeader className="px-3 py-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            asChild
                            className="hover:bg-sidebar-accent"
                        >
                            <Link href="/home" className="flex items-center gap-3">
                                {/* App icon */}
                                <div className="h-8 w-8 shrink-0 rounded-[8px] bg-gradient-to-br from-blue-600 to-indigo-500 flex items-center justify-center shadow-sm">
                                    <span className="text-[12px] font-bold text-white leading-none">I</span>
                                </div>
                                <div className="flex flex-col leading-tight">
                                    <span className="text-[14px] font-semibold text-sidebar-foreground tracking-tight">
                                        Interviewlyy
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <hr className="mx-3 border-none h-px bg-sidebar-border" />

            {/* ── Content: main nav + account nav ── */}
            <SidebarContent className="px-2 py-2">

                {/* Main group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-widest px-2 mb-1">
                        Main
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {mainNav.map(({ label, href, icon: Icon }) => (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === href}
                                        tooltip={label}
                                        className="rounded-lg"
                                    >
                                        <Link href={href} className="flex items-center gap-2.5">
                                            <Icon className="h-[17px] w-[17px] shrink-0" />
                                            <span className="text-[13px] font-medium">{label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {/* Account group */}
                <SidebarGroup>
                    <SidebarGroupLabel className="text-[11px] font-medium text-sidebar-foreground/40 uppercase tracking-widest px-2 mb-1">
                        Account
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {accountNav.map(({ label, href, icon: Icon }) => (
                                <SidebarMenuItem key={href}>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={pathname === href}
                                        tooltip={label}
                                        className="rounded-lg"
                                    >
                                        <Link href={href} className="flex items-center gap-2.5">
                                            <Icon className="h-[17px] w-[17px] shrink-0" />
                                            <span className="text-[13px] font-medium">{label}</span>
                                        </Link>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

            </SidebarContent>

            <hr className="mx-3 border-none h-px bg-sidebar-border" />

            {/* ── Footer: logout + user avatar ── */}
            <SidebarFooter className="px-2 py-3">
                <SidebarMenu>

                    {/* Logout */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            tooltip="Log out"
                            className="rounded-lg text-sidebar-foreground/60 hover:text-red-500 hover:bg-red-50"
                        >
                            <Link href="/signin" className="flex items-center gap-2.5">
                                <LogOut className="h-4.25 w-4.25 shrink-0" />
                                <span className="text-[13px] font-medium">Log out</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* User avatar */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            tooltip={userName}
                            className="rounded-lg"
                        >
                            <Link href="/profile" className="flex items-center gap-3">
                                {/* Gradient avatar with initial */}
                                <div className="h-8 w-8 shrink-0 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                    <span className="text-[12px] font-semibold text-white leading-none">
                                        {userInitial}
                                    </span>
                                </div>
                                <div className="flex flex-col leading-tight min-w-0">
                                    <span className="text-[13px] font-medium text-sidebar-foreground truncate">
                                        {userName}
                                    </span>
                                    <span className="text-[11px] text-sidebar-foreground/50">
                                        View profile
                                    </span>
                                </div>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                </SidebarMenu>
            </SidebarFooter>

        </Sidebar>
    )
}