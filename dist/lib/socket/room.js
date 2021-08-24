"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SocketRoom {
    constructor(io, socket, rooms) {
        this.io = io;
        this.socket = socket;
        this.rooms = rooms;
    }
    listen() {
        this.socket.on('room-create', this.onCreate.bind(this));
        this.socket.on('room-delete', this.onDelete.bind(this));
        this.socket.on('room-join', this.onJoin.bind(this));
        this.socket.on('room-leave', this.onLeave.bind(this));
    }
    onDisconnect() {
        for (const roomId in this.rooms.getAll()) {
            const room = this.rooms.get(roomId);
            if (room === null) {
                continue;
            }
            if (room.ownerUserId === this.socket.id) {
                room.users.forEach((userId) => this.io.to(userId).emit('room-deleted'));
                this.rooms.delete(roomId);
            }
            else {
                this.rooms.removeUser(roomId, this.socket.id);
                this.io.to(room.ownerUserId).emit('room-user-leaved', this.socket.id);
            }
        }
    }
    onCreate(roomId) {
        if (this.rooms.has(roomId)) {
            this.socket.emit('room-create-error', `Room '${roomId}' has been taken.`);
            return;
        }
        this.rooms.add(roomId, this.socket.id);
        this.socket.emit('room-create-ok');
    }
    onDelete(roomId) {
        if (!this.rooms.isOwner(roomId, this.socket.id)) {
            return;
        }
        const room = this.rooms.get(roomId);
        if (room) {
            room.users.forEach((userId) => this.io.to(userId).emit('room-deleted'));
        }
        this.rooms.delete(roomId);
    }
    onJoin(roomId) {
        if (!this.rooms.has(roomId)) {
            this.socket.emit('room-join-error', `Room '${roomId}' not exists.`);
            return;
        }
        if (this.rooms.isOwner(roomId, this.socket.id)) {
            this.socket.emit('room-join-error', 'You already in this room');
            return;
        }
        this.rooms.addUser(roomId, this.socket.id);
        this.socket.emit('room-join-ok');
        const room = this.rooms.get(roomId);
        if (room !== null) {
            this.io.to(room.ownerUserId).emit('room-user-joined', this.socket.id);
        }
    }
    onLeave(roomId) {
        if (!this.rooms.has(roomId)) {
            this.socket.emit('room-join-error', `Room '${roomId}' not exists.`);
            return;
        }
        if (this.rooms.isOwner(roomId, this.socket.id)) {
            this.socket.emit('room-join-error', 'You cannot leave yours room');
            return;
        }
        this.rooms.removeUser(roomId, this.socket.id);
        this.socket.emit('room-leave-ok');
        const room = this.rooms.get(roomId);
        if (room !== null) {
            this.io.to(room.ownerUserId).emit('room-user-leaved', this.socket.id);
        }
    }
}
exports.default = SocketRoom;
