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
            users: new Set(),
            ownerUserId,
        };
        return true;
    }
    has(roomId) {
        return this.rooms.hasOwnProperty(roomId);
    }
    delete(roomId) {
        if (this.has(roomId)) {
            delete this.rooms[roomId];
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
        this.rooms[roomId].users.add(userId);
        return true;
    }
    removeUser(roomId, userId) {
        if (!this.has(roomId)) {
            return false;
        }
        this.rooms[roomId].users.delete(userId);
        return true;
    }
    hasUserJoined(roomId, userId) {
        const room = this.get(roomId);
        return room !== null && room.users.has(userId);
    }
}
exports.default = EntityRooms;
