import bcrypt from "bcryptjs";
import { z } from "zod";
import { createSessionResponse, sessionExpiresAt, authConfigured } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { jsonError } from "@/lib/responses";

export const runtime = "nodejs";

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().email(),
  password: z.string()
    .min(8)
    .max(160)
    .regex(/[A-Z]/, "Password must include an uppercase letter")
    .regex(/[a-z]/, "Password must include a lowercase letter")
    .regex(/\d/, "Password must include a number")
    .regex(/[^A-Za-z0-9]/, "Password must include a special character"),
});

export async function POST(request: Request) {
  try {
    if (!authConfigured()) return jsonError("SESSION_SECRET is not configured", 503);
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
    const limited = rateLimit(`register:${ip}`, env.LOGIN_RATE_LIMIT, 60_000);
    if (!limited.allowed) return jsonError("Registration rate limit reached. Please wait and try again.", 429);

    const body = registerSchema.safeParse(await request.json().catch(() => null));
    if (!body.success) return jsonError("Please complete all required registration fields.", 400, body.error.flatten());

    const email = body.data.email.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return jsonError("An account with this email already exists.", 409);

    const user = await prisma.user.create({
      data: {
        name: body.data.name,
        email,
        passwordHash: await bcrypt.hash(body.data.password, 12),
        role: "user",
      },
    });

    return createSessionResponse({ userId: user.id, email: user.email, exp: sessionExpiresAt() });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "ECONNREFUSED" || message.includes("Can't reach database") || message.includes("ECONNREFUSED") || message.includes("Schema engine")) {
      return jsonError("Database is not ready. Start PostgreSQL and run the Prisma migration before registering.", 503);
    }
    if (message.includes("does not exist") || message.includes("column") || message.includes("relation")) {
      return jsonError("Database migration is not applied. Run npm run prisma:migrate before registering.", 503);
    }
    return jsonError("Server error. Please try again.", 500);
  }
}
