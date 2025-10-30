import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";

interface BroadcastOptions {
  originId?: string | null;
}

interface BroadcastPayload<T = unknown> {
  event: string;
  data?: T;
  originId?: string | null;
  timestamp: string;
}

let wss: WebSocketServer | null = null;

export function attachRealtime(server: HttpServer): WebSocketServer {
  if (wss) {
    return wss;
  }

  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (socket: WebSocket) => {
    socket.on("message", (message) => {
      if (message.toString() === "ping") {
        socket.send("pong");
      }
    });
  });

  return wss;
}

export function broadcast<T>(event: string, data: T, options: BroadcastOptions = {}): void {
  if (!wss) {
    return;
  }

  const payload: BroadcastPayload<T> = {
    event,
    data,
    originId: options.originId ?? null,
    timestamp: new Date().toISOString(),
  };

  const serialized = JSON.stringify(payload);

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(serialized);
    }
  });
}
