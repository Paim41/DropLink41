import { NextResponse } from "next/server";
import { z } from "zod";
import { audit } from "@/lib/audit";
import { authConfigured, createSessionResponse, sessionExpiresAt, verifyUserCredentials } from "@/lib/auth";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/responses";

export const runtime = "nodejs";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    if (!authConfigured()) {
      return jsonError("SESSION_SECRET is not configured", 503);
    }
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limited = rateLimit(`login:${ip}`, env.LOGIN_RATE_LIMIT, 60_000);
    if (!limited.allowed) return jsonError("Too many login attempts. Please wait and try again.", 429);

    const body = loginSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError("Incorrect email or password.", 400);

    await audit({ action: "login_attempt", request, metadata: { email: body.data.email } }).catch(() => undefined);
    const user = await verifyUserCredentials(body.data.email, body.data.password);
    if (!user) return jsonError("Incorrect email or password.", 401);
    await audit({ userId: user.id, action: "login_success", request }).catch(() => undefined);
    return createSessionResponse({ userId: user.id, email: user.email, exp: sessionExpiresAt() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Login failed";
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "ECONNREFUSED" || message.includes("Can't reach database") || message.includes("ECONNREFUSED") || message.includes("Schema engine")) {
      return jsonError("Database is not ready. Start PostgreSQL and run the Prisma migration before signing in.", 503);
    }
    if (message.includes("does not exist") || message.includes("column") || message.includes("relation")) {
      return jsonError("Database migration is not applied. Run npm run prisma:migrate before signing in.", 503);
    }
    return jsonError("Incorrect email or password.", 401);
  }
}

export async function GET() {
  return NextResponse.json({ configured: authConfigured() });
}
