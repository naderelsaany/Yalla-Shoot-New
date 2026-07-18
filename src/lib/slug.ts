/**
 * Generate a URL-safe slug from a team or league name.
 * Supports Arabic characters (U+0600–U+06FF).
 */
export function generateSlug(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}
