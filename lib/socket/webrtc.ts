import {Server, Socket} from "socket.io";
import {SocketEventWebRTCAnswer, SocketEventWebRTCCandidate, SocketEventWebRTCOffer} from "../..";
import EntityRooms from "../entity/rooms";

class SocketWebRTC {
  private io: Server;
  private socket: Socket;
  private rooms: EntityRooms;

  constructor(io: Server, socket: Socket, rooms: EntityRooms) {
    this.io = io;
    this.socket = socket;
    this.rooms = rooms;
  }

  public listen(): void {
    this.socket.on("webrtc-host-offer", this.onHostOffer.bind(this));
    this.socket.on("webrtc-host-candidate", this.onHostCandidate.bind(this));
    this.socket.on("webrtc-host-remote-answer", this.onHostRemoteAnswer.bind(this));

    this.socket.on("webrtc-watcher-offer", this.onWatcherOffer.bind(this));
    this.socket.on("webrtc-watcher-candidate", this.onWatcherCandidate.bind(this));
    this.socket.on("webrtc-watcher-remote-answer", this.onWatcherRemoteAnswer.bind(this));
  }

  private onHostOffer(roomId: string, data: SocketEventWebRTCOffer): void {
    if (!this.rooms.has(roomId)) {
      return;
    }

    this.socket.emit("webrtc-host-offer", data);
  }

  private onHostCandidate(roomId: string, data: SocketEventWebRTCCandidate): void {
    if (!this.rooms.has(roomId)) {
      return;
    }

    this.socket.emit("webrtc-host-candidate", data);
  }

  private onHostRemoteAnswer(roomId: string, data: SocketEventWebRTCAnswer): void {
    if (!this.rooms.has(roomId)) {
      return;
    }

    this.socket.emit("webrtc-host-remote-answer", data);
  }

  private onWatcherOffer(roomId: string, userId: string, data: SocketEventWebRTCOffer): void {
    if (!this.rooms.hasUserJoined(roomId, userId)) {
      return;
    }

    this.io.to(userId).emit("webrtc-watcher-offer", data);
  }

  private onWatcherCandidate(roomId: string, userId: string, data: SocketEventWebRTCCandidate): void {
    if (!this.rooms.hasUserJoined(roomId, userId)) {
      return;
    }

    this.io.to(userId).emit("webrtc-watcher-candidate", data);
  }

  private onWatcherRemoteAnswer(roomId: string, data: SocketEventWebRTCAnswer): void {
    const room = this.rooms.get(roomId);
    if (room === null) {
      return;
    }

    this.io.to(room.ownerUserId).emit("webrtc-watcher-remote-answer", this.socket.id, data);
  }
}

export default SocketWebRTC;
