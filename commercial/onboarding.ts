export const WELCOME_SEEN_KEY = 'table_welcome_seen_at';
export function hasSeenWelcome(metadata?: Record<string, unknown>) {
  return typeof metadata?.[WELCOME_SEEN_KEY] === 'string' && Boolean(metadata[WELCOME_SEEN_KEY]);
}
