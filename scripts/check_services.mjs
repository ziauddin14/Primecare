import { connect } from "./_db.mjs";

async function main() {
  const client = connect();
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
