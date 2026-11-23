export const EMAIL_COOLDOWN_MS = 60_000;
export const cleanEmail = (email: string) => email.trim().toLowerCase();
export const validEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail(email));
export const emailCooldownKey = (action: string, email: string) => `table-email:${action}:${cleanEmail(email)}`;
export function cooldownSeconds(until: number, now = Date.now()) {
  return Math.max(0, Math.ceil((until - now) / 1000));
}
export function emailChangeComplete(current: string, pending: string | undefined, original: string, requested: string) {
  return !pending && cleanEmail(current) === cleanEmail(requested) && cleanEmail(current) !== cleanEmail(original);
}
