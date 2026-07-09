import mongoose, { Schema, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: "" },
    settings: {
      defaultModel: { type: String, default: "gemini-2.0-flash" },
      defaultProvider: { type: String, default: "gemini" },
      theme: { type: String, enum: ["dark", "light"], default: "dark" },
      apiKeys: { type: Map, of: String, default: {} },
    },
  },
  { timestamps: true }
);

export default models.User || mongoose.model("User", UserSchema);
