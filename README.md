# Loan CRM — Vercel + Turso deployment

This is the same CRM, restructured so it runs as a serverless app on Vercel with
Turso (hosted SQLite) as the database. Unlike the local Node server version, this
one is reachable from anywhere — any device, any browser — once deployed.

## Why the restructure was needed

The local backend (`server.js`) writes to a JSON file on disk. Vercel's serverless
functions don't have a persistent, writable filesystem between requests, so that
approach doesn't work there. Turso is a real hosted database reachable over the
network, which is what a stateless serverless function needs — so `api/loans.js`
talks to Turso instead of a local file.

## 1. Create the Turso database

Install the Turso CLI and sign in:

```
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
```

Create the database:

```
turso db create loan-crm
```

Get the connection URL and an auth token:

```
turso db show loan-crm --url
turso db tokens create loan-crm
```

Keep both values handy — you'll paste them into Vercel next.

## 2. Deploy to Vercel

From inside this folder:

```
npm install -g vercel     # if you don't already have the CLI
vercel login
vercel
```

Follow the prompts (accept the defaults — this is a plain "Other" project, no
framework needed).

## 3. Set environment variables

In the Vercel dashboard for this project: **Settings → Environment Variables**,
add:

| Name | Value |
|---|---|
| `TURSO_DATABASE_URL` | the URL from `turso db show loan-crm --url` |
| `TURSO_AUTH_TOKEN` | the token from `turso db tokens create loan-crm` |

Apply them to Production (and Preview/Development if you'll use those too).

Then redeploy so the function picks up the new variables:

```
vercel --prod
```

## 4. Open it

Visit the URL Vercel gives you (something like `https://loan-crm-yourname.vercel.app`).
That's your CRM — the frontend calls `/api/loans`, which reads and writes to your
Turso database. Every device that opens that URL sees the same, shared data.

## Local testing (optional)

```
vercel dev
```

This runs the same setup locally. Create a `.env` file (copy `.env.example`) with
your Turso credentials first, so the function can find them.

## Files

```
loan-crm-vercel/
├── api/
│   └── loans.js       ← serverless function, reads/writes Turso
├── public/
│   └── index.html     ← the CRM frontend (served at your site's root)
├── package.json
└── .env.example
```

## A couple of things worth knowing

- Because this is now a shared, network-reachable database, anyone with the URL
  (and no other access control) could reach `/api/loans`. If this will hold real
  borrower data, consider adding simple authentication in front of it — happy to
  help add that (e.g. a password gate or Vercel's built-in auth) if you'd like.
- I wasn't able to actually run this against live Turso/Vercel from here (no
  outbound network access in this environment), so give the flow above a test
  run after deploying and let me know if anything doesn't behave as expected.
