export function formatEventTime(date: string, timeZone?: string): string {
  const instant = new Date(date);
  if (!Number.isFinite(instant.getTime())) return "Date unavailable";
  const options: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  };
  try {
    return new Intl.DateTimeFormat(undefined, { ...options, timeZone }).format(
      instant,
    );
  } catch {
    return new Intl.DateTimeFormat(undefined, options).format(instant);
  }
}
