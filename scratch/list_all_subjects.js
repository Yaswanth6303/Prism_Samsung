const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "prism_samsung";
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const subjects = await db.collection('subjects').find({}).toArray();
    
    console.log('Total subjects:', subjects.length);
    subjects.forEach(s => {
      console.log(`Name: "${s.name}", ID: ${s._id}, Whiteboards: ${s.whiteboards ? s.whiteboards.length : 'none'}`);
    });

  } finally {
    await client.close();
  }
}
run().catch(console.error);
