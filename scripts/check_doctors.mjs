import { connect } from "./_db.mjs";

async function main() {
  const client = connect();
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
