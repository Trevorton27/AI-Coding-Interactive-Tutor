// apps/web/app/api/tasks/next/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST /api/tasks/next - Get next recommended task
export async function POST(req: NextRequest) {
  try {
    const { userId, strategy = "just-right" } = await req.json();

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    // Get user's progress
    const userProgress = await prisma.progress.findMany({
      where: { userId },
      include: { concept: true }
    });

    // Get completed tasks (attempts where passed = true)
    const completedAttempts = await prisma.attempt.findMany({
      where: {
        userId,
        passed: true
      },
      select: { taskId: true },
      distinct: ['taskId']
    });

    const completedTaskIds = completedAttempts.map((a: any) => a.taskId);

    // Calculate average mastery
    const avgMastery = userProgress.length > 0
      ? userProgress.reduce((sum: number, p: any) => sum + p.mastery, 0) / userProgress.length
      : 800;

    if (strategy === "just-right") {
      // Find tasks matching user's mastery level
      const targetDifficulty = Math.round((avgMastery - 600) / 240); // Map 600-1800 to 1-5

      const nextTask = await prisma.task.findFirst({
        where: {
          id: { notIn: completedTaskIds },
          difficulty: {
            gte: Math.max(1, targetDifficulty - 1),
            lte: Math.min(5, targetDifficulty + 1)
          }
        },
        orderBy: [
          { difficulty: 'asc' }
        ]
      });

      if (!nextTask) {
        // No appropriate task found, try any uncompleted task
        return findAnyNextTask(completedTaskIds);
      }

      return NextResponse.json({ task: nextTask });

    } else if (strategy === "sequential") {
      // Get lowest difficulty uncompleted task
      const nextTask = await prisma.task.findFirst({
        where: {
          id: { notIn: completedTaskIds }
        },
        orderBy: [
          { difficulty: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      if (!nextTask) {
        return NextResponse.json(
          { message: "All tasks completed!" },
          { status: 200 }
        );
      }

      return NextResponse.json({ task: nextTask });
    }

    return NextResponse.json(
      { error: "Invalid strategy" },
      { status: 400 }
    );

  } catch (error) {
    console.error("Next task API error:", error);
    return NextResponse.json(
      { error: "Failed to get next task" },
      { status: 500 }
    );
  }
}

async function findAnyNextTask(completedTaskIds: string[]) {
  const nextTask = await prisma.task.findFirst({
    where: {
      id: { notIn: completedTaskIds }
    },
    orderBy: { difficulty: 'asc' }
  });

  if (!nextTask) {
    return NextResponse.json(
      { message: "All tasks completed!" },
      { status: 200 }
    );
  }

  return NextResponse.json({ task: nextTask });
}