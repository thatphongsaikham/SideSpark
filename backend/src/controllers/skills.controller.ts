// src/controllers/skills.controller.ts
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

export const getSkills = async (req: Request, res: Response) => {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
    });
    res.json(skills);
  } catch (error) {
    res.status(500).json({ message: "ไม่สามารถดึงข้อมูลทักษะได้" });
  }
};
