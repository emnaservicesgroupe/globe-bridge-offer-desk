# Globe Bridge Offer Desk

The recruitment dashboard runs on Next.js on Vercel. Offer records stay in Cloudflare D1 and offer letters and demonstration videos stay in private R2. The production build works without credentials. Anyone can view listings and add offers without signing in. Staff sign-in at /api/auth/login grants access to existing attachments, and the owner can manage offers.

## Vercel project

Import the repository with the Next.js preset and root directory `./`. Run `npm ci` and `npm run build`. Connect the production branch to `main`.

## Server environment variables

| Variable | Value |
| --- | --- |
| OFFER_DESK_OWNER_EMAIL | The Google email allowed to add, edit and delete offers |
| OFFER_DESK_STAFF_EMAILS | Optional comma-separated Google emails allowed to view offers |
| GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET | Credentials for a Google OAuth web application |
| OFFER_DESK_SESSION_SECRET | A private random secret generated with `openssl rand -hex 32` |
| CLOUDFLARE_ACCOUNT_ID | Account containing the D1 database and R2 bucket |
| CLOUDFLARE_D1_DATABASE_ID | Existing Offer Desk D1 database ID |
| CLOUDFLARE_D1_API_TOKEN | Scoped Cloudflare token with D1 read/write permission |
| R2_BUCKET_NAME | Existing private Offer Desk bucket |
| R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY | R2 S3 credentials scoped to read/write objects in that bucket |

Register `https://YOUR-PRODUCTION-DOMAIN/api/auth/callback` as an authorized redirect URI on the Google OAuth client. For previews use a stable preview domain, a registered callback, and separate credentials and storage if previews should be isolated. Users must be permitted by the Google OAuth consent configuration and the dashboard email list.

In the R2 bucket's CORS settings allow the exact dashboard origin, methods PUT, GET and HEAD, and the Content-Type header. The browser sends large files directly to private storage using short-lived upload URLs. Add a lifecycle rule to expire the `staging/` prefix after one day to clean up interrupted uploads. Keep the bucket private.

Use the database and bucket that hold the existing offers. A new empty database needs the SQL migrations under `drizzle/` applied in numeric order. Only apply outstanding migrations to an existing database. A managed Sites database or bucket requires provider-supported access or an authorized export and migration before this deployment can use its records and media.

Redeploy after changing environment variables. Verify owner sign-in, staff read-only access, the offer count, and an existing video on the production domain.
