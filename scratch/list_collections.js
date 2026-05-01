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
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Also try to find ANY subject to see what they look like
    const anySubject = await db.collection('subjects').findOne({});
    console.log('Sample subject:', anySubject);
    
    // Maybe the collection is 'directories'?
    const anyDir = await db.collection('directories').findOne({});
    console.log('Sample directory:', anyDir);

  } finally {
    await client.close();
  }
}
run().catch(console.error);
