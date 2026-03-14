import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://zu37216_db_user:Ziauddin14@primecare.xottptx.mongodb.net/primecare?retryWrites=true&w=majority&appName=Primecare";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("primecare");
    const services = await db.collection("services").find({}).toArray();
    console.log("Total Services:", services.length);
    console.log(
      "Services Sample:",
      JSON.stringify(services.slice(0, 2), null, 2),
    );

    const activeCount = services.filter((s) => s.isActive).length;
    console.log("Active Services (isActive: true):", activeCount);
  } finally {
    await client.close();
  }
}

main().catch(console.error);
