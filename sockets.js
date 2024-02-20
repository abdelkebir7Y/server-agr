const moment = require("moment");

let token = { value: "hello world", expire: moment(1900) };

const onQrCodeScanned = (authNamespace, socket) => async (scannedToken) => {
  if (scannedToken !== token.value) {
    socket.emit("qr-code-error", {
      code: 400,
      message: "Token invalid",
    });
    return;
  }

  console.log("QR code scanned", scannedToken);
};

const newConnection = async (socket) => {
  socket.emit("token", token.value);
};

function listen(io) {
  const authNamespace = io.of("/auth");
  authNamespace.use((socket, next) => {
    const uuid = socket.handshake.auth.uuid;

    if (!uuid) {
      return next(new Error("invalid credentials"));
    }

    socket.uuid = uuid;
    next();
  });

  authNamespace.on("connection", (socket) => {
    newConnection(authNamespace, socket);

    socket.on("qr-code-scanned", onQrCodeScanned(socket));

    socket.on("disconnect", (reason) => {
      console.log(`Client ${socket.uuid} disconnected: ${reason}`);
    });
  });
}

module.exports = { listen };
