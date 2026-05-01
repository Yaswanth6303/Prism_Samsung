import { MongoClient } from "mongodb";

if (!process.env.MONGO_DB_URL) {
  throw new Error("MONGO_DB_URL is not set in the environment variables");
}

export const client = new MongoClient(process.env.MONGO_DB_URL);
export const db = client.db();
