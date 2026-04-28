import type { IUser } from "../pages/register/types/user.interface";

const STORAGE_KEY = "currentUser";

export function getUser(): IUser | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as IUser;
  } catch {
    return null;
  }
}

export function setUser(user: IUser): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function requireAuth(): IUser {
  const user = getUser();
  if (!user) {
    window.location.replace("/pages/login/login.html");
    // Throw stops further module execution while redirect is pending
    throw new Error("unauthenticated");
  }
  return user;
}

export function logout(): void {
  localStorage.removeItem(STORAGE_KEY);
  window.location.replace("/");
}
