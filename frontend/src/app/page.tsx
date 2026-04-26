// app/page.tsx (ไม่จำเป็นต้องมี "use client" แล้ว เพราะส่วนที่อัปเดต UI ย้ายไปอยู่ไฟล์ย่อยแล้ว)
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HeroSection from "@/components/home/HeroSection"
import FeaturesSection from "@/components/home/FeaturesSection"
import PricingSection from "@/components/home/PricingSection"

export default function Home() {
  return (
    <div className="min-h-screen relative bg-[#F8FAFC] dark:bg-[#1E293B] overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <Navbar />

      <main className="container mx-auto px-4 py-20 relative z-10">
        <HeroSection />
        <FeaturesSection />
        <PricingSection />
      </main>

      <Footer />
    </div>
  )
}
