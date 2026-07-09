import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import { nanoid } from "nanoid";

// POST /api/chat/[id]/share — toggle sharing
export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const chat = await Chat.findOne({ _id: params.id, userId: (session.user as any).id });
    if (!chat) return NextResponse.json({ error: "Chat not found" }, { status: 404 });

    if (chat.shared) {
      // Unshare
      chat.shared = false;
      chat.shareId = undefined;
    } else {
      // Share
      chat.shared = true;
      chat.shareId = nanoid(12);
    }
    await chat.save();

    return NextResponse.json({
      shared: chat.shared,
      shareId: chat.shareId,
      shareUrl: chat.shared ? `${process.env.NEXTAUTH_URL}/share/${chat.shareId}` : null,
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
