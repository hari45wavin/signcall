/** Random, hard-to-guess room ids like "k7f2-x9qm-p3ta". */
const ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789";

export function newRoomId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  const chars = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
  return `${chars.slice(0, 4)}-${chars.slice(4, 8)}-${chars.slice(8, 12)}`;
}

export function isValidRoomId(id: string): boolean {
  // Supports 4-4-4 format (e.g. k7f2-x9qm-p3ta) as well as named rooms like hack-sign-42
  return /^[a-z0-9]{2,12}(-[a-z0-9]{2,12}){1,3}$/i.test(id);
}
