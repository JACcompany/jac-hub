import { useGetMe } from "@workspace/api-client-react";

export const OWNER_EMAIL = "gael@jac.dev";

export function useIsAdmin(): boolean {
  const { data: user } = useGetMe();
  return user?.email === OWNER_EMAIL;
}

export function useIsOwner(): boolean {
  const { data: user } = useGetMe();
  return user?.email === OWNER_EMAIL;
}

export function useCurrentUser() {
  const { data: user } = useGetMe();
  return user ?? null;
}
