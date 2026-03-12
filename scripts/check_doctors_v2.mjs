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

    const legacyCount = doctors.filter((d) => d.availability).length;
    const newCount = doctors.filter((d) => d.schedule).length;
    const activeCount = doctors.filter((d) => d.isActive).length;

    console.log("Doctors with 'availability' (Legacy):", legacyCount);
    console.log("Doctors with 'schedule' (Modern):", newCount);
    console.log("Doctors with 'isActive' flag:", activeCount);

    if (doctors.length > 0) {
      console.log("\nSample 1 Record Keys:", Object.keys(doctors[0]));
      if (doctors[0].schedule) {
        console.log(
          "Schedule Sample:",
          JSON.stringify(doctors[0].schedule, null, 2),
        );
      }
    }
  } finally {
    await client.close();
  }
}

main().catch(console.error);
