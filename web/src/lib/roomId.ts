/** Random, hard-to-guess room ids like "k7f2-x9qm-p3ta". */
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function isValidRoomId(id: string): boolean {
  if (!id || typeof id !== "string") return false;
  // Supports hyphenated rooms (k7f2-x9qm-p3ta, hack-sign-42) and custom names (hariom, demo, team)
  return /^[a-z0-9_-]{2,64}$/i.test(id.trim());
}
