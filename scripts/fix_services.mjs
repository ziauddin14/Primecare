import { connect } from "./_db.mjs";

async function main() {
  const client = connect();
  try {
    await client.connect();
    const db = client.db("primecare");

    console.log("Updating services to isActive: true...");
    const result = await db
      .collection("services")
      .updateMany({}, { $set: { isActive: true } });

    console.log(
      `Matched ${result.matchedCount} and modified ${result.modifiedCount} services.`,
    );
  } finally {
    await client.close();
  }
}

main().catch(console.error);
