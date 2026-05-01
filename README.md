This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


# ProductivityHub (Next.js + Bun)

This project uses Next.js App Router for both frontend and backend routes.

## Current Ownership Split

- You: feature APIs and product flows
- Teammate: authentication and database integration

`app/api/auth/[...nextauth]/route.ts` is currently a placeholder that returns `501` until auth is integrated.

## Feature APIs (Implemented)

- `POST /api/activities` - log manual activity (`gym|jog|custom`) and award points
- `GET /api/stats?userId=...` - dashboard summary
- `GET /api/feed?userId=...&limit=25` - unified activity feed
- `GET /api/heatmap?userId=...&year=2026` - daily activity heatmap
- `GET /api/leaderboard?metric=points&period=alltime&userId=...&collegeId=...` - scoped leaderboard
- `GET /api/ai/directories?userId=...` - list note directories
- `POST /api/ai/directories` - create note directory
- `GET /api/ai/notes?userId=...` - list generated notes
- `POST /api/ai/notes` - generate note content (placeholder AI provider wrapper)
- `POST /api/ai/quiz` - generate quiz from a note
- `GET /api/ping` - health check

## Feature Internals

- `lib/feature-store.ts` - in-memory feature store and business logic
- `lib/points.ts` - points engine constants/helpers
- `lib/streak.ts` - streak computation utility
- `lib/aiClient.ts` - provider-agnostic AI placeholder wrapper

The current backend is intentionally persistence-agnostic so your teammate can later replace in-memory operations with MongoDB/Mongoose without changing the route contracts.

## Run

```bash
bun i
bun dev
```

## Type Check

```bash
bunx tsc --noEmit
```

## Environment

See `.env.example` for planned variables. Only feature routes are required right now; auth/DB vars can be filled when your teammate plugs them in.
