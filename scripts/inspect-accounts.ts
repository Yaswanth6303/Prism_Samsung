/**
 * Diagnostic: dump every account row for github/google and check whether each
 * one's userId resolves to a real user and what email that user has.
 */

import { MongoClient, ObjectId } from "mongodb";

const url = process.env.MONGO_DB_URL;
if (!url) {
  console.error("MONGO_DB_URL is not set.");
  process.exit(1);
}

const client = new MongoClient(url);

async function main() {
  await client.connect();
  const db = client.db();
  const accounts = db.collection("account");
  const users = db.collection("user");

  const accs = await accounts.find({ providerId: { $in: ["github", "google", "credential"] } }).toArray();
  console.log(`\nTotal accounts (credential/github/google): ${accs.length}\n`);

  for (const a of accs) {
    let userEmail = "(user not found)";
    try {
      const uid =
        typeof a.userId === "string"
          ? ObjectId.isValid(a.userId)
            ? new ObjectId(a.userId)
            : a.userId
          : a.userId;
      const u = await users.findOne({ _id: uid as ObjectId });
      if (u) userEmail = u.email;
    } catch {
      userEmail = "(invalid userId)";
    }

    console.log(
      `  account=${a._id} providerId=${a.providerId} accountId=${a.accountId ?? a.providerAccountId ?? "?"} userId=${a.userId} userEmail=${userEmail}`
    );
  }

  console.log("");
  await client.close();
}

main().catch(async (err) => {
  console.error(err);
  await client.close().catch(() => {});
  process.exit(1);
});