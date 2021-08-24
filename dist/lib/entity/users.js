"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class EntityUsers {
    constructor(users) {
        this.users = users;
    }
    add(id, name = "") {
        if (this.has(id)) {
            return;
        }
        this.users[id] = {
            id,
            name,
        };
    }
    updateName(id, name) {
        if (!this.has(id)) {
            return false;
        }
        const exists = Object.values(this.users).filter((user) => user.name.toLocaleLowerCase() === name.toLocaleLowerCase());
        if (exists.length > 0) {
            return false;
        }
        this.users[id].name = name;
        return true;
    }
    delete(id) {
        if (this.has(id)) {
            delete this.users[id];
        }
    }
    has(id) {
        return this.users.hasOwnProperty(id);
    }
    get(id) {
        if (this.has(id)) {
            return this.users[id];
        }
        return null;
    }
    getAll() {
        return this.users;
    }
}
exports.default = EntityUsers;
