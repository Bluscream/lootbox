import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const discordClientId = process.env.DISCORD_CLIENT_ID;
  if (!discordClientId) {
    // If not configured, redirect to mock login
    return NextResponse.redirect(new URL("/giveaway/api/auth/mock", req.url));
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  // The redirect URI must match what's configured in Discord developer portal
  // E.g. https://andre-stinkt.de/giveaway/api/auth/discord/callback
  const redirectUri = `${protocol}://${host}/giveaway/api/auth/discord/callback`;

  const discordAuthUrl = new URL("https://discord.com/api/oauth2/authorize");
  discordAuthUrl.searchParams.set("client_id", discordClientId);
  discordAuthUrl.searchParams.set("redirect_uri", redirectUri);
  discordAuthUrl.searchParams.set("response_type", "code");
  discordAuthUrl.searchParams.set("scope", "identify");

  return NextResponse.redirect(discordAuthUrl.toString());
}
