"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketWebRTC {
    constructor(io, socket, rooms) {
        this.io = io;
        this.socket = socket;
        this.rooms = rooms;
    }
    listen() {
        this.socket.on('webrtc-host-offer', this.onHostOffer.bind(this));
        this.socket.on('webrtc-host-candidate', this.onHostCandidate.bind(this));
        this.socket.on('webrtc-host-remote-answer', this.onHostRemoteAnswer.bind(this));
        this.socket.on('webrtc-watcher-offer', this.onWatcherOffer.bind(this));
        this.socket.on('webrtc-watcher-candidate', this.onWatcherCandidate.bind(this));
        this.socket.on('webrtc-watcher-remote-answer', this.onWatcherRemoteAnswer.bind(this));
    }
    onHostOffer(roomId, data) {
        if (!this.rooms.has(roomId)) {
            return;
        }
        this.socket.emit('webrtc-host-offer', data);
    }
    onHostCandidate(roomId, data) {
        if (!this.rooms.has(roomId)) {
            return;
        }
        this.socket.emit('webrtc-host-candidate', data);
    }
    onHostRemoteAnswer(roomId, data) {
        if (!this.rooms.has(roomId)) {
            return;
        }
        this.socket.emit('webrtc-host-remote-answer', data);
    }
    onWatcherOffer(roomId, userId, data) {
        if (!this.rooms.hasUserJoined(roomId, userId)) {
            return;
        }
        this.io.to(userId).emit('webrtc-watcher-offer', data);
    }
    onWatcherCandidate(roomId, userId, data) {
        if (!this.rooms.hasUserJoined(roomId, userId)) {
            return;
        }
        this.io.to(userId).emit('webrtc-watcher-candidate', data);
    }
    onWatcherRemoteAnswer(roomId, data) {
        const room = this.rooms.get(roomId);
        if (room === null) {
            return;
        }
        this.io.to(room.ownerUserId).emit('webrtc-watcher-remote-answer', this.socket.id, data);
    }
}
exports.default = SocketWebRTC;
