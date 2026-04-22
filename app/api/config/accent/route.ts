import { after, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { setConfig, getConfig } from "@/lib/config";
import { logActivity } from "@/lib/activity";

/** POST /api/config/accent — Save accent color (admin only) */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { color?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const color = body.color;
  if (!color || !/^#[0-9a-fA-F]{6}$/.test(color)) {
    return NextResponse.json(
      { error: "Invalid hex color (e.g. #5b4cff)" },
      { status: 400 }
    );
  }

  await setConfig("accent_color", color);
  revalidatePath("/", "layout");
  after(() => logActivity(session.userId, "setting", "Updated accent color"));
  return NextResponse.json({ saved: true });
}

/** GET /api/config/accent — Get current accent color */
export async function GET() {
  const color = await getConfig("accent_color");
  return NextResponse.json({ color });
}
