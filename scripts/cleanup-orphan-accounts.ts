/**
 * Deletes account/session rows whose userId no longer points to an existing user.
 * These dangling rows are what cause `account_already_linked_to_different_user`
 * when a user tries to link a social provider whose providerAccountId still
 * shows up in some deleted user's account row.
 *
 * Other users' valid data is untouched — only rows referencing missing users.
 *
 * Usage:
 *   bun scripts/cleanup-orphan-accounts.ts            (dry run)
 *   bun scripts/cleanup-orphan-accounts.ts --apply    (delete)
 */

import { MongoClient, ObjectId } from "mongodb";

const apply = process.argv.includes("--apply");

const url = process.env.MONGO_DB_URL;
if (!url) {
  console.error("MONGO_DB_URL is not set.");
  process.exit(1);
}

const normalizeId = (id: unknown): string => {
  if (id instanceof ObjectId) return id.toHexString();
  if (typeof id === "string") return id;
  return String(id);
};

const client = new MongoClient(url);

async function main() {
  await client.connect();
  const db = client.db();
  const accounts = db.collection("account");
  const sessions = db.collection("session");
  const users = db.collection("user");

  console.log(`\nMode: ${apply ? "APPLY (will delete)" : "DRY RUN (no changes)"}\n`);

  const allUsers = await users.find({}, { projection: { _id: 1 } }).toArray();
  const validUserIds = new Set(allUsers.map((u) => normalizeId(u._id)));
  console.log(`Valid users: ${validUserIds.size}`);

  const allAccounts = await accounts.find({}).toArray();
  const orphanAccounts = allAccounts.filter((a) => !validUserIds.has(normalizeId(a.userId)));
  console.log(`Total accounts: ${allAccounts.length}, orphan: ${orphanAccounts.length}`);

  const allSessions = await sessions.find({}).toArray();
  const orphanSessions = allSessions.filter((s) => !validUserIds.has(normalizeId(s.userId)));
  console.log(`Total sessions: ${allSessions.length}, orphan: ${orphanSessions.length}\n`);

  if (orphanAccounts.length > 0) {
    console.log("Orphan accounts:");
    for (const a of orphanAccounts) {
      console.log(
        `  account=${a._id} providerId=${a.providerId} accountId=${a.accountId ?? a.providerAccountId ?? "?"} userId=${a.userId}`
      );
    }
    console.log("");
  }

  if (orphanSessions.length > 0) {
    console.log(`Orphan sessions: ${orphanSessions.length} (details suppressed)\n`);
  }

  if (orphanAccounts.length === 0 && orphanSessions.length === 0) {
    console.log("Nothing to clean.");
    await client.close();
    return;
  }

  if (!apply) {
    console.log("Dry run complete. Re-run with --apply to delete.\n");
    await client.close();
    return;
  }

  const accountIds = orphanAccounts.map((a) => a._id);
  const sessionIds = orphanSessions.map((s) => s._id);

  const accRes = await accounts.deleteMany({ _id: { $in: accountIds } });
  const sessRes = await sessions.deleteMany({ _id: { $in: sessionIds } });

  console.log("Applied:");
  console.log(`  accounts deleted: ${accRes.deletedCount}`);
  console.log(`  sessions deleted: ${sessRes.deletedCount}`);

  await client.close();
}

main().catch(async (err) => {
  console.error(err);
  await client.close().catch(() => {});
  process.exit(1);
});
