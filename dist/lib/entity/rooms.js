"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntityRooms {
    constructor(rooms) {
        this.rooms = rooms;
    }
    add(roomId, ownerUserId) {
        if (this.has(roomId)) {
            return false;
        }
        this.rooms[roomId] = {
            id: roomId,
            users: [],
            ownerUserId,
        };
        this.addUser(roomId, ownerUserId);
        console.log('created room', roomId, 'ownerUserId:', ownerUserId);
        return true;
    }
    has(roomId) {
        return this.rooms.hasOwnProperty(roomId);
    }
    delete(roomId) {
        if (this.has(roomId)) {
            delete this.rooms[roomId];
            console.log('deleted room', roomId);
            return true;
        }
        return false;
    }
    isOwner(roomId, userId) {
        return this.has(roomId) && this.rooms[roomId].ownerUserId === userId;
    }
    get(roomId) {
        if (this.has(roomId)) {
            return this.rooms[roomId];
        }
        return null;
    }
    getAll() {
        return this.rooms;
    }
    addUser(roomId, userId) {
        if (!this.has(roomId)) {
            return false;
        }
        if (this.rooms[roomId].users.indexOf(userId) === -1) {
            this.rooms[roomId].users.push(userId);
        }
        return true;
    }
    removeUser(roomId, userId) {
        if (!this.has(roomId)) {
            return false;
        }
        this.rooms[roomId].users = this.rooms[roomId].users.filter((id) => id !== userId);
        return true;
    }
    hasUserJoined(roomId, userId) {
        const room = this.get(roomId);
        return room !== null && room.users.indexOf(userId) >= 0;
    }
}
exports.default = EntityRooms;
