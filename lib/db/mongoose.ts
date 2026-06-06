import mongoose from "mongoose";

// Support both environment variable names so local and deployed setups can share the same helper.
const MONGODB_URI = process.env.MONGO_DB_URL || process.env.MONGODB_URI;
// Default to the app database name when the environment does not override it.
const MONGODB_DB = process.env.MONGODB_DB || "clawmind";

if (!MONGODB_URI) {
  throw new Error(
    "Please define the MONGODB_URI environment variable inside .env.local"
  );
}

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
  // Only log the first connect attempt so connection setup stays easy to trace.
  console.log("Connecting to MongoDB...");
  

  if (!cached.promise) {
    // These options keep the connection predictable in both local dev and deployment.
    const opts = {
      bufferCommands: false,
      dbName: MONGODB_DB,
      serverSelectionTimeoutMS: 5000,
      family: 4
    };
    console.log("MongoDB connection options:", opts);
    // Store the in-flight promise so concurrent requests share the same connect attempt.
    cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
      console.log("MongoDB connected successfully", mongoose.connection.host);
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
    // This log makes it obvious whether the cached connection is healthy.
    console.log(cached.conn ? "MongoDB connection established" : "MongoDB connection failed");
  } catch (e) {
    // Clear the failed promise so the next request can retry cleanly.
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectToDatabase;
