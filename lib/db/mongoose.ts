import mongoose from "mongoose";

import { env } from "@/lib/env";

const MONGODB_URI = env.MONGO_URL;
const MONGODB_DB = env.MONGODB_DB;

/**
 * Cache the Mongoose connection across hot reloads so development does not open a new socket on every request.
 */
type CachedConnection = {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

const globalForMongoose = global as typeof globalThis & {
  mongoose?: CachedConnection
}

const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };
globalForMongoose.mongoose = cached;

async function connectToDatabase() {
  if (cached.conn) {
    // Reuse the existing connection whenever possible to keep API routes fast.
    return cached.conn;
  }

  if (!cached.promise) {
    // These options keep the connection predictable in both local dev and deployment.
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
      serverSelectionTimeoutMS: 5000,
      family: 4
    };
    // Store the in-flight promise so concurrent requests share the same connect attempt.
    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Clear the failed promise so the next request can retry cleanly.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
