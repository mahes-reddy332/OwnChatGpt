import mongoose, { Schema, models } from "mongoose";

const MessageSchema = new Schema({
  role: { type: String, enum: ["user", "assistant", "system"], required: true },
  content: { type: String, required: true },
  files: [{ name: String, type: String, size: Number }],
  images: [{ url: String, prompt: String }],
  createdAt: { type: Date, default: Date.now },
});

const ChatSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "New Chat" },
    model: { type: String, default: "gemini-2.0-flash" },
    provider: { type: String, default: "gemini" },
    backendConversationId: { type: String, default: "" },
    messages: [MessageSchema],
    shared: { type: Boolean, default: false },
    shareId: { type: String, unique: true, sparse: true },
  },
  { timestamps: true }
);

ChatSchema.index({ userId: 1, updatedAt: -1 });

export default models.Chat || mongoose.model("Chat", ChatSchema);
