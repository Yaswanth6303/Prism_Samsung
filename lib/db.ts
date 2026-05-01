import mongoose from 'mongoose'

let cached: any = (global as any)._mongoClient

export async function connectToDB() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env')
  }

  if (cached && cached.isConnected) {
    return cached
  }

  const conn = await mongoose.connect(MONGODB_URI)
  cached = { client: mongoose, isConnected: true }
  return conn
}

export default connectToDB
