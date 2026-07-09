import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

// GET /api/user/settings
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById((session.user as any).id).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const settings = (user as any).settings || {};
    const maskedKeys: Record<string, string> = {};
    if (settings.apiKeys) {
      for (const [k, v] of Object.entries(settings.apiKeys as Record<string, string>)) {
        maskedKeys[k] = v ? `${v.slice(0, 8)}...${v.slice(-4)}` : "";
      }
    }

    return NextResponse.json({
      name: (user as any).name,
      email: (user as any).email,
      avatar: (user as any).avatar,
      defaultModel: settings.defaultModel || "gemini-2.0-flash",
      defaultProvider: settings.defaultProvider || "gemini",
      theme: settings.theme || "dark",
      apiKeys: maskedKeys,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/user/settings
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    await connectDB();

    const update: any = {};
    if (body.name) update.name = body.name;
    if (body.defaultModel) update["settings.defaultModel"] = body.defaultModel;
    if (body.defaultProvider) update["settings.defaultProvider"] = body.defaultProvider;
    if (body.theme === "dark" || body.theme === "light") update["settings.theme"] = body.theme;
    if (body.apiKeys) {
      for (const [provider, key] of Object.entries(body.apiKeys)) {
        if (typeof key === "string" && !key.includes("...")) {
          update[`settings.apiKeys.${provider}`] = key;
        }
      }
    }

    await User.findByIdAndUpdate((session.user as any).id, { $set: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
