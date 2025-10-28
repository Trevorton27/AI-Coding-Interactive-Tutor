// apps/web/app/lib/auth.ts
import { NextRequest } from "next/server";
const VALID = (process.env.TUTOR_SERVICE_TOKENS || "")
  .split(",").map(s => s.trim()).filter(Boolean);
export function verifyServiceToken(req: NextRequest) {
  const token = req.headers.get("X-LMS-Service-Token");
  if (!token || !VALID.includes(token)) {
    const err: any = new Error("Unauthorized");
    err.status = 401;
    throw err;
  }
}
