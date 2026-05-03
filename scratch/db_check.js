const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

async function check() {
  const client = new MongoClient(process.env.MONGO_DB_URL);
  try {
    await client.connect();
    const db = client.db('prisma_samsung');
    const cols = await db.listCollections().toArray();
    for (const col of cols) {
      const count = await db.collection(col.name).countDocuments();
      console.log(`Collection: ${col.name}, Count: ${count}`);
      if (col.name === 'users' || col.name === 'user') {
        const sample = await db.collection(col.name).findOne();
        console.log(`Sample from ${col.name}:`, JSON.stringify(sample, null, 2));
      }
    }
  } catch (e) {
    console.error(e);
  } finally {
    await client.close();
  }
}

check();
