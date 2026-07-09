import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import Chat from "@/models/Chat";
import ShareChatView from "./ShareChatView";

export default async function SharePage({ params }: { params: { id: string } }) {
  await connectDB();

  const chat = await Chat.findOne({ shareId: params.id, shared: true }).lean();
  if (!chat) notFound();

  const messages = (chat as any).messages.map((m: any) => ({
    role: m.role,
    content: m.content,
    files: m.files || [],
    images: m.images || [],
  }));

  return (
    <ShareChatView
      title={(chat as any).title}
      model={(chat as any).model}
      messages={messages}
    />
  );
}
