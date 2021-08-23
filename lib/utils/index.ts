export function ARRAY_removeId(ids: string[], id: string): string[] {
  return ids.filter(id => id !== id);
}
