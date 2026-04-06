import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. หา User จาก Email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 2. เช็ค Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // 3. สร้าง Token (ถ้าต้องการใช้ในฝั่ง Backend ด้วย)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" },
    );

    // 4. ส่งข้อมูลกลับไปให้ NextAuth
    res.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
      },
      token,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
