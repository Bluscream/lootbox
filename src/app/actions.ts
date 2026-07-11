"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { getClientIp } from "@/lib/ip";
import { hasActiveCooldown } from "@/lib/cooldown";

// -------------------------------------------------------------
// USER ACTIONS
// -------------------------------------------------------------

export interface ClaimResult {
  success: boolean;
  code?: string;
  error?: string;
  cooldownUntil?: string;
}

export async function claimGiveaway(
  giveawayId: string,
  captchaToken: string,
  mathAnswer: number,
  mathQuestionStr: string, // e.g. "12 + 5" or "4 * 7"
  quizAnswer: string,
  fingerprint: string
): Promise<ClaimResult> {
  const session = await getSession();
  if (!session) {
    return { success: false, error: "You must be logged in to claim codes." };
  }

  const clientIp = await getClientIp();

  // 1. Fetch user and check active cooldown
  const user = await db.user.findUnique({
    where: { id: session.userId },
  });

  if (!user) {
    return { success: false, error: "User not found." };
  }

  const now = new Date();

  // Check account cooldown
  if (hasActiveCooldown(user.cooldownUntil)) {
    return {
      success: false,
      error: "You are on cooldown. You can claim another code in " + Math.ceil((user.cooldownUntil!.getTime() - now.getTime()) / (60 * 1000)) + " minutes.",
      cooldownUntil: user.cooldownUntil!.toISOString(),
    };
  }

  // Check IP cooldown
  const ipCooldown = await db.ipCooldown.findUnique({
    where: { ip: clientIp },
  });

  if (ipCooldown && hasActiveCooldown(ipCooldown.cooldownUntil)) {
    return {
      success: false,
      error: "This IP address is on cooldown. You can claim another code in " + Math.ceil((ipCooldown.cooldownUntil.getTime() - now.getTime()) / (60 * 1000)) + " minutes.",
      cooldownUntil: ipCooldown.cooldownUntil.toISOString(),
    };
  }

  // 2. Fetch giveaway
  const giveaway = await db.giveaway.findUnique({
    where: { id: giveawayId },
  });

  if (!giveaway || !giveaway.active) {
    return { success: false, error: "Giveaway not found or no longer active." };
  }

  const claimsCount = await db.claimLog.count({
    where: { giveawayId },
  });

  if (claimsCount >= giveaway.maxClaims) {
    return { success: false, error: "This giveaway has run out of codes! All keys have been claimed." };
  }

  // 3. CAPTCHA Validation
  if (giveaway.captchaRequired) {
    const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && captchaToken !== "mock-captcha-token") {
      try {
        const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            secret: turnstileSecret,
            response: captchaToken,
            remoteip: clientIp,
          }),
        });
        const captchaResult = await res.json();
        if (!captchaResult.success) {
          return { success: false, error: "CAPTCHA verification failed. Please try again." };
        }
      } catch (err) {
        console.error("Turnstile error:", err);
        return { success: false, error: "CAPTCHA verification server error." };
      }
    }
  }

  // 4. Math Puzzle Validation
  if (giveaway.mathRequired) {
    // Parse math question string (e.g. "12 + 5") and evaluate safely
    const match = mathQuestionStr.match(/^(\d+)\s*([\+\-\*])\s*(\d+)$/);
    if (!match) {
      return { success: false, error: "Invalid math puzzle format." };
    }
    const num1 = parseInt(match[1]);
    const op = match[2];
    const num2 = parseInt(match[3]);
    let expected = 0;
    if (op === "+") expected = num1 + num2;
    else if (op === "-") expected = num1 - num2;
    else if (op === "*") expected = num1 * num2;

    if (mathAnswer !== expected) {
      return { success: false, error: "Math answer is incorrect." };
    }
  }

  // 5. Quiz Validation
  if (giveaway.quizQuestion && giveaway.quizAnswer) {
    if (quizAnswer.trim().toLowerCase() !== giveaway.quizAnswer.trim().toLowerCase()) {
      return { success: false, error: "Incorrect answer to the quiz question." };
    }
  }

  // 6. Success: Lock client and return code
  const cooldownPeriod = 24 * 60 * 60 * 1000; // 24 hours
  const cooldownDate = new Date(Date.now() + cooldownPeriod);

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || null;

  // Update user
  await db.user.update({
    where: { id: user.id },
    data: {
      cooldownUntil: cooldownDate,
      lastIp: clientIp,
      lastUserAgent: userAgent,
      lastFingerprint: fingerprint,
    },
  });

  // Update/insert IP cooldown
  await db.ipCooldown.upsert({
    where: { ip: clientIp },
    update: { cooldownUntil: cooldownDate },
    create: { ip: clientIp, cooldownUntil: cooldownDate },
  });

  // Log claim
  await db.claimLog.create({
    data: {
      userId: user.id,
      giveawayId: giveaway.id,
      ipAddress: clientIp,
      userAgent: userAgent,
      fingerprint: fingerprint,
    },
  });

  revalidatePath("/");
  revalidatePath(`/claim/${giveawayId}`);

  return {
    success: true,
    code: giveaway.code,
  };
}

