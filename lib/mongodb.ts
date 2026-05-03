import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGO_DB_URL || process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "clawmind";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
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
    return cached.conn;
  }
  console.log("Connecting to MongoDB...");
  

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
      serverSelectionTimeoutMS: 5000,
      family: 4
    };
    console.log("MongoDB connection options:", opts);
    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log("MongoDB connected successfully", mongoose.connection.host);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(cached.conn ? "MongoDB connection established" : "MongoDB connection failed");
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
