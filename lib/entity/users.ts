import {User} from '../..';

class EntityUsers {
  private users: {[id: string]: User};

  constructor(users: {[id: string]: User}) {
    this.users = users;
  }

  public add(id: string, name: string = ''): void {
    if (this.has(id)) {
      return;
    }

    this.users[id] = {
      id,
      name,
    };
  }

  public updateName(id: string, name: string): boolean {
    if (!this.has(id)) {
      return false;
    }

    const exists = Object.values(this.users).filter(
      (user) => user.name.toLocaleLowerCase() === name.toLocaleLowerCase()
    );
    if (exists.length > 0) {
      return false;
    }

    this.users[id].name = name;
    return true;
  }

  public delete(id: string): void {
    if (this.has(id)) {
      delete this.users[id];
    }
  }

  public has(id: string): boolean {
    return this.users.hasOwnProperty(id);
  }

  public get(id: string): User | null {
    if (this.has(id)) {
      return this.users[id];
    }

    return null;
  }

  public getAll(): {[id: string]: User} {
    return this.users;
  }
}

export default EntityUsers;