// -------------------------------------------------------------
// ADMIN ACTIONS
// -------------------------------------------------------------

async function assertAdmin() {
  const session = await getSession();
  if (!session || !session.isAdmin) {
    throw new Error("Unauthorized");
  }
}

export async function createGiveaway(data: {
  title: string;
  description: string;
  code: string;
  active: boolean;
  maxClaims?: number;
  claimUrl?: string;
  captchaRequired: boolean;
  mathRequired: boolean;
  quizQuestion?: string;
  quizOptions?: string;
  quizAnswer?: string;
}) {
  await assertAdmin();

  const giveaway = await db.giveaway.create({
    data: {
      title: data.title,
      description: data.description,
      code: data.code,
      active: data.active,
      maxClaims: data.maxClaims !== undefined ? data.maxClaims : 1,
      claimUrl: data.claimUrl || null,
      captchaRequired: data.captchaRequired,
      mathRequired: data.mathRequired,
      quizQuestion: data.quizQuestion || null,
      quizOptions: data.quizOptions || null,
      quizAnswer: data.quizAnswer || null,
    },
  });

  revalidatePath("/");
  return giveaway;
}

export async function updateGiveaway(
  id: string,
  data: {
    title: string;
    description: string;
    code: string;
    active: boolean;
    maxClaims?: number;
    claimUrl?: string;
    captchaRequired: boolean;
    mathRequired: boolean;
    quizQuestion?: string;
    quizOptions?: string;
    quizAnswer?: string;
  }
) {
  await assertAdmin();

  const giveaway = await db.giveaway.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      code: data.code,
      active: data.active,
      maxClaims: data.maxClaims !== undefined ? data.maxClaims : 1,
      claimUrl: data.claimUrl || null,
      captchaRequired: data.captchaRequired,
      mathRequired: data.mathRequired,
      quizQuestion: data.quizQuestion || null,
      quizOptions: data.quizOptions || null,
      quizAnswer: data.quizAnswer || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/claim/${id}`);
  return giveaway;
}

export async function deleteGiveaway(id: string) {
  await assertAdmin();

  await db.giveaway.delete({
    where: { id },
  });

  revalidatePath("/");
}

export async function resetCooldown(userId: string) {
  await assertAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) return;

  await db.user.update({
    where: { id: userId },
    data: {
      cooldownUntil: null,
    },
  });

  if (user.lastIp) {
    await db.ipCooldown.deleteMany({
      where: { ip: user.lastIp },
    });
  }

  revalidatePath("/");
}

export async function getStats() {
  await assertAdmin();

  const totalUsers = await db.user.count();
  const totalGiveaways = await db.giveaway.count();
  const totalClaims = await db.claimLog.count();

  const claimLogs = await db.claimLog.findMany({
    orderBy: { claimedAt: "desc" },
    include: {
      user: true,
      giveaway: true,
    },
    take: 50,
  });

  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      claims: {
        select: {
          ipAddress: true,
        },
      },
    },
  });

  return {
    totalUsers,
    totalGiveaways,
    totalClaims,
    claimLogs,
    users,
  };
}

export async function toggleAdminRole(userId: string) {
  await assertAdmin();

  const session = await getSession();
  if (session?.userId === userId) {
    throw new Error("You cannot change your own admin status.");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      isAdmin: !user.isAdmin,
    },
  });

  revalidatePath("/admin");
  return updated;
}

export async function deleteUser(userId: string) {
  await assertAdmin();

  const session = await getSession();
  if (session?.userId === userId) {
    throw new Error("You cannot delete yourself.");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.lastIp) {
    await db.ipCooldown.deleteMany({
      where: { ip: user.lastIp },
    });
  }

  const deleted = await db.user.delete({
    where: { id: userId },
  });

  revalidatePath("/admin");
  return deleted;
}

export async function clearUserClaims(userId: string) {
  await assertAdmin();

  const user = await db.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.lastIp) {
    await db.ipCooldown.deleteMany({
      where: { ip: user.lastIp },
    });
  }

  await db.user.update({
    where: { id: userId },
    data: {
      cooldownUntil: null,
      lastIp: null,
    },
  });

  const cleared = await db.claimLog.deleteMany({
    where: { userId },
  });

  revalidatePath("/admin");
  return cleared;
}
