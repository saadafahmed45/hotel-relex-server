require("dotenv").config();
const { MongoClient } = require("mongodb");
const { SEED_HOTELS } = require("./seedData");

const dbUserName = process.env.DB_USER;
const dbPassword = process.env.DB_PASS;

if (!dbUserName || !dbPassword) {
  console.error("Missing DB_USER or DB_PASS in server/.env");
  process.exit(1);
}

const uri = `mongodb+srv://${dbUserName}:${dbPassword}@cluster0.58zpnyp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri);

async function seed() {
  try {
    await client.connect();
    console.log("Connected to MongoDB for seeding...");
    const db = client.db("hotelRelexDatabase");
    const hotelCollection = db.collection("hotels");

    for (const hotel of SEED_HOTELS) {
      await hotelCollection.updateOne(
        { slug: hotel.slug },
        {
          $set: {
            ...hotel,
            updatedAt: new Date().toISOString(),
          },
          $setOnInsert: {
            createdAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );
      console.log(`✓ Seeded room: ${hotel.name} (${hotel.slug})`);
    }

    const totalCount = await hotelCollection.countDocuments();
    console.log(`\nSuccess! MongoDB hotelCollection now has ${totalCount} rooms.`);
  } catch (err) {
    console.error("Seeding failed:", err);
    process.exit(1);
  } finally {
    await client.close();
    process.exit(0);
  }
}

seed();
