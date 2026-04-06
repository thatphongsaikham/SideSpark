import { redirect } from "next/navigation"
import UserNavbar from "@/components/layout/UserNavbar"
import ProjectsPage from "@/components/main/ProjectsPage"
import { getServerAuthSession } from "@/lib/server-auth"

export default async function ProjectsRoute() {
  const session = await getServerAuthSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen relative bg-[#F8FAFC] dark:bg-[#1E293B] flex flex-col">
      <UserNavbar user={session.user} />

      <main className="flex-1 container mx-auto px-4 py-8 relative z-10">
        <ProjectsPage />
      </main>
    </div>
  )
}
