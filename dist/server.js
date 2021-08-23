"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const socket_io_1 = require("socket.io");
const index_1 = require("./lib/utils/index");
const app = express_1.default();
const server = http_1.default.createServer(app);
app.use(express_1.default.static('public'));
app.use('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});
const io = new socket_io_1.Server(server, {
// socket.io options
});
var _users = [];
var _rooms = {};
io.on('connection', function (socket) {
    console.log('user connected', socket.id);
    _users.push(socket.id);
    socket.on('livestream-start', function (data) {
        if (_rooms[data.id]) {
            socket.emit('livestream-start-error', {
                error: 'Room ID has been taken.'
            });
            return;
        }
        _rooms[data.id] = {
            users: [socket.id],
            ownerUserId: socket.id
        };
    });
    socket.on('livestream-stop', function (data) {
        if (!_rooms[data.id] || socket.id !== _rooms[data.id].ownerUserId) {
            return;
        }
        delete _rooms[data.id];
    });
    socket.on('livestream-join', function (data) {
        if (!_rooms[data.id]) {
            return;
        }
        _rooms[data.id].users.push(socket.id);
        // tell owner somebody joined their streams
        io.to(_rooms[data.id].ownerUserId).emit('livestream-user-joined', { userId: socket.id });
    });
    socket.on('livestream-leave', function (data) {
        if (!_rooms[data.id]) {
            return;
        }
        _rooms[data.id].users = index_1.ARRAY_removeId(_rooms[data.id].users, socket.id);
        io.to(_rooms[data.id].ownerUserId).emit('livestream-user-leaved', socket.id);
    });
    socket.on('webrtc-host-offer', function (roomId, data) {
        if (!_rooms[roomId]) {
            return;
        }
        socket.emit('webrtc-host-offer', data);
    });
    socket.on('webrtc-host-candidate', function (roomId, data) {
        if (!_rooms[roomId]) {
            return;
        }
        socket.emit('webrtc-host-candidate', data);
    });
    socket.on('webrtc-host-remote-answer', function (roomId, data) {
        if (!_rooms[roomId]) {
            return;
        }
        socket.emit('webrtc-host-remote-answer', data);
    });
    socket.on('webrtc-watcher-offer', function (roomId, userId, data) {
        if (!_rooms[roomId] || _rooms[roomId].users.indexOf(userId) === -1) {
            return;
        }
        io.to(userId).emit('webrtc-watcher-offer', data);
    });
    socket.on('webrtc-watcher-candidate', function (roomId, userId, data) {
        if (!_rooms[roomId] || _rooms[roomId].users.indexOf(userId) === -1) {
            return;
        }
        io.to(userId).emit('webrtc-watcher-candidate', data);
    });
    socket.on('webrtc-watcher-remote-answer', function (roomId, data) {
        if (!_rooms[roomId]) {
            return;
        }
        io.to(_rooms[roomId].ownerUserId).emit('webrtc-watcher-remote-answer', socket.id, data);
    });
    socket.on('disconnect', function () {
        console.log('user disconnected', socket.id);
        _users = index_1.ARRAY_removeId(_users, socket.id);
        for (const id in _rooms) {
            if (_rooms[id].ownerUserId === socket.id) {
                delete _rooms[id];
            }
            else {
                _rooms[id].users = index_1.ARRAY_removeId(_rooms[id].users, socket.id);
                io.to(_rooms[id].ownerUserId).emit('livestream-user-leaved', socket.id);
            }
        }
        console.log('user disconnect', socket.id);
    });
});
server.listen(8080, () => {
    console.log('App started at: http://localhost:8080');
});
