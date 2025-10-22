// apps/web/app/api/tasks/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/tasks - List all tasks with optional filtering
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const difficulty = searchParams.get("difficulty");
    const conceptId = searchParams.get("conceptId");

    const where: any = {};
    
    if (difficulty) {
      where.difficulty = parseInt(difficulty);
    }
    
    if (conceptId) {
      where.conceptIds = {
        has: conceptId
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        conceptIds: true,
        prerequisites: true
      },
      orderBy: {
        difficulty: 'asc'
      }
    });

    return NextResponse.json({ tasks });

  } catch (error) {
    console.error("Tasks API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}