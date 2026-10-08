// Only the Worker binding can publish. Public WebSockets are read-only.
// 1005/1006/1015 are reserved and must never be passed to close().
const RESERVED_CLOSE_CODES = new Set([1005, 1006, 1015]);

function safeClose(socket: WebSocket, code: number, reason: string): void {
  try { socket.close(RESERVED_CLOSE_CODES.has(code) ? 1000 : code, reason); }
  catch { /* Already closed or closing. */ }
}

export class GalleryRoom {
  private state: DurableObjectState;
  constructor(state: DurableObjectState) {
    this.state = state;
    state.setWebSocketAutoResponse(new WebSocketRequestResponsePair("ping", "pong"));
  }

  async fetch(request: Request): Promise<Response> {
    const path = new URL(request.url).pathname;
    if (path === "/publish" && request.method === "POST") {
      for (const socket of this.state.getWebSockets()) {
        try { socket.send('{"type":"changed"}'); }
        catch { safeClose(socket, 1011, "Reconnect"); }
      }
      return new Response(null, { status: 204 });
    }
    if (path !== "/connect" || request.method !== "GET" || request.headers.get("Upgrade")?.toLowerCase() !== "websocket") {
      return new Response(null, { status: 404 });
    }
    if (this.state.getWebSockets().length >= 500) return new Response(null, { status: 503 });
    const pair = new WebSocketPair();
    this.state.acceptWebSocket(pair[1]);
    return new Response(null, { status: 101, webSocket: pair[0] });
  }

  webSocketMessage(socket: WebSocket): void { safeClose(socket, 1008, "Read-only connection"); }
  webSocketClose(socket: WebSocket, code: number): void { safeClose(socket, code, "Closed"); }
  webSocketError(socket: WebSocket): void { safeClose(socket, 1011, "Reconnect"); }
}
