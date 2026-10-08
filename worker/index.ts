import { isCommentId, isCoordinate, isPhotoId, MAX_BODY_BYTES, MAX_COMMENT_LENGTH } from "../shared/validation.ts";
import type { CommentRow, PositionRow, GalleryPage } from "../shared/gallery-types.ts";
export { GalleryRoom } from "./room.ts";

export type Env = {
  ASSETS: { fetch(request: Request): Promise<Response> };
  DB: D1Database;
  GALLERY_ROOMS: DurableObjectNamespace;
  COMMENT_DELETE_PASSWORD?: string;
};

class HttpError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) { super(code); this.status = status; this.code = code; }
}

function json(value: unknown, status = 200): Response {
  return Response.json(value, { status });
}

function secureResponse(response: Response): Response {
  const result = new Response(response.body, response);
  result.headers.set("Cache-Control", "no-store");
  result.headers.set("X-Content-Type-Options", "nosniff");
  result.headers.set("X-Frame-Options", "DENY");
  result.headers.set("Referrer-Policy", "no-referrer");
  result.headers.set("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");
  return result;
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") {
    throw new HttpError(415, "json_required");
  }
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES) throw new HttpError(413, "body_too_large");
  const reader = request.body?.getReader();
  if (!reader) throw new HttpError(400, "invalid_json");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new HttpError(413, "body_too_large");
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    const body: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true, ignoreBOM: false }).decode(bytes));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error();
    return body as Record<string, unknown>;
  } catch { throw new HttpError(400, "invalid_json"); }
}

async function verifyPassword(request: Request, env: Env): Promise<void> {
  const expected = env.COMMENT_DELETE_PASSWORD;
  if (!expected || expected.length < 16) throw new HttpError(503, "service_unavailable");
  const supplied = request.headers.get("X-Admin-Password");
  if (!supplied || supplied.length > 1024) throw new HttpError(401, "unauthorized");
  const encoder = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(expected)),
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
  ]);
  const left = new Uint8Array(a), right = new Uint8Array(b);
  let difference = 0;
  for (let i = 0; i < left.length; i++) difference |= left[i] ^ right[i];
  if (difference !== 0) throw new HttpError(401, "unauthorized");
}

async function notify(env: Env, photoId: string): Promise<void> {
  const room = env.GALLERY_ROOMS.get(env.GALLERY_ROOMS.idFromName(photoId));
  await room.fetch("https://room/publish", { method: "POST" });
}

