import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const searchParams = req.nextUrl.searchParams;

  // 1. ตรวจสอบ Session จาก Cookie ของ NextAuth
  const session = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 2. Logic: ถ้า Login แล้ว และอยู่ที่หน้า Root ('/')
  if (path === "/" && session) {
    // ส่งผู้ใช้ไปหน้าไอเดียหลักให้ชัดเจน
    return NextResponse.redirect(new URL("/main", req.url));
  }

  // 3. กันเหนียว: ถ้าพยายามเข้าหน้า /login ทั้งที่ Login แล้ว ให้ส่งไปหน้าแรก
  if (path === "/login" && session) {
    return NextResponse.redirect(new URL("/main", req.url));
  }

  // 4. ถ้าเข้าหน้า /login แบบไม่มีเป้าหมายปลายทาง ให้เติม redirect=/main
  if (path === "/login" && !session) {
    const hasRedirectTarget =
      searchParams.has("redirect") || searchParams.has("callbackUrl");

    if (!hasRedirectTarget) {
      const loginUrl = req.nextUrl.clone();
      loginUrl.searchParams.set("redirect", "/main");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // กำหนดให้ Middleware ทำงานเฉพาะหน้าแรก และหน้า Login
  matcher: ["/", "/login"],
};
