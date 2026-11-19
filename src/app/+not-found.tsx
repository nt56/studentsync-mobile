import { useAppSelector } from "@/store/hooks";
import { Redirect } from "expo-router";

/**
 * The launch URL is `studentsync:///` and "/" only exists for students
 * ((tabs)/index). For signed-out or non-student users that route is behind a
 * guard, so it is unmatched. Send them to their own entry screen instead of
 * showing the default "Unmatched Route" page.
 */
export default function NotFound() {
  const status = useAppSelector((s) => s.auth.status);

  if (status === "unauthenticated") return <Redirect href="/sign-in" />;
  if (status === "authenticated") return <Redirect href="/account-status" />;
  return null;
}
