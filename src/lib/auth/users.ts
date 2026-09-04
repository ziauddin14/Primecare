import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ensureAuthIndexes } from "./db";
import { hashPassword } from "./password";
import type { User, SafeUser } from "@/lib/models/User";

type UserDoc = Omit<User, "_id"> & { _id: ObjectId };

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const client = await clientPromise;
  const db = client.db();
  const doc = await db.collection("users").findOne({ email: email.toLowerCase() });
  return doc as UserDoc | null;
}

export function toSafeUser(user: UserDoc): SafeUser {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    ...(user.doctorId && { doctorId: user.doctorId }),
  };
}

export async function createUser(input: {
  name: string;
  email: string;
  password: string;
  role: User["role"];
  doctorId?: string;
}): Promise<SafeUser> {
  await ensureAuthIndexes();
  const client = await clientPromise;
  const db = client.db();

  const passwordHash = await hashPassword(input.password);
  const now = new Date();
  const doc = {
    name: input.name,
    email: input.email.toLowerCase(),
    passwordHash,
    role: input.role,
    isActive: true,
    ...(input.doctorId && { doctorId: input.doctorId }),
    createdAt: now,
    updatedAt: now,
  };

  const result = await db.collection("users").insertOne(doc);
  return toSafeUser({ ...doc, _id: result.insertedId });
}
