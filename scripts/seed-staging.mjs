// Creates the demo colleges and one account per role on the STAGING project.
// Run once by hand after the first staging deploy:
//
//   SUPABASE_URL=https://<ref>.supabase.co \
//   SUPABASE_SECRET_KEY=sb_secret_... \
//   SEED_PASSWORD='<a strong password>' \
//   npm run db:seed:staging
//
// The values come from your shell only. This script never reads .env, so the
// secret key cannot end up in the app bundle, and the password never enters
// the repo. Safe to rerun: existing colleges and accounts are skipped.
import { createClient } from "@supabase/supabase-js";

const { SUPABASE_URL, SUPABASE_SECRET_KEY, SEED_PASSWORD } = process.env;

function fail(message) {
  console.error(message);
  process.exit(1);
}

// http is allowed only for the local stack, to try the script safely.
if (!SUPABASE_URL?.startsWith("https://") && !SUPABASE_URL?.startsWith("http://127.0.0.1:"))
  fail("Set SUPABASE_URL to the staging project URL (https://<ref>.supabase.co).");
if (!SUPABASE_SECRET_KEY?.startsWith("sb_secret_"))
  fail("Set SUPABASE_SECRET_KEY to the staging secret key (sb_secret_...).");
if (
  !SEED_PASSWORD ||
  SEED_PASSWORD.length < 12 ||
  !/[a-z]/.test(SEED_PASSWORD) ||
  !/[A-Z]/.test(SEED_PASSWORD) ||
  !/\d/.test(SEED_PASSWORD)
)
  fail("Set SEED_PASSWORD: at least 12 characters with lower case, upper case and a digit.");

// Same colleges as supabase/seed.sql.
const colleges = [
  { id: "10000000-0000-4000-8000-000000000001", name: "Northfield Institute of Technology", location: "Pune", status: "verified" },
  { id: "10000000-0000-4000-8000-000000000002", name: "Riverside College of Arts and Science", location: "Bengaluru", status: "verified" },
  { id: "10000000-0000-4000-8000-000000000003", name: "Lakeview University", location: "Hyderabad", status: "verified" },
  { id: "10000000-0000-4000-8000-000000000004", name: "Hillcrest School of Design", location: "Chennai", status: "pending" },
  { id: "10000000-0000-4000-8000-000000000005", name: "Duplicate Test College", location: "Nowhere", status: "rejected" },
];

const accounts = [
  { email: "student@studentsync.test", first_name: "Sam", last_name: "Student", college_id: colleges[0].id, role: "student" },
  { email: "organizer@studentsync.test", first_name: "Olivia", last_name: "Organizer", college_id: colleges[0].id, role: "organizer" },
  { email: "admin@studentsync.test", first_name: "Ada", last_name: "Admin", college_id: null, role: "admin" },
];

// The secret key acts as service_role: it bypasses RLS. Never ship it in the app.
const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { error: collegeError } = await supabase
  .from("colleges")
  .upsert(colleges, { onConflict: "id", ignoreDuplicates: true });
if (collegeError) fail(`Colleges failed: ${collegeError.message}`);
console.log(`Colleges: ${colleges.length} ensured.`);

// Find existing seed accounts (first page is enough on a fresh staging project).
const { data: list, error: listError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
if (listError) fail(`Listing users failed: ${listError.message}`);
const existing = new Map(list.users.map((u) => [u.email, u.id]));

for (const account of accounts) {
  let id = existing.get(account.email);
  if (id) {
    console.log(`${account.role}: already exists, skipped.`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: SEED_PASSWORD,
      email_confirm: true,
      user_metadata: {
        first_name: account.first_name,
        last_name: account.last_name,
        college_id: account.college_id,
      },
    });
    if (error) fail(`Creating the ${account.role} account failed: ${error.message}`);
    id = data.user.id;
    console.log(`${account.role}: created.`);
  }
  // The sign-up trigger always makes students; promote the others.
  const { error: roleError } = await supabase.from("profiles").update({ role: account.role }).eq("id", id);
  if (roleError) fail(`Setting the ${account.role} role failed: ${roleError.message}`);
}

console.log("Staging seed finished. No credentials were printed.");
