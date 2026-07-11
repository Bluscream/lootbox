import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const code = searchParams.get("code");
  const title = searchParams.get("name") || searchParams.get("title");
  const description = searchParams.get("description") || "";
  const claimUrl = searchParams.get("claim_url") || searchParams.get("claimUrl");
  const maxClaimsStr = searchParams.get("max_claims") || searchParams.get("maxClaims") || "1";

  // Validate Token
  const adminToken = process.env.LOOTBOX_ADMIN_TOKEN || "default_lootbox_admin_token_change_me_123";
  if (!token || token !== adminToken) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // Validate required parameters
  if (!code || !title) {
    return NextResponse.json(
      { success: false, error: "Missing required parameters: 'code' and 'name'/'title' are required." },
      { status: 400 }
    );
  }

  const maxClaims = parseInt(maxClaimsStr) || 1;

  try {
    const created = await db.giveaway.create({
      data: {
        title,
        description,
        code,
        claimUrl: claimUrl || null,
        maxClaims: maxClaims >= 1 ? maxClaims : 1,
        active: true,
        captchaRequired: true,
        mathRequired: true,
      },
    });

    revalidatePath("/");

    return NextResponse.json({
      success: true,
      message: "Giveaway added successfully via API!",
      giveaway: created,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: "Failed to create giveaway: " + err.message },
      { status: 500 }
    );
  }
}
