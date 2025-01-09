import { expect } from "chai";
import { Server as HttpServer } from "http";
import { io as SocketIoClient } from "socket.io-client";
import setupSocket from "../socket.js";

describe("Socket.io", () => {
  let ioServer;
  let httpServer;
  let clientSocket;

  before((done) => {
    httpServer = new HttpServer();
    ioServer = setupSocket(httpServer);

    httpServer.listen(() => {
      const port = httpServer.address().port;
      clientSocket = new SocketIoClient(`http://localhost:${port}`, {
        query: { userId: "12345" },
      });
      clientSocket.on("connect", done);
    });
  });

  after(() => {
    ioServer.close();
    clientSocket.close();
    httpServer.close();
  });

  it("should connect to the server and receive userId", (done) => {
    clientSocket.on("connect", () => {
      expect(clientSocket.id).to.exist;
      done();
    });
  });

//   it("should handle sendMessage event", (done) => {
//     clientSocket.emit("sendMessage", {
//       sender: "12345",
//       recipient: "67890",
//       content: "Hello",
//     });

//     clientSocket.on("recievedMessage", (message) => {
//       expect(message).to.have.property("content", "Hello");
//       done();
//     });
//   });
});
