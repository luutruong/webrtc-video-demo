import http from 'http';
import express, {Application, Request, Response} from 'express';
import {Server, Socket} from 'socket.io';
import SocketWebRTC from './lib/socket/webrtc';
import SocketRoom from './lib/socket/room';
import EntityUsers from './lib/entity/users';
import EntityRooms from './lib/entity/rooms';
import SocketVideoCall from './lib/socket/video-call';

const app: Application = express();
const server = http.createServer(app);

app.use(express.static('public'));

app.get('/video-call', (_req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/video-call.html');
});

app.use('/', (_req: Request, res: Response) => {
  res.sendFile(__dirname + '/public/index.html');
});

const io = new Server(server, {
  // socket.io options
});

const userManager = new EntityUsers({});
const roomManager = new EntityRooms({});

io.on('connection', function (socket: Socket) {
  console.log('user connected', socket.id);
  userManager.add(socket.id);

  socket.on('set-name', function (name: string) {
    if (userManager.updateName(socket.id, name)) {
      socket.emit('set-name-ok');
    } else {
      socket.emit('set-name-error', `Name '${name}' has been taken.`);
    }
  });

  const socketRoom = new SocketRoom(io, socket, roomManager);
  socketRoom.listen();

  const webrtcListener = new SocketWebRTC(io, socket, roomManager);
  webrtcListener.listen();

  const videoCall = new SocketVideoCall(io, socket, userManager, roomManager);
  videoCall.listen();

  socket.on('disconnect', function () {
    console.log('user disconnect', socket.id);
    userManager.delete(socket.id);

    socketRoom.onDisconnect();
  });
});

server.listen(process.env.PORT || 8080, () => {
  console.log('App started at: http://localhost:8080');
});
