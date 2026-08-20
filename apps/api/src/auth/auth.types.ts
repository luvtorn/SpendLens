export type CurrentUser = { id: string };
export type SafeUser = { id: string; email: string; name: string | null };
export type AuthSession = {
  user: SafeUser;
  accessToken: string;
  refreshToken: string;
  accessMaxAgeMs: number;
  refreshMaxAgeMs: number;
};
