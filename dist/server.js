"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const webrtc_1 = __importDefault(require("./lib/socket/webrtc"));
const room_1 = __importDefault(require("./lib/socket/room"));
const users_1 = __importDefault(require("./lib/entity/users"));
const rooms_1 = __importDefault(require("./lib/entity/rooms"));
const video_call_1 = __importDefault(require("./lib/socket/video-call"));
const app = express_1.default();
const server = http_1.default.createServer(app);
app.use(express_1.default.static("public"));
app.use("/video-call", (_req, res) => {
    res.sendFile(__dirname + "/public/video-call.html");
});
app.use("/", (_req, res) => {
    res.sendFile(__dirname + "/public/index.html");
});
const io = new socket_io_1.Server(server, {
// socket.io options
});
const userManager = new users_1.default({});
const roomManager = new rooms_1.default({});
io.on("connection", function (socket) {
    console.log("user connected", socket.id);
    userManager.add(socket.id);
    socket.on("set-name", function (name) {
        if (userManager.updateName(socket.id, name)) {
            socket.emit("set-name-ok");
        }
        else {
            socket.emit("set-name-error", `Name '${name}' has been taken.`);
        }
    });
    const socketRoom = new room_1.default(io, socket, roomManager);
    socketRoom.listen();
    const webrtcListener = new webrtc_1.default(io, socket, roomManager);
    webrtcListener.listen();
    const videoCall = new video_call_1.default(io, socket, userManager, roomManager);
    videoCall.listen();
    socket.on("disconnect", function () {
        console.log("user disconnect", socket.id);
        userManager.delete(socket.id);
        socketRoom.onDisconnect();
    });
});
server.listen(process.env.PORT || 8080, () => {
    console.log("App started at: http://localhost:8080");
});
