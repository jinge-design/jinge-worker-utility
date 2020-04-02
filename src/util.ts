export function isObject(v: unknown): boolean {
  return typeof v === 'object' && v !== null;
}

export function isArrayBuffer(v: unknown): boolean {
  return isObject(v) && v instanceof ArrayBuffer;
}
