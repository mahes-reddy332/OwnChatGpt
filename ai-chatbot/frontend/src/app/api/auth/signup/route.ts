import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();
    console.log(`[SIGNUP] Attempting signup for email: ${email}`);

    if (!name || !email || !password) {
      console.warn("[SIGNUP] Missing fields", { name: !!name, email: !!email, password: !!password });
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    await connectDB();
    console.log("[SIGNUP] Connected to DB");

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      console.warn("[SIGNUP] Email already exists:", email);
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed });
    console.log("[SIGNUP] User created:", { id: user._id, email: user.email });

    return NextResponse.json({ id: user._id, name: user.name, email: user.email }, { status: 201 });
  } catch (error: any) {
    console.error("[SIGNUP] Error:", error.message, error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
