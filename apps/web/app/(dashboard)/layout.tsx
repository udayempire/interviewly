import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/appSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex min-h-screen w-full flex-1 flex-col overflow-hidden bg-[#faf9f5]">
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}