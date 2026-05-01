import mongoose from 'mongoose'

type CachedMongo = {
  client: typeof mongoose
  isConnected: boolean
}

const globalForMongo = global as typeof globalThis & {
  _mongoClient?: CachedMongo
}

let cached = globalForMongo._mongoClient

export async function connectToDB() {
  const MONGODB_URI = process.env.MONGODB_URI || ''
  const MONGODB_DB = process.env.MONGODB_DB || 'prism_samsung'
  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env')
  }

  if (cached && cached.isConnected) {
    return cached
  }

  const conn = await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB, serverSelectionTimeoutMS: 5000 })
  cached = { client: mongoose, isConnected: true }
  globalForMongo._mongoClient = cached
  return conn
}

export default connectToDB
