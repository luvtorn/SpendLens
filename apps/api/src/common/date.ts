export function serializeDateOnly(value: Date): string {
  return value.toISOString().slice(0, 10);
}
