import { MongoClient } from "mongodb";

// Shared connection helper for one-off maintenance scripts. Requires
// MONGODB_URI to be set in the environment - there is no fallback and no
// hardcoded credential. Run scripts like:
//   MONGODB_URI="mongodb+srv://..." node scripts/check_doctors.mjs
// or export MONGODB_URI in your shell / .env.local (loaded by your shell,
// not by Node automatically) before running.
export function getMongoUri() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error(
      "Missing MONGODB_URI environment variable. Set it before running this script, e.g.\n" +
        '  MONGODB_URI="mongodb+srv://<user>:<pass>@<host>/<db>" node scripts/<script>.mjs'
    );
    process.exit(1);
  }
  return uri;
}

export function connect() {
  return new MongoClient(getMongoUri());
}
