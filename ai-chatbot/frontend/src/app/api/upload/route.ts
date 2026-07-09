import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { getBackendApiUrl } from "@/lib/backend";
import Upload from "@/models/Upload";

// POST /api/upload — handle file upload, extract text
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 10MB)" }, { status: 400 });
    }

    const backendForm = new FormData();
    backendForm.append("file", file);

    // Some backend instances expose /upload-file (legacy) while newer ones expose /api/upload-file.
    // Try both so uploads continue working during mixed deployments.
    const backendPaths = ["/api/upload-file", "/upload-file"];
    let response: Response | null = null;
    let data: any = null;
    let lastStatus = 500;

    for (const path of backendPaths) {
      response = await fetch(getBackendApiUrl(path), {
        method: "POST",
        body: backendForm,
        cache: "no-store",
      });

      let parsed: any = null;
      try {
        parsed = await response.json();
      } catch {
        parsed = null;
      }

      if (response.ok) {
        data = parsed;
        break;
      }

      lastStatus = response.status;
      data = parsed;

      if (response.status !== 404) {
        break;
      }
    }

    if (!response?.ok || !data) {
      const errorMsg = data?.detail || data?.error || "Upload failed";
      return NextResponse.json({ error: errorMsg }, { status: lastStatus });
    }

    await connectDB();
    const upload = await Upload.create({
      userId: (session.user as any).id,
      backendUploadId: data.upload_id || "",
      name: file.name,
      type: file.type || data.type || "application/octet-stream",
      size: file.size,
      extractedChars: data.content?.length || 0,
      truncated: !!data.truncated,
    });

    return NextResponse.json({
      uploadId: data.upload_id || upload._id,
      localUploadId: upload._id,
      name: file.name,
      type: file.type || data.type,
      size: file.size,
      content: data.content,
      truncated: !!data.truncated,
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    const message = error?.message?.includes("fetch")
      ? "Failed to reach backend upload service. Ensure backend is running on the configured API URL."
      : "Failed to process file";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
