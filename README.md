# Cashew Global Markets

this is a 360 degree app for the investment team

## Run locally
    npm install
    cp .env.example .env.local
    npm run dev
Open http://localhost:3000 and use the development login.

## What is real and what is a seam
- **Auth** (`lib/auth.ts`): dev login only. Replace `getUserId()` with Clerk, Auth.js or similar for Google, Apple and email. Dev login is blocked in production.
- **Market data** (`lib/provider.ts`): returns labeled sample data. Implement `MarketData` with a licensed provider before customers see quotes.
- **Storage** (`lib/store.ts`): in-memory without `DATABASE_URL`, Postgres with it. Every row is keyed by `user_id`.
- **AI** (`lib/ai.ts`): needs `ANTHROPIC_API_KEY`, rate limited per user.
- **World map, News, Social, Connections** are built.
  - News reads RSS or Atom feeds you add. Only headlines and links are shown.
  - Social searches recent X posts with a bearer token you paste. It needs an X API plan that includes search. I tested it against a mock only, not the real X API.
  - Connections adds MCP servers over Streamable HTTP. Only tools marked read-only start on. Tools that can change things start off and need confirmation on every run. Tokens are stored encrypted with a key derived from `AUTH_SECRET`.
  - Feed and MCP URLs must be https and public. Private and metadata addresses are blocked.
- **Not built yet**: Reddit, StockTwits and Bluesky; exchange holidays on the map.

## Hosting: Vercel + Clerk + Neon
1. Push this folder to a GitHub repo and import it at vercel.com/new (framework: Next.js).
2. In the Vercel project, open Storage or Integrations and add **Clerk** and **Neon Postgres** from the Marketplace. This sets `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` and `DATABASE_URL` for you.
3. In the Clerk dashboard, turn on Google, Apple and email sign-in. Apple needs an Apple Developer account.
4. Add `AUTH_SECRET` (any long random string) and, for AI features, `ANTHROPIC_API_KEY`.
5. Deploy. Keep `MARKET_DATA_PROVIDER=sample` until a licensed provider is implemented.

## Alerts, voice and live TV
- **Alerts** (`/alerts`): price above or below, percent move, market open or close. Rules are saved per user and checked every minute while the app is open.
- **Voice**: uses the browser's built-in speech, so it costs nothing. It starts off on every page load because browsers need a tap first. Alerts based on sample data say "Sample data" aloud.
- **Live TV** (`lib/tv.ts`): YouTube's embedded player for Bloomberg TV and any YouTube link. CNBC opens in a pop-up window where the customer signs in with their own account, so the app never handles that login. Do not build a form that collects CNBC or TV-provider passwords. Confirm the channel IDs, that each channel still allows embedding, and that you have the right to show it to paying customers before launch. Bloomberg publishes licensing details at bloomberg.com/distribution.

## Legal pages
`/terms` and `/privacy` are public. Fill in the company name, contact email, governing law and effective date once in `lib/legal.ts`, replace the `[DATA PROVIDER]` line in the privacy page, and have a lawyer review the text before launch.
