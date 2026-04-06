import { redirect } from "next/navigation"
import UserNavbar from "@/components/layout/UserNavbar"
import Footer from "@/components/layout/Footer"
import CheckoutPage from "@/components/upgrade/CheckoutPage"
import { getServerAuthSession } from "@/lib/server-auth"

export default async function UpgradeProRoute() {
  const session = await getServerAuthSession()
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#1E293B] flex flex-col">
      <UserNavbar user={session.user} />
      <main className="flex-1 container mx-auto px-4 py-8">
        <CheckoutPage planId="pro" />
      </main>
      <Footer />
    </div>
  )
}
