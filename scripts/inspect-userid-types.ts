/**
 * Diagnostic: check whether account.userId is stored as ObjectId or string,
 * and find any rows that survived a delete because of type mismatch.
 */

import { MongoClient, ObjectId } from "mongodb";

const url = process.env.MONGO_DB_URL!;
const client = new MongoClient(url);

async function main() {
  await client.connect();
  const db = client.db();
  const accounts = db.collection("account");
  const users = db.collection("user");

  const allAccounts = await accounts.find({}).toArray();
  console.log(`\nTotal accounts: ${allAccounts.length}\n`);

  let asObjectId = 0;
  let asString = 0;
  let asOther = 0;

  for (const a of allAccounts) {
    const t =
      a.userId instanceof ObjectId
        ? "ObjectId"
        : typeof a.userId === "string"
          ? "string"
          : typeof a.userId;
    if (t === "ObjectId") asObjectId++;
    else if (t === "string") asString++;
    else asOther++;

    console.log(
      `  account=${a._id} providerId=${a.providerId} accountId=${a.accountId ?? "?"} userId=${a.userId} userIdType=${t}`
    );
  }

  console.log(`\nuserId stored as ObjectId: ${asObjectId}`);
  console.log(`userId stored as string:   ${asString}`);
  console.log(`userId stored as other:    ${asOther}`);

  // Same for user._id
  const sampleUser = await users.findOne({});
  console.log(
    `\nSample user._id type: ${sampleUser?._id instanceof ObjectId ? "ObjectId" : typeof sampleUser?._id}`
  );

  // Now check: any accounts with providerId github/google whose accountId matches
  // a user's previous link? Look specifically for the dangling github 144692822.
  const danglingGithub = await accounts
    .find({ providerId: "github" })
    .toArray();
  console.log(`\nAll github accounts now in DB:`);
  for (const a of danglingGithub) {
    console.log(`  account=${a._id} accountId=${a.accountId} userId=${a.userId} (type=${typeof a.userId})`);
  }

  await client.close();
}

main().catch(async (err) => {
  console.error(err);
  await client.close().catch(() => {});
  process.exit(1);
});
