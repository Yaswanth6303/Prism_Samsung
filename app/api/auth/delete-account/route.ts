import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import connectToDB from "@/lib/mongodb";
import { Activity } from "@/lib/models/Activity";
import { DailyActivityLog } from "@/lib/models/DailyActivityLog";
import { Subject } from "@/lib/models/Subject";
import Connection from "@/lib/models/Connection";

// better-auth doesn't expose deleteUser over HTTP by default, so this route
// authenticates the caller and removes their auth records and owned data.
export async function POST() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const email = session.user.email;

  // better-auth's MongoDB adapter stores user._id as an ObjectId; bail early
  // rather than passing an arbitrary string into a query and tripping a BSON error.
  if (!ObjectId.isValid(userId)) {
    return NextResponse.json({ message: "Invalid user id" }, { status: 400 });
  }
  const userObjectId = new ObjectId(userId);

  try {
    // better-auth's MongoDB adapter stores userId as ObjectId in account/session
    // collections, but session.user.id arrives as a hex string. Match on both forms
    // so neither legacy string-form rows nor current ObjectId-form rows survive.
    const userIdMatch = { $in: [userObjectId, userId] };
    await Promise.all([
      db.collection("session").deleteMany({ userId: userIdMatch }),
      db.collection("account").deleteMany({ userId: userIdMatch }),
      email
        ? db.collection("verification").deleteMany({ identifier: email })
        : Promise.resolve(),
    ]);

    // Pass the string id and let each mongoose schema cast it via Schema.Types.ObjectId.
    await connectToDB();
    await Promise.all([
      Activity.deleteMany({ userId }),
      Subject.deleteMany({ userId }),
      DailyActivityLog.deleteMany({ userId }),
      Connection.deleteMany({ userId }),
    ]);

    // Delete the user record last so cleanup queries above can still resolve owners.
    await db.collection("user").deleteOne({ _id: userObjectId });

    const response = NextResponse.json({ ok: true });
    // Better-auth sets the session cookie with path=/, so an expired Set-Cookie
    // with the same path is the only reliable way to clear it from the browser.
    const expire = { path: "/", expires: new Date(0), maxAge: 0 } as const;
    response.cookies.set("better-auth.session_token", "", expire);
    response.cookies.set("__Secure-better-auth.session_token", "", { ...expire, secure: true });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete account";
    return NextResponse.json({ message }, { status: 500 });
  }
}
