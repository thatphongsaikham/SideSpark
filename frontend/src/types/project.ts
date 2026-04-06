// types/project.ts

export type Difficulty = "เริ่มต้นง่าย" | "ปานกลาง" | "ยาก";

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
};

export type Transaction = {
  id: string;
  type: "income" | "expense";
  label: string;
  amount: number;
  date: string; // ISO date string "YYYY-MM-DD"
};

export type Milestone = {
  id: string;
  label: string;
  targetAmount: number;
  reached: boolean;
  reachedAt?: string;
};

export type Project = {
  id: string;
  name: string;
  description: string;
  initialCost: number; // ต้นทุนเริ่มต้น
  incomeGoal: number; // เป้าหมายรายได้
  createdAt: string; // ISO date string
  todos: TodoItem[];
  transactions: Transaction[];
  milestones: Milestone[];
  streak: number; // consecutive active days
};
