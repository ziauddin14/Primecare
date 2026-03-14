import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://zu37216_db_user:Ziauddin14@primecare.xottptx.mongodb.net/primecare?retryWrites=true&w=majority&appName=Primecare";

async function main() {
  const client = new MongoClient(uri);
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
