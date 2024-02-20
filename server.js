const http = require("http");
const { Server } = require("socket.io");

const apiServer = require("./api.js");
const sockets = require("./sockets.js");

const httpServer = http.createServer(apiServer);
const socketServer = new Server(httpServer, {
  path: "/auth/socket.io",
  cors: {
    origin: "*",
  },
});

const PORT = 3000;
httpServer.listen(PORT);
console.log(`Listening on port ${PORT}...`);

sockets.listen(socketServer);
