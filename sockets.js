const moment = require("moment");

const CLIENTS = {};

const onQrCodeScanned =
  (authNamespace, socket) => async (scannedToken, user) => {
    const [uid, client] =
      Object.entries(CLIENTS).find(
        ([uid, client]) =>
          client.token === scannedToken && client.expireAt > moment().unix()
      ) || [];

    if (!client) {
      return;
    }

    clearInterval(client.intervalRef);

    authNamespace.to(uid).emit("success-login", user);
  };

const newSession = async (authNamespace, socket) => {
  const uid = socket.uid;
  const userType = socket.userType;

  if (userType !== "mobile") {
    socket.join(uid);
    const token = generateUniqueToken();
    const intervalRef = setInterval(() => {
      if (moment().unix() > CLIENTS[uid].sessionExpireAt) {
        authNamespace.to(uid).emit("session-expired");
        clearInterval(CLIENTS[uid].intervalRef);
        delete CLIENTS[uid];
        return;
      }

      const newToken = generateUniqueToken();
      CLIENTS[uid].token = newToken;
      CLIENTS[uid].expireAt = moment().add(10, "second").unix();
      authNamespace.to(uid).emit("token", newToken);
    }, 10000);

    CLIENTS[uid] = {
      token,
      expireAt: moment().add(10, "second").unix(),
      sessionExpireAt: moment().add(60, "second").unix(),
      intervalRef,
    };
    authNamespace.to(uid).emit("token", token);
  }
};

const generateUniqueToken = () => {
  return `${moment().unix()}-${Math.random().toString(36).substr(2, 9)}`;
};

function listen(io) {
  const authNamespace = io.of("/auth");
  authNamespace.use((socket, next) => {
    const uid = socket.handshake.auth.uid;
    const userType = socket.handshake.auth.userType;

    console.log("new connection", uid);

    if (!uid) {
      return next(new Error("invalid credentials"));
    }

    socket.uid = uid;
    socket.userType = userType;
    next();
  });

  authNamespace.on("connection", (socket) => {
    newSession(authNamespace, socket);

    socket.on("qr-code-scanned", onQrCodeScanned(authNamespace, socket));

    socket.on("new-session", () => newSession(authNamespace, socket));

    socket.on("disconnect", (reason) => {
      if (!CLIENTS[socket.uid]) {
        return;
      }
      clearInterval(CLIENTS[socket.uid].intervalRef);
      delete CLIENTS[socket.uid];
      console.log(`Client ${socket.uid} disconnected: ${reason}`);
    });
  });
}

module.exports = { listen };
