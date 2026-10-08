# Cloudflare migration verification

Completed on October 6, 2026 (Asia/Tokyo).

- Live URL: https://miyako-project.timmy0079.workers.dev
- Worker: `miyako-project`
- Version: `e29545e8-c23b-4f3f-a71c-0de529aa345c`
- D1: `miyako-gallery`, deployed in APAC
- Realtime: `GalleryRoom` Durable Objects and same-origin WebSockets

## Data

Imported 51 comments and 40 saved positions, including the legacy `p1` artwork records. Original IDs, text, timestamps, coordinates, and nullable update timestamps were preserved. The source was read using the existing application's public credential; the scope is the rows visible to that application, not a privileged backup of unrelated or RLS-hidden tables.

Repeated exports before and after deployment had the same SHA-256:

`b8c248147f5131aa13083f7aa50646bebe37dfd4f1b509083cbcc10c2c4d5475`

The D1 contents were compared field by field with the export. All rows matched, and `PRAGMA foreign_key_check` returned no errors. Private source snapshots, import SQL, manifests, and final verification reports are under ignored `migration-data/`. These are not deployed or committed.

## Checks

- 9 unit/SQL tests passed: authorization, input limits, SQL injection handling, pagination, rate limits, foreign keys, and atomic deletion.
- 5 browser tests passed using real local Workers, D1, and Durable Objects: deep links, create/delete, dragging and persistence, live synchronization/reconnect, and rejected WebSocket writes.
- Build, lint, deployment preflight, and Wrangler dry run passed.
- `npm audit`: zero reported vulnerabilities.
- Production browser smoke: six deep links, real WebSocket create/delete notifications, position write, unauthenticated deletion denied, and no browser errors.
- Production browser made zero Supabase requests. Temporary production verification data was deleted, then the full D1 dataset was compared again with the source snapshot.

## Operations

`COMMENT_DELETE_PASSWORD` is the only Worker secret. Its local value is in ignored `.dev.vars` (owner-readable only). Do not publish it or place it in a frontend environment variable. Legacy source credentials are isolated in ignored `.env.export` solely for backup/export purposes. No Supabase SDK, URL, key, or runtime connection remains in the app.

The original Supabase project is retained as a source backup and was not modified. New writes at the Workers URL go only to D1. Old hosting, custom domains, and QR codes were not supplied; update any existing visitor entry points to the new URL to finish distributing the cutover. Supabase project deletion and closure are separate administrative actions.
