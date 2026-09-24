"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut, Mic2, Settings, User } from "lucide-react";
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
} from "@/components/ui/sidebar";
import { eraseCookie } from "@/lib/cookies";

const mainNav = [
  { label: "Home", href: "/home", icon: LayoutDashboard },
  { label: "Interviews", href: "/interview", icon: Mic2 },
];
const accountNav = [
  { label: "Profile", href: "/profile", icon: User },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("You");
  const [userProfileImage, setUserProfileImage] = useState("");
  const [userInitial, setUserInitial] = useState("Y");

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/auth/me`,
          { credentials: "include" },
        );
        if (!response.ok) return;
        const data = await response.json();
        if (data.user?.name) {
          setUserName(data.user.name);
          setUserInitial(data.user.name.charAt(0).toUpperCase());
          setUserProfileImage(data.user.userProfile?.profileImageUrl ?? "");
        }
      } catch {
        /* User details are non-critical. */
      }
    }
    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}/auth/logout`,
        { method: "POST", credentials: "include" },
      );
    } catch {
      /* Clear local session regardless. */
    }
    eraseCookie("token");
    router.push("/signin");
  };

  const navigation = (items: typeof mainNav) =>
    items.map(({ label, href, icon: Icon }) => {
      const active = pathname === href;
      return (
        <SidebarMenuItem key={href}>
          <SidebarMenuButton
            isActive={active}
            tooltip={label}
            className={`h-9 rounded-none transition-colors ${active ? "bg-amber-100 text-stone-900 dark:bg-amber-300 dark:text-stone-900" : "text-stone-600 hover:bg-stone-200 hover:text-stone-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"}`}
          >
            <Link href={href} className="flex items-center gap-2.5">
              <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
              <span className="text-[13px] font-medium">{label}</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
      );
    });

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-stone-200 bg-stone-100 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <SidebarHeader className="border-b border-stone-200 px-3 py-4 dark:border-zinc-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="rounded-none hover:bg-transparent"
            >
              <Link href="/home" className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full border-2 border-stone-900 bg-amber-300 text-[11px] font-bold text-stone-900 dark:border-zinc-100">
                  i.
                </span>
                <span className="text-[15px] font-bold tracking-[-0.055em] text-stone-900 dark:text-zinc-100">
                  interviewlyy
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="px-2 py-4">
        <SidebarGroup className="p-0">
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-500">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{navigation(mainNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="mt-6 p-0">
          <SidebarGroupLabel className="mb-1 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-stone-500 dark:text-zinc-500">
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>{navigation(accountNav)}</SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-stone-200 px-2 py-3 dark:border-zinc-800">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Log out"
              onClick={handleLogout}
              className="h-9 rounded-none text-stone-500 hover:bg-red-50 hover:text-red-700 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-300"
            >
              <span className="flex items-center gap-2.5">
                <LogOut className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                <span className="text-[13px] font-medium">Log out</span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip={userName}
              className="mt-1 rounded-none hover:bg-stone-200 dark:hover:bg-zinc-800"
            >
              <Link href="/profile" className="flex items-center gap-3">
                {userProfileImage ? (
                  <Image
                    src={userProfileImage}
                    alt="Profile"
                    width={28}
                    height={28}
                    className="rounded-full"
                  />
                ) : (
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-zinc-900 text-[11px] font-semibold text-amber-300 dark:bg-amber-300 dark:text-stone-900">
                    {userInitial}
                  </span>
                )}
                <span className="min-w-0 truncate text-[13px] font-medium text-stone-900 dark:text-zinc-100">
                  {userName}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
