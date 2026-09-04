import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ensureAuthIndexes } from "./db";
import { generateSessionToken, hashSessionToken } from "./token";
import type { SafeUser, UserRole } from "@/lib/models/User";

export const SESSION_COOKIE_NAME = "session";
// Cosmetic, JS-readable cookies used only to personalize the UI immediately
// after login (name/role in the sidebar). No server-side authorization check
// ever reads these - the real source of truth is the httpOnly session cookie
// resolved against the `sessions` collection below.
export const UI_ROLE_COOKIE_NAME = "user_role";
export const UI_NAME_COOKIE_NAME = "user_name";

const SESSION_DURATION_SECONDS = 60 * 60 * 8; // 8 hours

export interface SessionInfo {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  doctorId?: string;
}

interface SessionDoc {
  _id?: ObjectId;
  tokenHash: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
}

function cookieOptions(maxAge: number, httpOnly: boolean) {
  return {
    httpOnly,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge,
    path: "/",
  };
}

export async function createSession(user: SafeUser): Promise<string> {
  await ensureAuthIndexes();
  const client = await clientPromise;
  const db = client.db();

  const token = generateSessionToken();
  const now = new Date();
  const doc: SessionDoc = {
    tokenHash: hashSessionToken(token),
    userId: user.id,
    createdAt: now,
    expiresAt: new Date(now.getTime() + SESSION_DURATION_SECONDS * 1000),
  };

  await db.collection<SessionDoc>("sessions").insertOne(doc);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, cookieOptions(SESSION_DURATION_SECONDS, true));
  cookieStore.set(UI_ROLE_COOKIE_NAME, user.role, cookieOptions(SESSION_DURATION_SECONDS, false));
  cookieStore.set(UI_NAME_COOKIE_NAME, user.name, cookieOptions(SESSION_DURATION_SECONDS, false));

  return token;
}

export async function resolveSessionToken(token: string): Promise<SessionInfo | null> {
  const client = await clientPromise;
  const db = client.db();

  const doc = await db.collection<SessionDoc>("sessions").findOne({ tokenHash: hashSessionToken(token) });
  if (!doc) return null;

  if (doc.expiresAt.getTime() <= Date.now()) {
    await db.collection<SessionDoc>("sessions").deleteOne({ _id: doc._id });
    return null;
  }

  let userObjectId: ObjectId;
  try {
    userObjectId = new ObjectId(doc.userId);
  } catch {
    return null;
  }

  const user = await db.collection("users").findOne({ _id: userObjectId });
  if (!user || !user.isActive) {
    await db.collection<SessionDoc>("sessions").deleteOne({ _id: doc._id });
    return null;
  }

  return {
    userId: doc.userId,
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.doctorId && { doctorId: user.doctorId }),
  };
}

export async function getSession(): Promise<SessionInfo | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  return resolveSessionToken(token);
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    const client = await clientPromise;
    const db = client.db();
    await db.collection<SessionDoc>("sessions").deleteOne({ tokenHash: hashSessionToken(token) });
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
  cookieStore.delete(UI_ROLE_COOKIE_NAME);
  cookieStore.delete(UI_NAME_COOKIE_NAME);
}
