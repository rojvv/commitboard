export const webSocketManager = new class {
  #sockets = new Set<WebSocket>();

  add(socket: WebSocket) {
    console.log("Adding socket with readyState", socket.readyState);
    this.#sockets.add(socket);
  }

  remove(socket: WebSocket) {
    this.#sockets.delete(socket);
  }

  // deno-lint-ignore no-explicit-any
  broadcast(data: any) {
    console.log("Broadcasting message to", this.#sockets.size, "socket(s)");
    for (const socket of this.#sockets) {
      socket.send(data);
    }
  }
}();
