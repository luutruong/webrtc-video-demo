import http from 'http';
import express, { Application, Request, Response } from 'express';
import {Server, Socket} from 'socket.io';
import { Room, SocketEventWebRTCAnswer, SocketEventWebRTCCandidate, SocketEventWebRTCOffer } from '.';
import {ARRAY_removeId} from './lib/utils/index';

const app: Application = express();
const server = http.createServer(app);

app.use(express.static('public'));

app.use('/', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/index.html');
});

const io = new Server(server, {
  // socket.io options
});

var _users: string[] = [];
var _rooms: {[key: string]: Room} = {};

io.on('connection', function (socket: Socket) {
  console.log('user connected', socket.id);
  _users.push(socket.id);

  socket.on('livestream-start', function (data: {id: string}) {
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
  socket.on('livestream-stop', function (data: {id: string}) {
    if (!_rooms[data.id] || socket.id !== _rooms[data.id].ownerUserId) {
      return;
    }

    delete _rooms[data.id];
  });

  socket.on('livestream-join', function (data: {id: string}) {
    if (!_rooms[data.id]) {
      return;
    }

    _rooms[data.id].users.push(socket.id);

    // tell owner somebody joined their streams
    io.to(_rooms[data.id].ownerUserId).emit('livestream-user-joined', {userId: socket.id});
  });

  socket.on('livestream-leave', function (data: {id: string}) {
    if (!_rooms[data.id]) {
      return;
    }

    _rooms[data.id].users = ARRAY_removeId(_rooms[data.id].users, socket.id);
    io.to(_rooms[data.id].ownerUserId).emit('livestream-user-leaved', socket.id);
  });

  socket.on('webrtc-host-offer', function (roomId: string, data: SocketEventWebRTCOffer) {
    if (!_rooms[roomId]) {
      return;
    }

    socket.emit('webrtc-host-offer', data);
  });

  socket.on('webrtc-host-candidate', function (roomId: string, data: SocketEventWebRTCCandidate) {
    if (!_rooms[roomId]) {
      return;
    }

    socket.emit('webrtc-host-candidate', data);
  });

  socket.on('webrtc-host-remote-answer', function (roomId: string, data: SocketEventWebRTCAnswer) {
    if (!_rooms[roomId]) {
      return;
    }

    socket.emit('webrtc-host-remote-answer', data);
  });

  socket.on('webrtc-watcher-offer', function (roomId: string, userId: string, data: SocketEventWebRTCOffer) {
    if (!_rooms[roomId] || _rooms[roomId].users.indexOf(userId) === -1) {
      return;
    }

    io.to(userId).emit('webrtc-watcher-offer', data);
  });

  socket.on('webrtc-watcher-candidate', function (roomId: string, userId: string, data: SocketEventWebRTCCandidate) {
    if (!_rooms[roomId] || _rooms[roomId].users.indexOf(userId) === -1) {
      return;
    }

    io.to(userId).emit('webrtc-watcher-candidate', data);
  });

  socket.on('webrtc-watcher-remote-answer', function (roomId: string, data: SocketEventWebRTCAnswer) {
    if (!_rooms[roomId]) {
      return;
    }

    io.to(_rooms[roomId].ownerUserId).emit('webrtc-watcher-remote-answer', socket.id, data);
  });

  socket.on('disconnect', function () {
    console.log('user disconnect', socket.id);
    _users = ARRAY_removeId(_users, socket.id);
    for (const id in _rooms) {
      if (_rooms[id].ownerUserId === socket.id) {
        delete _rooms[id];
      } else {
        _rooms[id].users = ARRAY_removeId(_rooms[id].users, socket.id);
        io.to(_rooms[id].ownerUserId).emit('livestream-user-leaved', socket.id);
      }
    }
  });
});

server.listen(process.env.PORT || 8080, () => {
  console.log('App started at: http://localhost:8080');
});
