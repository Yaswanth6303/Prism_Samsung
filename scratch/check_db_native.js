const { MongoClient, ObjectId } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function run() {
  const uri = process.env.MONGO_DB_URL;
  const dbName = process.env.MONGODB_DB || "prism_samsung";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const subjects = await db.collection('subjects').find({ name: 'ClawMind' }).toArray();

    console.log('Subjects with name ClawMind:', subjects.length);
    for (const s of subjects) {
      console.log(`ID: ${s._id}, UserID: ${s.userId}, Whiteboards Array Size: ${s.whiteboards ? s.whiteboards.length : 'missing'}`);
      if (s.whiteboards) {
        s.whiteboards.forEach((w, i) => {
          console.log(`  [${i}] Title: ${w.title}, Created: ${w.createdDate}`);
        });
      }
    }
  } finally {
    await client.close();
  }
}
run().catch(console.error);
