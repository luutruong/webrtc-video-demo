import { Server, Socket } from "socket.io";
import { SocketEventWebRTCAnswer, SocketEventWebRTCCandidate, SocketEventWebRTCOffer } from "../..";
import EntityRooms from "../entity/rooms";
import EntityUsers from "../entity/users";

class SocketVideoCall {
  private io: Server;
  private socket: Socket;
  private userManager: EntityUsers;
  private roomManager: EntityRooms;

  constructor(io: Server, socket: Socket, userManager: EntityUsers, roomManager: EntityRooms) {
    this.io = io;
    this.socket = socket;
    this.userManager = userManager;
    this.roomManager = roomManager;
  }

  public listen(): void {
    this.socket.on('video-call-to', this.onCallTo.bind(this));
    this.socket.on('video-call-accept', this.onAccept.bind(this));
    this.socket.on('video-call-deny', this.onDeny.bind(this));
    this.socket.on('video-call-end', this.onEnd.bind(this));

    this.socket.on('video-call-local-offer', this.onLocalOffer.bind(this));
    this.socket.on('video-call-local-candidate', this.onLocalCandidate.bind(this));
    this.socket.on('video-call-remote-answer', this.onRemoteAnswer.bind(this));
  }

  private onEnd(): void {
    // this.io.to(target).emit('video-call-ended');
  }

  private onAccept(target: string): void {
    this.roomManager.addUser(this.getRoomId(target), this.socket.id);
    // participant accepted ping back to room owner.
    const room = this.roomManager.get(this.getRoomId(target));
    const user = this.userManager.get(this.socket.id);
    if (room) {
      room.users.forEach(id => {
        if (id !== this.socket.id) {
          this.io.to(id).emit('video-call-user-accepted', user);
        }
      })
    }
  }

  private onDeny(target: string): void {
    const room = this.roomManager.get(this.getRoomId(target));
    if (room) {
      this.io.to(room.ownerUserId).emit('video-call-user-denied', this.userManager.get(this.socket.id));
      this.roomManager.delete(room.id);
    }
  }

  private onCallTo(target: string): void {
    const caller = this.userManager.get(this.socket.id);
    if (caller === null) {
      return;
    }

    let matchUserId = '';
    const targetLower = target.toLocaleLowerCase();
    const users = Object.values(this.userManager.getAll());
    for (let i = 0; i < users.length; i++) {
      if (users[i].name.toLocaleLowerCase() === targetLower) {
        matchUserId = users[i].id;
        break;
      }
    }

    if (!matchUserId || matchUserId === this.socket.id) {
      this.socket.emit('video-call-to-error', 'Invalid participant');
      return;
    }

    // create new room
    this.roomManager.add(this.getRoomId(this.socket.id), this.socket.id);

    // need user confirm.
    this.io.to(matchUserId).emit('video-call-to-confirm', caller);
  }

  private onLocalOffer(target: string, data: SocketEventWebRTCOffer): void {
    
  }

  private onLocalCandidate(target: string, data: SocketEventWebRTCCandidate): void {
    
  }
  private onRemoteAnswer(target: string, data: SocketEventWebRTCAnswer): void {
    
  }

  private getRoomId(socketId: string): string {
    return `room-${socketId}`;
  }
}

export default SocketVideoCall;
