# Deployment Guide

This project ships as a Next.js App Router application designed for Vercel. Follow the steps below to provision storage, configure secrets, and ship to production.

## 1. Prerequisites

- Node.js 18+
- Vercel CLI (`npm i -g vercel`)
- GitHub Personal Access Token with `repo` scope stored in `GITHUB_TOKEN`
- GitHub OAuth app credentials for NextAuth (Client ID/Secret)

## 2. Bootstrap the project locally

```bash
npm install
vercel login
vercel link
vercel env pull .env.local
```

Populate `.env.local` with the keys below before running `npm run dev`.

| Variable | Description |
|----------|-------------|
| `NEXTAUTH_SECRET` | Random 32+ character string |
| `NEXTAUTH_URL` | e.g. `http://localhost:3000` in dev |
| `GITHUB_CLIENT_ID` | OAuth app client id |
| `GITHUB_CLIENT_SECRET` | OAuth app client secret |
| `GITHUB_TOKEN` | Personal access token used for repo orchestration |
| `GITHUB_ORG` | Optional; create repos inside this org |
| `POSTGRES_URL` | Vercel Postgres connection string |
| `POSTGRES_URL_NON_POOLING` | Optional non-pooling Postgres URL |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob read/write token |

## 3. Provision storage on Vercel

```bash
vercel storage create blob bmax-pipe-uploads
vercel storage create postgres bmax-pipe-db
```

Record the outputs; Vercel automatically injects the connection strings at deploy time. For local development:

```bash
vercel env add BLOB_READ_WRITE_TOKEN production
vercel env add BLOB_READ_WRITE_TOKEN preview
vercel env add BLOB_READ_WRITE_TOKEN development

vercel env add POSTGRES_URL production
vercel env add POSTGRES_URL preview
vercel env add POSTGRES_URL development

vercel env add POSTGRES_URL_NON_POOLING production
vercel env add POSTGRES_URL_NON_POOLING preview
vercel env add POSTGRES_URL_NON_POOLING development
```

Add the remaining secrets (GitHub + NextAuth) with `vercel env add ...`.

## 4. Deployments

- **Preview:** push to any non-main branch; GitHub Actions triggers lint/build. You can still run `vercel deploy --prebuilt` locally for previews.
- **Production:** merge to `main` or run `vercel deploy --prod` locally.

Configure repository secrets for the workflow:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`

To run the app locally:

```bash
npm run dev
```

## 5. GitHub setup

1. Create an OAuth app (callback `https://<project>.vercel.app/api/auth/callback/github`).
2. Generate a PAT (`repo` scope) and store in `GITHUB_TOKEN` env var.
3. (Optional) Create or reuse an organization for generated repos and set `GITHUB_ORG`.

## 6. Manual schema validation

The application bootstraps required tables automatically when the first user signs in. To inspect tables manually:

```bash
vercel db connect bmax-pipe-db
```

Ensure network ingress for private connections if you migrate to a managed Postgres outside Vercel.
