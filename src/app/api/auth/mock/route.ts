import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getClientIpFromRequest } from "@/lib/ip";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdmin = searchParams.get("admin") === "true";
  
  const mockProviderId = isAdmin ? "mock-admin-id-999" : "mock-user-id-123";
  const mockUsername = isAdmin ? "Mock Admin" : "Mock User";
  const mockAvatar = isAdmin 
    ? "https://api.dicebear.com/7.x/bottts/svg?seed=admin" 
    : "https://api.dicebear.com/7.x/adventurer/svg?seed=user";

  // Upsert user in database
  let user = await db.user.findUnique({
    where: {
      provider_providerId: {
        provider: "mock",
        providerId: mockProviderId,
      },
    },
  });

  const userAgent = req.headers.get("user-agent") || null;
  const clientIp = getClientIpFromRequest(req);

  if (!user) {
    user = await db.user.create({
      data: {
        username: mockUsername,
        avatar: mockAvatar,
        provider: "mock",
        providerId: mockProviderId,
        isAdmin: isAdmin,
        lastIp: clientIp,
        lastUserAgent: userAgent,
      },
    });
  } else {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        lastIp: clientIp,
        lastUserAgent: userAgent,
      },
    });
  }

  // Create session
  await createSession({
    userId: user.id,
    username: user.username,
    avatar: user.avatar,
    provider: "mock",
    isAdmin: user.isAdmin,
  });

  // Redirect to main page
  return NextResponse.redirect(new URL("/giveaway", req.url));
}
