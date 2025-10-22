// apps/web/app/api/tasks/[id]/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/tasks/[id] - Get specific task with full details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        concepts: {
          select: {
            name: true,
            description: true,
            difficulty: true
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ task });

  } catch (error) {
    console.error("Task fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch task" },
      { status: 500 }
    );
  }
}