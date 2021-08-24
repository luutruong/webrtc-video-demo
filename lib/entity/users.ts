class EntityUsers {
  private users: Set<string>;

  constructor(users: Set<string>) {
    this.users = new Set(users);
  }

  public add(userId: string): void {
    this.users.add(userId);
  }

  public delete(userId: string): void {
    this.users.delete(userId);
  }

  public has(userId: string): boolean {
    return this.users.has(userId);
  }

  public getUsers(): Set<string> {
    return this.users;
  }
}

export default EntityUsers;
