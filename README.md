# Miyako Gallery

Live site: https://miyako-project.timmy0079.workers.dev

Migration evidence: [docs/migration-report.md](docs/migration-report.md).

React + TypeScript + Vite gallery running entirely on Cloudflare: Workers serves the API, D1 stores comments and positions, Durable Objects delivers live WebSocket notifications, and Static Assets serves the frontend and images. Supabase is used only by the optional one-time export script, never by the application.

## Structure

- `src/pages/` and `src/components/`: guest galleries, comments, and host display.
- `src/lib/live-gallery.ts`: paginated snapshots, live notifications, reconnection, and recovery polling.
- `shared/`: request validation and shared response types.
- `worker/index.ts`: same-origin API, validation, rate limits, and server-side deletion authentication.
- `worker/room.ts`: read-only WebSocket rooms, one per artwork, with hibernation support.
- `migrations/`: D1 schema; comment deletion cascades to its saved position atomically.
- `scripts/`: deployment, optional legacy export, and exact import verification.
- `tests/`: security, SQL integrity, and browser regression tests using local Cloudflare runtimes.
- `public/_headers`: static response security headers and same-origin CSP.

## Development

Use Node.js 24 or later (`.node-version` selects 24).

```sh
npm ci
cp .dev.vars.example .dev.vars
npm run db:migrate:local
npm run preview
```

If `.dev.vars` already exists, retain its password. Set `COMMENT_DELETE_PASSWORD` to a new random password of at least 16 characters. It is a Worker secret, never a `VITE_` variable. The frontend needs no `.env` or API keys. `npm run preview` builds and serves the complete application on port 8787. For React HMR, run `npm run dev:worker` and `npm run dev` in separate terminals; Vite proxies HTTP and WebSocket API requests to the Worker.

Local D1 starts empty. To use an existing private export locally, apply the schema and import its SQL once:

```sh
npx wrangler d1 execute DB --local --file migration-data/SNAPSHOT/import.sql
npm run data:verify -- migration-data/SNAPSHOT --local
```

## API and security

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/api/gallery?photoId=l1` | GET | Up to 200 comments and matching positions; follow `nextCursor` using `after` |
| `/api/events?photoId=l1` | WebSocket | Read-only change notifications for that artwork |
| `/api/comments` | POST | Create a public comment |
| `/api/comments/:id` | DELETE | Delete with the server-side password in `X-Admin-Password` |
| `/api/positions` | PUT | Save a visitor's comment placement |
| `/health` | GET / HEAD | Worker liveness |

D1 is accessible only through the server binding; there is no public database key or direct browser write path. Public visitors can continue to post and reposition comments. Deletion requires the private password. The Worker uses bound SQL parameters, validates IDs, limits comments to 2,000 characters and JSON bodies to 12 KiB, checks position ownership against its artwork, and rejects cross-origin browser requests. A foreign key cascade makes deletion atomic. API errors do not expose internal SQL or secrets.

Per-IP limits per minute: 20 comment posts, 120 position updates, 5 deletion attempts, 1,200 reads, and 60 WebSocket handshakes. Each artwork room allows up to 500 sockets. Cloudflare rate limits are approximate and location-local; visitors sharing a venue IP also share a limit. Tune these values for the installation. Inline styles remain enabled for the existing React UI; inline scripts and third-party API connections are blocked by CSP.

The server sends notifications only after a database write. Reconnection and a 30-second foreground refresh recover missed notifications. A notification failure does not turn a successfully committed write into an error that could cause a duplicate retry. WebSocket clients cannot publish events or mutate the database.

## Legacy data migration

The read-only exporter preserves original IDs, timestamps, text, numeric positions, and legacy artwork IDs. It checks exact paginated counts and requires two identical source reads. It never deletes or modifies Supabase rows. With a public key, it exports the rows visible to the original app; private/RLS-hidden data requires a read-capable administrative export credential.

```sh
# Store export-only credentials in ignored .env.export:
# SUPABASE_EXPORT_URL=https://your-project.supabase.co
# SUPABASE_EXPORT_KEY=your-read-capable-key
npm run data:export
npm run db:migrate:remote
npx wrangler d1 execute DB --remote --file migration-data/SNAPSHOT/import.sql
npm run data:verify -- migration-data/SNAPSHOT
```

Import only into an empty database. Duplicate primary keys fail rather than overwriting newer data. `data:verify` compares every imported field, row count, SHA-256 checksum, and foreign key integrity with the saved export. It also checks legacy artwork data that is no longer linked from the gallery UI. `migration-data/` contains private backup JSON, SQL, manifests, and verification reports; it is ignored by Git and is never uploaded as an asset.

After cutover, all new writes go to D1. The source project is left intact as a backup; do not continue serving the old application if visitors should write only to D1. This migration does not delete the Supabase account or project. Retire the old deployment and source credentials separately when the backup retention requirement is satisfied.

## Deployment

The configured target is Worker `miyako-project` and D1 database `miyako-gallery`. The D1 ID is in `wrangler.jsonc`; it is an identifier, not a secret. For a different account, create a separate D1 database and update the binding before applying migrations.

```sh
npx wrangler login
npm run db:migrate:remote
npm run check:deploy
npm run deploy
```

`npm run deploy` builds the frontend, checks the remote D1 schema/foreign keys and frontend secret leakage, and uploads the Worker and `COMMENT_DELETE_PASSWORD` together. It never uploads legacy Supabase credentials. Temporary secret files are private and removed after deployment. The authenticated account must permit Workers, D1, and Durable Objects. The deployed URL is printed by Wrangler. `npm run deploy:dry-run` compiles locally without publishing.

Public site links and QR codes must point to the new Workers URL or its configured custom domain. No custom domain or old hosting target is assumed by these scripts.

## Verification

```sh
npm test
npm run lint
npm run build
npx playwright install chromium
npm run test:e2e
npm run deploy:dry-run
npm audit
```

SQL tests use the actual migration and Node SQLite. Browser tests start disposable local Workers, D1, and Durable Objects, with real WebSocket connections. They cover all deep links and refreshes, comment creation and authenticated deletion, position persistence, cross-tab synchronization and reconnect recovery, and rejection of forged WebSocket writes. They do not access production data.

Back up D1 before future schema changes:

```sh
npx wrangler d1 export DB --remote --output migration-data/d1-backup.sql
```

Roll back only to releases compatible with the D1 schema and protected API. Do not restore the old browser-only password or Supabase implementation.

## References

- [Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/)
- [D1 import and export](https://developers.cloudflare.com/d1/best-practices/import-export-data/)
- [Durable Objects WebSockets](https://developers.cloudflare.com/durable-objects/best-practices/websockets/)
- [Worker rate limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/)
