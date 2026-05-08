/**
 * One-time cleanup for orphan user records created before account.accountLinking
 * was correctly nested in lib/auth.ts. For each given email, keeps the user that
 * owns the email/password (`credential`) account and deletes any other users with
 * the same email plus their accounts, sessions, and verification tokens.
 *
 * Usage:
 *   bun scripts/cleanup-orphan-users.ts <email> [<email> ...]            (dry run)
 *   bun scripts/cleanup-orphan-users.ts <email> [<email> ...] --apply    (delete)
 */

import { MongoClient, ObjectId } from "mongodb";

type UserDoc = {
  _id: ObjectId | string;
  email: string;
  name?: string;
  createdAt?: Date;
};

type AccountDoc = {
  _id: ObjectId | string;
  userId: ObjectId | string;
  providerId: string;
  accountId?: string;
};

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const emails = args.filter((a) => !a.startsWith("--")).map((e) => e.toLowerCase());

if (emails.length === 0) {
  console.error("Usage: bun scripts/cleanup-orphan-users.ts <email> [<email> ...] [--apply]");
  process.exit(1);
}

const url = process.env.MONGO_DB_URL;
if (!url) {
  console.error("MONGO_DB_URL is not set. Make sure .env is loaded (Bun loads it automatically).");
  process.exit(1);
}

const idStr = (id: ObjectId | string) => (typeof id === "string" ? id : id.toHexString());

const client = new MongoClient(url);

async function main() {
  await client.connect();
  const db = client.db();
  const users = db.collection<UserDoc>("user");
  const accounts = db.collection<AccountDoc>("account");
  const sessions = db.collection<{ userId: ObjectId | string }>("session");
  const verifications = db.collection<{ identifier: string }>("verification");

  console.log(`\nMode: ${apply ? "APPLY (will delete)" : "DRY RUN (no changes)"}`);
  console.log(`Emails: ${emails.join(", ")}\n`);

  let totalOrphanUsers = 0;
  const orphanUserIds: (ObjectId | string)[] = [];

  for (const email of emails) {
    console.log(`──── ${email} ────`);
    const userDocs = await users.find({ email: { $regex: `^${escapeRegex(email)}$`, $options: "i" } }).toArray();

    if (userDocs.length === 0) {
      console.log("  No users found.\n");
      continue;
    }

    // Look up accounts per user so we can spot which one holds the credential record.
    const enriched = await Promise.all(
      userDocs.map(async (u) => {
        const userAccounts = await accounts.find({ userId: u._id }).toArray();
        return { user: u, accounts: userAccounts };
      })
    );

    enriched.forEach(({ user, accounts: accs }, i) => {
      const providers = accs.map((a) => a.providerId).join(", ") || "(none)";
      console.log(
        `  [${i}] user=${idStr(user._id)} name="${user.name ?? ""}" created=${
          user.createdAt?.toISOString() ?? "?"
        } providers=[${providers}]`
      );
    });

    const keepCandidates = enriched.filter(({ accounts: accs }) =>
      accs.some((a) => a.providerId === "credential")
    );

    if (userDocs.length === 1) {
      console.log("  Only one user. Nothing to clean.\n");
      continue;
    }

    if (keepCandidates.length === 0) {
      console.log("  WARNING: no user has a 'credential' (email/password) account. Skipping — resolve manually.\n");
      continue;
    }

    if (keepCandidates.length > 1) {
      console.log("  WARNING: multiple users have a 'credential' account for this email. Skipping — resolve manually.\n");
      continue;
    }

    const keep = keepCandidates[0]!.user;
    const orphans = enriched.filter(({ user }) => idStr(user._id) !== idStr(keep._id));

    console.log(`  KEEP:    ${idStr(keep._id)}`);
    for (const { user } of orphans) {
      console.log(`  ORPHAN:  ${idStr(user._id)}`);
      orphanUserIds.push(user._id);
      totalOrphanUsers++;
    }
    console.log("");
  }

  if (orphanUserIds.length === 0) {
    console.log("No orphans to delete. Done.");
    await client.close();
    return;
  }

  if (!apply) {
    console.log(`\nDry run complete. Would delete ${totalOrphanUsers} orphan user(s) plus their accounts/sessions.`);
    console.log("Re-run with --apply to actually delete.\n");
    await client.close();
    return;
  }

  // Apply deletions. Order: accounts/sessions/verifications first, user last.
  const accountsRes = await accounts.deleteMany({ userId: { $in: orphanUserIds } });
  const sessionsRes = await sessions.deleteMany({ userId: { $in: orphanUserIds } });
  const verificationsRes = await verifications.deleteMany({
    identifier: { $in: emails.map((e) => new RegExp(`^${escapeRegex(e)}$`, "i")) },
  });
  const usersRes = await users.deleteMany({ _id: { $in: orphanUserIds as ObjectId[] } });

  console.log("\nApplied:");
  console.log(`  accounts deleted:      ${accountsRes.deletedCount}`);
  console.log(`  sessions deleted:      ${sessionsRes.deletedCount}`);
  console.log(`  verifications deleted: ${verificationsRes.deletedCount}`);
  console.log(`  users deleted:         ${usersRes.deletedCount}`);

  await client.close();
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch(async (err) => {
  console.error(err);
  await client.close().catch(() => {});
  process.exit(1);
});
