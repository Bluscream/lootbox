import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/session";
import { db } from "@/lib/db";
import { getClientIpFromRequest } from "@/lib/ip";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params: Record<string, string> = {};
  searchParams.forEach((val, key) => {
    params[key] = val;
  });

  const claimedId = params["openid.claimed_id"];
  if (!claimedId) {
    return NextResponse.redirect(new URL("/giveaway?error=no_claimed_id", req.url));
  }

  // Extract SteamID64
  const steamIdMatches = claimedId.match(/^https:\/\/steamcommunity\.com\/openid\/id\/(\d+)$/);
  if (!steamIdMatches) {
    return NextResponse.redirect(new URL("/giveaway?error=invalid_steam_id", req.url));
  }
  const steamId = steamIdMatches[1];

  try {
    // Verify parameters with Steam OpenID
    const validationParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      validationParams.append(k, v);
    }
    // Set mode to check_authentication
    validationParams.set("openid.mode", "check_authentication");

    const verificationResponse = await fetch("https://steamcommunity.com/openid/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: validationParams.toString(),
    });

    if (!verificationResponse.ok) {
      return NextResponse.redirect(new URL("/giveaway?error=openid_verification_failed", req.url));
    }

    const verificationResult = await verificationResponse.text();
    if (!verificationResult.includes("is_valid:true")) {
      return NextResponse.redirect(new URL("/giveaway?error=invalid_openid_signature", req.url));
    }

    // Successfully verified! Now get profile details.
    let username = `Steam User ${steamId}`;
    let avatar = `https://api.dicebear.com/7.x/identicon/svg?seed=${steamId}`;

    const steamApiKey = process.env.STEAM_API_KEY;
    if (steamApiKey) {
      try {
        const playerResponse = await fetch(
          `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v0002/?key=${steamApiKey}&steamids=${steamId}`
        );
        if (playerResponse.ok) {
          const playerData = await playerResponse.json();
          const player = playerData.response?.players?.[0];
          if (player) {
            username = player.personaname || username;
            avatar = player.avatarfull || avatar;
          }
        }
      } catch (err) {
        console.error("Failed to fetch steam details:", err);
      }
    }

    // Upsert user in database
    let user = await db.user.findUnique({
      where: {
        provider_providerId: {
          provider: "steam",
          providerId: steamId,
        },
      },
    });

    // Check if this is the very first user, if so make them Admin!
    const userCount = await db.user.count();
    const makeAdmin = userCount === 0 || process.env.ADMIN_STEAM_IDS?.split(",").includes(steamId);

    const userAgent = req.headers.get("user-agent") || null;
    const clientIp = getClientIpFromRequest(req);

    if (!user) {
      user = await db.user.create({
        data: {
          username,
          avatar,
          provider: "steam",
          providerId: steamId,
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
      provider: "steam",
      isAdmin: user.isAdmin,
    });

    return NextResponse.redirect(new URL("/giveaway", req.url));
  } catch (error) {
    console.error("Steam authentication error:", error);
    return NextResponse.redirect(new URL("/giveaway?error=steam_auth_error", req.url));
  }
}
