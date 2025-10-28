// apps/web/app/api/mastery/route.ts

import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Elo-style mastery scoring
const K_FACTOR = 32; // How much each attempt affects score
const MIN_MASTERY = 600;
const MAX_MASTERY = 1800;

function updateMasteryScore(currentScore: number, success: boolean): number {
  const expected = 0.5; // Neutral expectation
  const actual = success ? 1 : 0;
  const delta = K_FACTOR * (actual - expected);
  const newScore = currentScore + delta;
  
  // Clamp to valid range
  return Math.max(MIN_MASTERY, Math.min(MAX_MASTERY, newScore));
}

export async function POST(req: NextRequest) {
  try {
    const { userId, tags, result } = await req.json();

    if (!userId || !tags || !Array.isArray(tags) || !result) {
      return NextResponse.json(
        { error: "Missing required fields: userId, tags[], result" },
        { status: 400 }
      );
    }

    if (result !== "pass" && result !== "fail") {
      return NextResponse.json(
        { error: "Result must be 'pass' or 'fail'" },
        { status: 400 }
      );
    }

    const success = result === "pass";
    const updates = [];

    // Update mastery for each concept tag
    for (const conceptName of tags) {
      // Find or create concept
      const concept = await prisma.concept.upsert({
        where: { name: conceptName },
        update: {},
        create: {
          name: conceptName,
          description: `Auto-created concept: ${conceptName}`,
          difficulty: 2,
          prerequisites: []
        }
      });

      // Find or create progress record
      const existingProgress = await prisma.progress.findUnique({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id
          }
        }
      });

      const currentMastery = existingProgress?.mastery || 800;
      const newMastery = updateMasteryScore(currentMastery, success);

      // Update or create progress
      const progress = await prisma.progress.upsert({
        where: {
          userId_conceptId: {
            userId,
            conceptId: concept.id
          }
        },
        update: {
          mastery: newMastery,
          attempts: { increment: 1 },
          successes: success ? { increment: 1 } : undefined,
          lastAttemptAt: new Date()
        },
        create: {
          userId,
          conceptId: concept.id,
          mastery: newMastery,
          attempts: 1,
          successes: success ? 1 : 0,
          lastAttemptAt: new Date()
        }
      });

      updates.push({
        concept: conceptName,
        oldMastery: currentMastery,
        newMastery: progress.mastery,
        change: progress.mastery - currentMastery
      });
    }

    return NextResponse.json({
      ok: true,
      updates
    });

  } catch (error) {
    console.error("Mastery API error:", error);
    return NextResponse.json(
      { error: "Failed to update mastery" },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user's mastery scores
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId parameter" },
        { status: 400 }
      );
    }

    const progress = await prisma.progress.findMany({
      where: { userId },
      include: {
        concept: {
          select: {
            name: true,
            description: true,
            difficulty: true
          }
        }
      },
      orderBy: {
        mastery: 'desc'
      }
    });

    return NextResponse.json({
      userId,
      progress: progress.map((p: any) => ({
        concept: p.concept.name,
        description: p.concept.description,
        difficulty: p.concept.difficulty,
        mastery: p.mastery,
        attempts: p.attempts,
        successes: p.successes,
        successRate: p.attempts > 0 ? (p.successes / p.attempts * 100).toFixed(1) : "0",
        lastAttempt: p.lastAttemptAt
      }))
    });

  } catch (error) {
    console.error("Mastery GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch mastery data" },
      { status: 500 }
    );
  }
}