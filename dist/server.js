"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : {default: mod};
  };
Object.defineProperty(exports, "__esModule", {value: true});
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const webrtc_1 = __importDefault(require("./lib/socket/webrtc"));
const room_1 = __importDefault(require("./lib/socket/room"));
const users_1 = __importDefault(require("./lib/entity/users"));
const rooms_1 = __importDefault(require("./lib/entity/rooms"));
const app = express_1.default();
const server = http_1.default.createServer(app);
app.use(express_1.default.static("public"));
app.use("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});
const io = new socket_io_1.Server(server, {
  // socket.io options
});
const users = new users_1.default(new Set());
const rooms = new rooms_1.default({});
io.on("connection", function (socket) {
  console.log("user connected", socket.id);
  users.add(socket.id);
  const socketRoom = new room_1.default(io, socket, rooms);
  socketRoom.listen();
  const webrtcListener = new webrtc_1.default(io, socket, rooms);
  webrtcListener.listen();
  socket.on("disconnect", function () {
    console.log("user disconnect", socket.id);
    users.delete(socket.id);
    socketRoom.onDisconnect();
    // for (const id in _rooms) {
    //   if (_rooms[id].ownerUserId === socket.id) {
    //     delete _rooms[id];
    //   } else {
    //     _rooms[id].users = ARRAY_removeId(_rooms[id].users, socket.id);
    //     io.to(_rooms[id].ownerUserId).emit('livestream-user-leaved', socket.id);
    //   }
    // }
  });
});
server.listen(process.env.PORT || 8080, () => {
  console.log("App started at: http://localhost:8080");
});
