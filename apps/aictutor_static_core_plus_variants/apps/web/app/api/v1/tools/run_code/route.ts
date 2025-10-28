// apps/web/app/api/v1/tools/run_code/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyServiceToken } from "@/app/lib/auth";
export async function POST(req: NextRequest) {
  verifyServiceToken(req);
  const body = await req.json();
  if (process.env.RUNNER_URL) {
    const r = await fetch(`${process.env.RUNNER_URL}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    return NextResponse.json(await r.json(), { status: r.status });
  }
  return NextResponse.json({ stdout: "", stderr: "", verdicts: [] });
}
