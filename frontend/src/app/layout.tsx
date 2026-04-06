import type { Metadata } from "next"
import { Inter } from "next/font/google" // เอา Geist ออกจากตรงนี้
import "./globals.css"
import Providers from "@/components/Providers"
import { cn } from "@/lib/utils";

// ลบบรรทัด const geist = Geist(...) ออกไปก่อน

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-sans", // ตั้งค่า variable ให้ inter แทน
})

export const metadata: Metadata = {
  title: "SideSpark - เริ่มต้น Side Hustle อย่างมั่นใจ",
  description: "แอปที่ช่วยให้นักศึกษาไทยหาไอเดีย side hustle วางแผนโปรเดกต์ และติดตามรายได้เสริมอย่างเป็นระบบ",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th" className={cn("font-sans", inter.variable)}>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}