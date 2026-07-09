import mongoose, { Schema, models } from "mongoose";

const UploadSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    backendUploadId: { type: String, default: "", index: true },
    name: { type: String, required: true },
    type: { type: String, required: true },
    size: { type: Number, required: true },
    extractedChars: { type: Number, default: 0 },
    truncated: { type: Boolean, default: false },
  },
  { timestamps: true }
);

UploadSchema.index({ userId: 1, createdAt: -1 });

export default models.Upload || mongoose.model("Upload", UploadSchema);
