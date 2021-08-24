"use strict";
Object.defineProperty(exports, "__esModule", {value: true});
class EntityUsers {
  constructor(users) {
    this.users = new Set(users);
  }
  add(userId) {
    this.users.add(userId);
  }
  delete(userId) {
    this.users.delete(userId);
  }
  has(userId) {
    return this.users.has(userId);
  }
  getUsers() {
    return this.users;
  }
}
exports.default = EntityUsers;
