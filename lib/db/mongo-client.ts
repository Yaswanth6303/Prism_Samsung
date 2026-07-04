import { MongoClient } from "mongodb";

import { env } from "@/lib/env";

// A shared client keeps connection usage predictable across the app.
export const client = new MongoClient(env.MONGO_URL);
export const db = client.db();
