import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getClientIpFromRequest } from "@/lib/ip";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/giveaway?error=no_code", req.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/giveaway?error=missing_secrets", req.url));
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${protocol}://${host}/giveaway/api/auth/discord/callback`;

  try {
    // Exchange code for token
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text();
      console.error("Discord token exchange failed:", errorData);
      return NextResponse.redirect(new URL("/giveaway?error=token_exchange_failed", req.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user details
    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL("/giveaway?error=user_fetch_failed", req.url));
    }

    const userData = await userResponse.json();
    const providerId = userData.id;
    const username = userData.global_name || userData.username;
    const avatar = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${parseInt(userData.discriminator || "0") % 5}.png`;

    // Upsert user in database
    let user = await db.user.findUnique({
      where: {
        provider_providerId: {
          provider: "discord",
          providerId,
        },
      },
    });

    // Check if this is the very first user, if so make them Admin! Or check env for admin list
    const userCount = await db.user.count();
    const makeAdmin = userCount === 0 || process.env.ADMIN_DISCORD_IDS?.split(",").includes(providerId);

    const userAgent = req.headers.get("user-agent") || null;
    const clientIp = getClientIpFromRequest(req);

    if (!user) {
      user = await db.user.create({
        data: {
          username,
          avatar,
          provider: "discord",
          providerId,
          isAdmin: !!makeAdmin,
          lastIp: clientIp,
          lastUserAgent: userAgent,
        },
      });
    } else {
      user = await db.user.update({
        where: { id: user.id },
        data: {
          username,
          avatar,
          isAdmin: user.isAdmin || !!makeAdmin,
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
      provider: "discord",
      isAdmin: user.isAdmin,
    });

    return NextResponse.redirect(new URL("/giveaway", req.url));
  } catch (error) {
    console.error("Discord authentication error:", error);
    return NextResponse.redirect(new URL("/giveaway?error=auth_error", req.url));
  }
}