async function api(request: Request, env: Env, pathname: string, ctx: Pick<ExecutionContext, "waitUntil">): Promise<Response> {
  const origin = request.headers.get("Origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("Sec-Fetch-Site") === "cross-site") {
    throw new HttpError(403, "forbidden_origin");
  }
  if ((pathname === "/api/gallery" || pathname === "/api/events") && request.method === "GET") {
    const params = new URL(request.url).searchParams;
    const photoId = params.get("photoId");
    if (!isPhotoId(photoId)) throw new HttpError(400, "invalid_photo_id");
    if (pathname === "/api/events") {
      if (request.headers.get("Upgrade")?.toLowerCase() !== "websocket") throw new HttpError(426, "websocket_required");
      return env.GALLERY_ROOMS.get(env.GALLERY_ROOMS.idFromName(photoId)).fetch(new Request("https://room/connect", request));
    }
    const cursor = params.get("after") ?? "";
    if (cursor && !isCommentId(cursor)) throw new HttpError(400, "invalid_cursor");
    type Joined = CommentRow & { top_pct: number | null; left_pct: number | null; updated_at: string | null };
    const { results } = await env.DB.prepare(`SELECT c.id, c.photo_id, c.text, c.created_at,
      p.top_pct, p.left_pct, p.updated_at FROM comments c
      LEFT JOIN comment_positions p ON p.comment_id = c.id AND p.photo_id = c.photo_id
      WHERE c.photo_id = ? AND c.id > ? ORDER BY c.id LIMIT 201`).bind(photoId, cursor).all<Joined>();
    const rows = results.slice(0, 200);
    const positions: PositionRow[] = rows.flatMap(row => row.top_pct === null || row.left_pct === null ? [] : [{
      comment_id: row.id, photo_id: row.photo_id, top_pct: row.top_pct, left_pct: row.left_pct, updated_at: row.updated_at,
    }]);
    const page: GalleryPage = {
      comments: rows.map(({ id, photo_id, text, created_at }) => ({ id, photo_id, text, created_at })),
      positions,
      nextCursor: results.length > 200 ? rows[rows.length - 1].id : null,
    };
    return json(page);
  }
  if (pathname === "/api/comments" && request.method === "POST") {
    const body = await readBody(request);
    if (!isPhotoId(body.photoId) || typeof body.text !== "string") throw new HttpError(400, "invalid_comment");
    const text = body.text.trim();
    if (!text || text.length > MAX_COMMENT_LENGTH || text.includes("\0")) throw new HttpError(400, "invalid_comment");
    const row: CommentRow = { id: crypto.randomUUID(), photo_id: body.photoId, text, created_at: new Date().toISOString() };
    await env.DB.prepare("INSERT INTO comments (id, photo_id, text, created_at) VALUES (?, ?, ?, ?)")
      .bind(row.id, row.photo_id, row.text, row.created_at).run();
    // A transient notification failure must not make clients retry a committed write.
    ctx.waitUntil(notify(env, row.photo_id).catch(() => {}));
    return json(row, 201);
  }
  const deletion = /^\/api\/comments\/([^/]+)$/.exec(pathname);
  if (deletion && request.method === "DELETE") {
    await verifyPassword(request, env);
    if (!isCommentId(deletion[1])) throw new HttpError(400, "invalid_comment_id");
    // The foreign key cascade removes positions in the same SQL transaction.
    const deleted = await env.DB.prepare("DELETE FROM comments WHERE id = ? RETURNING photo_id")
      .bind(deletion[1]).first<{ photo_id: string }>();
    if (!deleted) throw new HttpError(404, "comment_not_found");
    ctx.waitUntil(notify(env, deleted.photo_id).catch(() => {}));
    return new Response(null, { status: 204 });
  }
  if (pathname === "/api/positions" && request.method === "PUT") {
    const body = await readBody(request);
    if (!isCommentId(body.comment_id) || !isPhotoId(body.photo_id) || !isCoordinate(body.top_pct) || !isCoordinate(body.left_pct)) {
      throw new HttpError(400, "invalid_position");
    }
    const result = await env.DB.prepare(`INSERT INTO comment_positions (comment_id, photo_id, top_pct, left_pct, updated_at)
      SELECT id, photo_id, ?, ?, ? FROM comments WHERE id = ? AND photo_id = ?
      ON CONFLICT (comment_id) DO UPDATE SET top_pct = excluded.top_pct, left_pct = excluded.left_pct, updated_at = excluded.updated_at`)
      .bind(body.top_pct, body.left_pct, new Date().toISOString(), body.comment_id, body.photo_id).run();
    if (!result.meta.changes) throw new HttpError(404, "comment_not_found");
    ctx.waitUntil(notify(env, body.photo_id).catch(() => {}));
    return new Response(null, { status: 204 });
  }
  const known = ["/api/comments", "/api/positions", "/api/gallery", "/api/events"].includes(pathname) || deletion;
  throw new HttpError(known ? 405 : 404, known ? "method_not_allowed" : "not_found");
}

export default {
  async fetch(request: Request, env: Env, ctx: Pick<ExecutionContext, "waitUntil">): Promise<Response> {
    const pathname = new URL(request.url).pathname;
    try {
      if (pathname === "/health") {
        return secureResponse(["GET", "HEAD"].includes(request.method)
          ? new Response(request.method === "HEAD" ? null : "OK")
          : json({ error: "method_not_allowed" }, 405));
      }
      if (pathname === "/api" || pathname.startsWith("/api/")) {
        const response = await api(request, env, pathname, ctx);
        return response.status === 101 ? response : secureResponse(response);
      }
      return await env.ASSETS.fetch(request);
    } catch (error) {
      return secureResponse(error instanceof HttpError
        ? json({ error: error.code }, error.status)
        : json({ error: "service_unavailable" }, 503));
    }
  },
};
