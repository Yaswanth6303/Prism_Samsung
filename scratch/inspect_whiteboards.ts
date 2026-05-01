import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import connectToDB from '../lib/mongodb'
import { Subject } from '../lib/models/Subject'

async function check() {
  await connectToDB()
  const subjects = await Subject.find({ whiteboards: { $exists: true, $not: { $size: 0 } } }).lean()
  console.log('Subjects with whiteboards:', subjects.length)
  for (const s of subjects) {
    console.log(`Subject: ${s.name} (${s._id}) - User: ${s.userId} (Type: ${typeof s.userId})`)
    if (s.userId && (s.userId as any).constructor.name === 'ObjectId') {
       console.log(`    User is ObjectId: ${s.userId.toString()}`)
    }
    for (const w of s.whiteboards) {
      console.log(`  Whiteboard: ${w.title} - ID: ${w._id} (Type: ${typeof w._id})`)
      if (w._id && (w._id as any).constructor.name === 'ObjectId') {
         console.log(`    ID is ObjectId: ${w._id.toString()}`)
      }
    }
  }
  process.exit(0)
}

check()
