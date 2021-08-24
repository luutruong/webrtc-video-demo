import {Room} from '../..';

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
      id: roomId,
      users: [],
      ownerUserId,
    };
    this.addUser(roomId, ownerUserId);
    console.log('created room', roomId, 'ownerUserId:', ownerUserId);

    return true;
  }

  public has(roomId: string): boolean {
    return this.rooms.hasOwnProperty(roomId);
  }

  public delete(roomId: string): boolean {
    if (this.has(roomId)) {
      delete this.rooms[roomId];
      console.log('deleted room', roomId);

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

    if (this.rooms[roomId].users.indexOf(userId) === -1) {
      this.rooms[roomId].users.push(userId);
    }

    return true;
  }

  public removeUser(roomId: string, userId: string): boolean {
    if (!this.has(roomId)) {
      return false;
    }

    this.rooms[roomId].users = this.rooms[roomId].users.filter((id) => id !== userId);

    return true;
  }

  public hasUserJoined(roomId: string, userId: string): boolean {
    const room = this.get(roomId);

    return room !== null && room.users.indexOf(userId) >= 0;
  }
}

export default EntityRooms;
