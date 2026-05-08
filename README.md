# ClawMind  - [clawmind.online](https://clawmind.online)

ClawMind is a Next.js productivity and placement-prep app built around
accountability, progress tracking, and AI-assisted study tools. It combines a
modern dashboard with authentication, activity logging, streaks, leaderboards,
heatmaps, notes, quizzes, and profile settings — so you stop avoiding
accountability and start moving forward.

## Problem

Students and job seekers juggle scattered tools for planning, tracking, and
revision. Notes live in one app, study material in another, schedules in a
third, and progress in nothing at all. The result is broken consistency, weak
visibility into actual progress, and material that is hard to revisit when it
matters.

## Solution

ClawMind unifies those workflows in a single app:

- **Auth and accounts** — email/password sign-up, Google and GitHub sign-in,
  password reset, and email verification.
- **Activity tracking** — log activities, earn points, and maintain streaks.
- **Insights** — dashboard, stats feed, leaderboard, and contribution-style
  heatmap.
- **AI study tools** — notes, quizzes, and an integrated whiteboard.
- **Profile and connections** — manage linked providers, sync GitHub and
  LeetCode usernames, and configure platform integrations.
- **Personalization** — light and dark themes plus a polished landing page.

By centralizing daily study workflows and surfacing progress on a global
leaderboard, ClawMind makes consistency measurable and competition healthy.

## Setup

### Prerequisites

- [Bun](https://bun.sh/) package manager
- A reachable MongoDB connection string
- Better Auth, Google, GitHub, and Resend credentials for the full auth and
  email flows

### Local Setup

1. Install dependencies:

   ```bash
   bun install
   ```

2. Create your local environment file from the example:

   ```bash
   cp .env.example .env.local
   ```

3. Open `.env.local` and fill in the required values. See
   [Environment Variables](#environment-variables) below for what each one does.

4. Start the development server:

   ```bash
   bun run dev
   ```

5. Open the app at [http://localhost:3000](http://localhost:3000).

## Instructions

### Environment Variables

The app reads configuration from `.env.local`. Use `.env.example` as the
canonical list of variable names, then fill in your own values.

| Variable                                    | Purpose                                                           |
| ------------------------------------------- | ----------------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                        | Signs Better Auth sessions and tokens.                            |
| `BETTER_AUTH_URL`                           | Public URL Better Auth uses for callbacks and cookies.            |
| `MONGO_DB_URL`                              | MongoDB connection string for users, sessions, and app data.      |
| `NEXT_PUBLIC_APP_URL`                       | Client-side base URL used by the auth client and OAuth redirects. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Enable Google sign-in.                                            |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | Enable GitHub sign-in.                                            |
| `RESEND_API_KEY`                            | Authenticates outbound email through Resend.                      |
| `RESEND_FROM_EMAIL`                         | The verified sender address for verification and reset emails.    |
| `ENCRYPTION_SECRET`                         | Used by encryption helpers for sensitive stored values.           |
| `NEXT_PUBLIC_TLDRAW_LICENSE_KEY`            | Optional. Removes the watermark on the whiteboard.                |

In production, `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` should both point at
your deployed origin (for example `https://clawmind.online`) so OAuth callbacks
and session cookies resolve correctly.

### Available Scripts

```bash
bun run dev      # start the Next.js dev server
bun run build    # produce a production build
bun run start    # run the production build
bun run lint     # run ESLint over the project
```

## Usage

1. Open the landing page to see the product overview, animated hero, and entry
   points to authentication.
2. Create an account or sign in with email, Google, or GitHub depending on which
   providers you configured.
3. Verify your email if prompted — verification is required before some flows
   become fully available.
4. Visit the dashboard to review current stats, streaks, recent activity, and
   progress signals.
5. Log an activity to earn points and update your streak.
6. Use the study tools to organize notes, generate quizzes, and work in the
   whiteboard area.
7. Open the leaderboard to compare points and consistency with other users.
8. Visit the profile and settings pages to manage sessions, connected providers,
   and personal details.

### Recommended first run

1. Confirm the home page loads at `/`.
2. Sign up with a test account.
3. Verify the account if your email provider is configured.
4. Log one activity.
5. Check the dashboard, leaderboard, and settings pages to confirm auth and data
   access are working end to end.

### Troubleshooting

If something fails during setup, check these first:

- `.env.local` exists and contains every required key.
- MongoDB is reachable from your machine.
- Auth and email provider credentials are valid and not expired.
- `bun run dev` starts without build errors.
- For OAuth issues, confirm the redirect URI registered with Google and GitHub
  matches `${BETTER_AUTH_URL}/api/auth/callback/<provider>`.

## Notes

- Built on the Next.js App Router.
- Authentication powered by [Better Auth](https://www.better-auth.com/).
- Data layer backed by MongoDB (driver and Mongoose are both used where
  appropriate).
- Transactional email handled through [Resend](https://resend.com/).
- Whiteboard powered by [tldraw](https://tldraw.dev/).
