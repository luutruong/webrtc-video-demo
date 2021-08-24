import http from 'http';
import express, { Application, Request, Response } from 'express';
import {Server, Socket} from 'socket.io';
import SocketWebRTC from './lib/socket/webrtc';
import SocketRoom from './lib/socket/room';
import EntityUsers from './lib/entity/users';
import EntityRooms from './lib/entity/rooms';

const app: Application = express();
const server = http.createServer(app);

app.use(express.static('public'));

app.use('/', (req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/index.html');
});

const io = new Server(server, {
  // socket.io options
});

const users = new EntityUsers(new Set());
const rooms = new EntityRooms({});

io.on('connection', function (socket: Socket) {
  console.log('user connected', socket.id);
  users.add(socket.id);

  const socketRoom = new SocketRoom(io, socket, rooms);
  socketRoom.listen();

  const webrtcListener = new SocketWebRTC(io, socket, rooms);
  webrtcListener.listen();

  socket.on('disconnect', function () {
    console.log('user disconnect', socket.id);
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
  console.log('App started at: http://localhost:8080');
});
