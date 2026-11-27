// Prints the staging database URL for the deploy job.
//
// GitHub's runners have no IPv6, and Supabase's direct database host is
// IPv6-only, so the deploy connects through the "session pooler" (IPv4).
//
//   SUPABASE_DB_URL      the session pooler string from the dashboard's
//                        "Connect" dialog; the password placeholder may stay
//   SUPABASE_DB_PASSWORD the database password, inserted here
//
// The output contains the password: capture it and mask it, never log it.
import { pathToFileURL } from "node:url";

export function stagingDbUrl(raw, password) {
  let url;
  try {
    url = new URL((raw ?? "").trim());
  } catch {
    throw new Error("SUPABASE_DB_URL is empty or not a connection string.");
  }
  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    !url.hostname.endsWith(".pooler.supabase.com") ||
    !url.username.startsWith("postgres.") ||
    url.port !== "5432"
  ) {
    throw new Error(
      "SUPABASE_DB_URL must be the Session pooler string: postgresql://postgres.<ref>@<host>.pooler.supabase.com:5432/postgres",
    );
  }
  if (!password) throw new Error("SUPABASE_DB_PASSWORD is empty.");
  // Encoded so characters like @ # / % in a password cannot break the URL.
  url.password = encodeURIComponent(password);
  return url.toString();
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    process.stdout.write(
      stagingDbUrl(process.env.SUPABASE_DB_URL, process.env.SUPABASE_DB_PASSWORD),
    );
  } catch (error) {
    // Never print the input: it may hold a password.
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}
