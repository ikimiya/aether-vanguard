import { useAuth } from "./AuthProvider";

/** The current auth user id, or null when signed out. */
export function useUserId(): string | null {
  return useAuth().session?.user.id ?? null;
}

/** Like useUserId but throws when signed out — for use inside RequireAuth. */
export function useRequiredUserId(): string {
  const id = useUserId();
  if (!id) throw new Error("No authenticated user");
  return id;
}
