"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketVideoCall {
    constructor(io, socket, userManager, roomManager) {
        this.io = io;
        this.socket = socket;
        this.userManager = userManager;
        this.roomManager = roomManager;
    }
    listen() {
        this.socket.on("video-call-to", this.onCallTo.bind(this));
        this.socket.on("video-call-accept", this.onAccept.bind(this));
        this.socket.on("video-call-deny", this.onDeny.bind(this));
        this.socket.on("video-call-end", this.onEnd.bind(this));
        this.socket.on("video-call-local-offer", this.onLocalOffer.bind(this));
        this.socket.on("video-call-local-candidate", this.onLocalCandidate.bind(this));
        this.socket.on("video-call-remote-answer", this.onRemoteAnswer.bind(this));
    }
    onEnd(roomId) {
        const room = this.roomManager.get(roomId);
        if (!room) {
            return;
        }
        room.users.filter((id) => id !== this.socket.id).forEach((id) => this.io.to(id).emit("video-call-ended"));
        this.roomManager.delete(roomId);
    }
    onAccept(roomId) {
        this.roomManager.addUser(roomId, this.socket.id);
        // participant accepted ping back to room owner.
        const room = this.roomManager.get(roomId);
        const user = this.userManager.get(this.socket.id);
        if (room) {
            room.users
                .filter((id) => id !== this.socket.id)
                .forEach((id) => this.io.to(id).emit("video-call-user-accepted", user, room.id));
        }
    }
    onDeny(roomId) {
        const room = this.roomManager.get(roomId);
        if (!room) {
            return;
        }
        room.users.filter((id) => id !== this.socket.id).forEach((id) => this.io.to(id).emit("video-call-user-denied"));
        this.roomManager.removeUser(roomId, this.socket.id);
    }
    onCallTo(target) {
        const caller = this.userManager.get(this.socket.id);
        if (caller === null) {
            return;
        }
        let matchUserId = "";
        const targetLower = target.toLocaleLowerCase();
        const users = Object.values(this.userManager.getAll());
        for (let i = 0; i < users.length; i++) {
            if (users[i].name.toLocaleLowerCase() === targetLower) {
                matchUserId = users[i].id;
                break;
            }
        }
        if (!matchUserId || matchUserId === this.socket.id) {
            this.socket.emit("video-call-to-error", "Invalid participant");
            return;
        }
        // create new room
        this.roomManager.add(this.getRoomId(this.socket.id), this.socket.id);
        // need user confirm.
        this.io.to(matchUserId).emit("video-call-to-confirm", caller, this.getRoomId(this.socket.id));
    }
    // WebRTC events
    onLocalOffer(roomId, data) {
        const room = this.roomManager.get(roomId);
        if (!room) {
            return;
        }
        room.users
            .filter((id) => id !== this.socket.id)
            .forEach((id) => this.io.to(id).emit("video-call-local-offer", data, this.socket.id));
    }
    onLocalCandidate(roomId, data) {
        const room = this.roomManager.get(roomId);
        if (!room) {
            return;
        }
        room.users
            .filter((id) => id !== this.socket.id)
            .forEach((id) => this.io.to(id).emit("video-call-local-candidate", data, this.socket.id));
    }
    onRemoteAnswer(roomId, data) {
        const room = this.roomManager.get(roomId);
        if (!room) {
            return;
        }
        room.users
            .filter((id) => id !== this.socket.id)
            .forEach((id) => this.io.to(id).emit("video-call-remote-answer", data, this.socket.id));
    }
    getRoomId(socketId) {
        return `room-${socketId}`;
    }
}
exports.default = SocketVideoCall;
