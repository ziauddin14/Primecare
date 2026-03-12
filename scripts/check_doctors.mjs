import { MongoClient } from "mongodb";

const uri =
  "mongodb+srv://zu37216_db_user:Ziauddin14@primecare.xottptx.mongodb.net/primecare?retryWrites=true&w=majority&appName=Primecare";

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("primecare");
    const doctors = await db.collection("doctors").find({}).toArray();
    console.log("Total Doctors:", doctors.length);
    console.log(
      "Doctors Sample:",
      JSON.stringify(doctors.slice(0, 2), null, 2),
    );
  } finally {
    await client.close();
  }
}

main().catch(console.error);
