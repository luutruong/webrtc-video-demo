import { Room } from "../..";

class EntityRooms {
  private rooms: {[key: string]: Room};

  constructor(rooms: {[key: string]: Room}) {
    this.rooms = rooms;
  }

  public add(roomId: string, ownerUserId: string): boolean {
    if (this.has(roomId)) {
      return false;
    }

    this.rooms[roomId] = {
      users: new Set(),
      ownerUserId,
    };

    return true;
  }

  public has(roomId: string): boolean {
    return this.rooms.hasOwnProperty(roomId);
  }

  public delete(roomId: string): boolean {
    if (this.has(roomId)) {
      delete this.rooms[roomId];

      return true;
    }

    return false;
  }

  public isOwner(roomId: string, userId: string): boolean {
    return this.has(roomId) && this.rooms[roomId].ownerUserId === userId;
  }

  public get(roomId: string): Room | null {
    if (this.has(roomId)) {
      return this.rooms[roomId];
    }

    return null;
  }

  public getAll(): {[key: string]: Room} {
    return this.rooms;
  }

  public addUser(roomId: string, userId: string): boolean {
    if (!this.has(roomId)) {
      return false;
    }

    this.rooms[roomId].users.add(userId);

    return true;
  }

  public removeUser(roomId: string, userId: string): boolean {
    if (!this.has(roomId)) {
      return false;
    }

    this.rooms[roomId].users.delete(userId);

    return true;
  }

  public hasUserJoined(roomId: string, userId: string): boolean {
    const room = this.get(roomId);

    return room !== null && room.users.has(userId);
  }

  public onUserDisconnected(userId: string) {}
}

export default EntityRooms;