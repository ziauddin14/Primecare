import bcrypt from "bcryptjs";
import { connect } from "./_db.mjs";

// Creates (or promotes) the first ADMIN user. There is no API endpoint for
// this by design - an unauthenticated "create the first admin" HTTP route
// would itself be a privilege-escalation hole. Run this once per
// environment:
//
//   ADMIN_NAME="Clinic Owner" ADMIN_EMAIL="owner@clinic.com" \
//   ADMIN_PASSWORD="a-strong-password" MONGODB_URI="mongodb+srv://..." \
//   node scripts/create_admin.mjs
//
// Re-running with the same email updates the name/password on the existing
// account rather than creating a duplicate.

const name = process.env.ADMIN_NAME;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

const missing = ["ADMIN_NAME", "ADMIN_EMAIL", "ADMIN_PASSWORD"].filter((k) => !process.env[k]);
if (missing.length > 0) {
  console.error(`Missing required environment variable(s): ${missing.join(", ")}`);
  console.error(
    'Usage: ADMIN_NAME="..." ADMIN_EMAIL="..." ADMIN_PASSWORD="..." MONGODB_URI="..." node scripts/create_admin.mjs'
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

async function main() {
  const client = connect();
  try {
    await client.connect();
    const db = client.db();
    const passwordHash = await bcrypt.hash(password, 12);
    const now = new Date();

    const result = await db.collection("users").updateOne(
      { email: email.toLowerCase() },
      {
        $set: { name, email: email.toLowerCase(), passwordHash, role: "ADMIN", isActive: true, updatedAt: now },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );

    await db.collection("users").createIndex({ email: 1 }, { unique: true });

    if (result.upsertedCount > 0) {
      console.log(`Created ADMIN user: ${email}`);
    } else {
      console.log(`Updated existing ADMIN user: ${email}`);
    }
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error("Failed to create admin user:", err.message);
  process.exit(1);
});
