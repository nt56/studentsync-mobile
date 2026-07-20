type ClassValue = string | false | null | undefined;

/** Join conditional class strings. */
export function cn(...parts: ClassValue[]): string {
  return parts.filter(Boolean).join(" ");
}
