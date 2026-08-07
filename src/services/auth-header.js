/**
 * Resolve the current Supabase session before building a BFF Authorization header.
 * Kept separate so the async boundary is explicit and unit-testable.
 */
export async function getAuthHeader(auth) {
  if (!auth?.getSession) return null;

  try {
    const { data } = await auth.getSession();
    const token = data?.session?.access_token;
    return token ? `Bearer ${token}` : null;
  } catch {
    return null;
  }
}
