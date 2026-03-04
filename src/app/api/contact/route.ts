import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { z } from "zod";

const ContactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  message: z.string().min(5),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validation = ContactSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { ok: false, message: validation.error.issues[0].message },
        { status: 400 }
      );
    }

    const { name, email, message } = validation.data;

    const client = await clientPromise;
    const db = client.db();
    const col = db.collection("messages");

    await col.insertOne({
      name,
      email,
      message,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      ok: true, 
      message: "Message received. Our team will contact you shortly." 
    }, { status: 201 });

  } catch (err) {
    console.error("POST /api/contact error:", err);
    return NextResponse.json(
      { ok: false, message: "Server error while processing your request" },
      { status: 500 }
    );
  }
}
