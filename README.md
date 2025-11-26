# Pro-Betting-Dashboard

This repository now contains a minimal Next.js application with a fixed betting dashboard component.

Quick start (locally):

1. Install dependencies:

```bash
npm install
```

2. Run dev server:

```bash
npm run dev
```

3. Build for production:

```bash
npm run build
npm start
```

Deployment to Vercel:

- Connect this repository to Vercel and set the root to the project root. Vercel will run `npm install` and `npm run build` automatically.
- The `start` command is `next start` which Vercel does not need in most cases.

Notes:
- The Dashboard component has been refactored to avoid React anti-patterns: no state updates inside `useMemo`, inputs are stored as strings, and validation runs inside a memoized computation.
- Styling is provided via `styles/globals.css` to avoid adding a Tailwind build step.
Interactive Betting with Live Odds
