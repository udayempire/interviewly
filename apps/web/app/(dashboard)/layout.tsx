import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/ui/appSidebar"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="flex flex-1 flex-col min-h-screen w-full overflow-hidden bg-white">
                <div className="flex-1 overflow-y-auto">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}