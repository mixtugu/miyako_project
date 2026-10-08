import { ApiError } from "./api";
import type { GalleryPage, GallerySnapshot } from "../../shared/gallery-types";

export async function readGallery(photoId: string, signal?: AbortSignal): Promise<GallerySnapshot> {
  const result: GallerySnapshot = { comments: [], positions: [] };
  let cursor: string | null = null;
  const seen = new Set<string>();
  do {
    const params = new URLSearchParams({ photoId });
    if (cursor) params.set("after", cursor);
    const response = await fetch(`/api/gallery?${params}`, {
      signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15_000)]) : AbortSignal.timeout(15_000),
      cache: "no-store",
    });
    if (!response.ok) throw new ApiError(response.status);
    const page: GalleryPage = await response.json();
    result.comments.push(...page.comments);
    result.positions.push(...page.positions);
    cursor = page.nextCursor;
    if (cursor && seen.has(cursor)) throw new Error("Invalid pagination cursor");
    if (cursor) seen.add(cursor);
  } while (cursor);
  result.comments.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || a.id.localeCompare(b.id));
  return result;
}

export function watchGallery(photoId: string, onSnapshot: (data: GallerySnapshot) => void, onError: () => void): () => void {
  const controller = new AbortController();
  let socket: WebSocket | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let delay = 1000;
  let refreshing = false;
  let pending = false;
  const refresh = async () => {
    if (controller.signal.aborted) return;
    if (refreshing) { pending = true; return; }
    refreshing = true;
    try {
      const snapshot = await readGallery(photoId, controller.signal);
      if (!controller.signal.aborted) onSnapshot(snapshot);
    } catch { if (!controller.signal.aborted) onError(); }
    finally {
      refreshing = false;
      if (pending) { pending = false; void refresh(); }
    }
  };
  const connect = () => {
    if (controller.signal.aborted) return;
    const url = new URL("/api/events", window.location.href);
    url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
    url.searchParams.set("photoId", photoId);
    socket = new WebSocket(url);
    socket.onopen = () => { delay = 1000; void refresh(); };
    socket.onmessage = event => { if (event.data !== "pong") void refresh(); };
    socket.onerror = () => socket?.close();
    socket.onclose = () => {
      if (!controller.signal.aborted) {
        retry = setTimeout(connect, delay + Math.random() * 500);
        delay = Math.min(delay * 2, 30_000);
      }
    };
  };
  connect();
  void refresh();
  // Recover from dropped notifications, disconnected networks, and sleeping tabs.
  const fallback = setInterval(() => {
    if (document.visibilityState === "visible") void refresh();
    if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
  }, 30_000);
  const visible = () => { if (document.visibilityState === "visible") void refresh(); };
  document.addEventListener("visibilitychange", visible);
  window.addEventListener("online", visible);
  return () => {
    controller.abort();
    clearInterval(fallback);
    clearTimeout(retry);
    document.removeEventListener("visibilitychange", visible);
    window.removeEventListener("online", visible);
    socket?.close();
  };
}
