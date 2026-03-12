import { MongoClient, ObjectId } from "mongodb";

const uri =
  "mongodb+srv://zu37216_db_user:Ziauddin14@primecare.xottptx.mongodb.net/primecare?retryWrites=true&w=majority&appName=Primecare";

const DOCTORS = [
  {
    name: "Dr. Hassan Ahmed",
    department: "Cardiology",
    consultationFee: 120,
    schedule: {
      days: ["Mon", "Wed", "Fri"],
      startTime: "09:00",
      endTime: "17:00",
      slotDuration: 30,
    },
    isActive: true,
    bio: "Chief of Cardiology specializing in non-invasive imaging and preventive clinical care.",
  },
  {
    name: "Dr. Sarah Khan",
    department: "Dermatology",
    consultationFee: 100,
    schedule: {
      days: ["Tue", "Thu", "Sat"],
      startTime: "10:00",
      endTime: "18:00",
      slotDuration: 30,
    },
    isActive: true,
    bio: "Senior Dermatologist focusing on advanced skincare and medical dermatology.",
  },
  {
    name: "Dr. Zaid Malik",
    department: "Pediatrics",
    consultationFee: 80,
    schedule: {
      days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
      startTime: "10:00",
      endTime: "20:00",
      slotDuration: 30,
    },
    isActive: true,
    bio: "Compassionate pediatrician with 15+ years of experience in childhood development.",
  },
  {
    name: "Dr. Amna Qureshi",
    department: "Dentistry",
    consultationFee: 150,
    schedule: {
      days: ["Sat", "Sun"],
      startTime: "09:00",
      endTime: "15:00",
      slotDuration: 30,
    },
    isActive: true,
    bio: "Dental specialist with expertise in restorative and aesthetic dentistry.",
  },
];

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db("primecare");

    console.log("Cleaning doctors collection...");
    await db.collection("doctors").deleteMany({}); // Delete everything regardless of filters

    console.log("Inserting corrected doctors...");
    await db.collection("doctors").insertMany(DOCTORS);

    console.log("Done! Doctors collection re-seeded with modern structure.");
  } finally {
    await client.close();
  }
}

main().catch(console.error);
