import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const host = req.headers.get("host") || "localhost:3000";
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const redirectUri = `${protocol}://${host}/giveaway/api/auth/steam/callback`;
  const realm = `${protocol}://${host}/giveaway`;

  const steamOpenIdUrl = new URL("https://steamcommunity.com/openid/login");
  steamOpenIdUrl.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  steamOpenIdUrl.searchParams.set("openid.mode", "checkid_setup");
  steamOpenIdUrl.searchParams.set("openid.return_to", redirectUri);
  steamOpenIdUrl.searchParams.set("openid.realm", realm);
  steamOpenIdUrl.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  steamOpenIdUrl.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");

  return NextResponse.redirect(steamOpenIdUrl.toString());
}
