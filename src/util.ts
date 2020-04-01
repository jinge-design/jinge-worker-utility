export function isObject(v: unknown): boolean {
  return typeof v === 'object' && v !== null;
}
