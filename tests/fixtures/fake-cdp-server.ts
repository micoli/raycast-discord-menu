import http from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

type Evaluate = (expression: string) => unknown;

// A discord that only speaks the part of the devtools protocol the extension uses
export class FakeCdpServer {
  readonly evaluated: string[] = [];
  readonly bindings: string[] = [];
  connections = 0;

  private readonly server = http.createServer((request, response) => {
    if (request.url?.startsWith("/json/list")) {
      const url = `ws://127.0.0.1:${this.port}/devtools/page/1`;
      response.end(
        JSON.stringify([
          { type: "worker", url: "", webSocketDebuggerUrl: `${url}-worker` },
          { type: "page", url: "https://discord.com/channels/@me", webSocketDebuggerUrl: url },
        ]),
      );
      return;
    }
    response.statusCode = 404;
    response.end();
  });
  private readonly sockets = new Set<WebSocket>();

  constructor(
    readonly port: number,
    private readonly evaluate: Evaluate = () => undefined,
  ) {
    const webSocketServer = new WebSocketServer({ server: this.server });
    webSocketServer.on("connection", (socket) => {
      this.connections++;
      this.sockets.add(socket);
      socket.on("close", () => this.sockets.delete(socket));
      socket.on("message", (data) => this.answer(socket, JSON.parse(data.toString())));
    });
  }

  start() {
    return new Promise<void>((resolve) => this.server.listen(this.port, "127.0.0.1", resolve));
  }

  stop() {
    this.sockets.forEach((socket) => socket.terminate());
    return new Promise<void>((resolve) => {
      this.server.close(() => resolve());
      this.server.closeAllConnections();
    });
  }

  // What the injected script does when it calls window.notifyRaycast
  callBinding(name: string, payload = "") {
    const message = JSON.stringify({
      method: "Runtime.bindingCalled",
      params: { name, payload, executionContextId: 1 },
    });
    this.sockets.forEach((socket) => socket.send(message));
  }

  private answer(socket: WebSocket, request: { id: number; method: string; params: Record<string, unknown> }) {
    if (request.method === "Runtime.addBinding") {
      this.bindings.push(String(request.params.name));
      socket.send(JSON.stringify({ id: request.id, result: {} }));
      return;
    }
    if (request.method !== "Runtime.evaluate") {
      socket.send(JSON.stringify({ id: request.id, error: { message: `Unknown method ${request.method}` } }));
      return;
    }
    const expression = String(request.params.expression);
    this.evaluated.push(expression);
    try {
      const value = this.evaluate(expression);
      socket.send(JSON.stringify({ id: request.id, result: { result: { type: "object", value } } }));
    } catch (error) {
      const description = error instanceof Error ? `${error.name}: ${error.message}` : String(error);
      socket.send(
        JSON.stringify({
          id: request.id,
          result: { result: {}, exceptionDetails: { text: "Uncaught", exception: { description } } },
        }),
      );
    }
  }
}
