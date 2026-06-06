import { MongoClient } from "mongodb";

// Fail fast if the app boots without a database URL; every data path depends on it.
if (!process.env.MONGO_DB_URL) {
  throw new Error("MONGO_DB_URL is not set in the environment variables");
}

// A shared client keeps connection usage predictable across the app.
export const client = new MongoClient(process.env.MONGO_DB_URL);
export const db = client.db();
