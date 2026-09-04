import clientPromise from "@/lib/mongodb";

let indexesEnsured = false;

// Idempotent - safe to call on every cold start. Establishes the minimum
// data integrity guarantees the auth system depends on (unique login
// identity, automatic expiry of session records).
export async function ensureAuthIndexes(): Promise<void> {
  if (indexesEnsured) return;
  const client = await clientPromise;
  const db = client.db();

  await Promise.all([
    db.collection("users").createIndex({ email: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ tokenHash: 1 }, { unique: true }),
    db.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);

  indexesEnsured = true;
}
