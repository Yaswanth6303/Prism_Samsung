import mongoose from 'mongoose';
import { Subject } from './lib/models/Subject';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function run() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) throw new Error('No URI');
  await mongoose.connect(MONGODB_URI);
  
  const subjects = await Subject.find({ name: 'ClawMind' });
  console.log('Subjects found with name ClawMind:', subjects.length);
  for (const s of subjects) {
    console.log(`ID: ${s._id}, UserID: ${s.userId}, Whiteboards: ${s.whiteboards.length}`);
    if (s.whiteboards.length > 0) {
        console.log('Whiteboard titles:', s.whiteboards.map(w => w.title));
    }
  }
  
  await mongoose.disconnect();
}
run().catch(console.error);
