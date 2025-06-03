import SidebarV0 from "../components/dashboard/Sidebar"
import Navbar from "../components/Navbar"


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
    <Navbar/>
    <div className="flex h-[calc(100vh-3.5rem)] w-full">
      <SidebarV0 /> {/* Nossa nova sidebar estilo v0 */}
      <main className="flex-1 overflow-y-auto">
        {children} {/* Aqui será renderizada a página do chat específico */}
      </main>
    </div>
    </>
  )
}