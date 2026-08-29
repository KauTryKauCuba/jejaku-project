import { useSyncExternalStore } from "react";

export type StoredProfile = {
  fullName: string;
  avatarUrl?: string;
  email?: string;
  registeredAt: string;
};

const STORAGE_KEY = "jejaku:profile";
const AUDIT_KEY = "jejaku:audit";
const MAX_AUDIT_EVENTS = 20;

export type AuditEvent = {
  type: "account_created" | "signed_in";
  at: string;
};

export function logAuditEvent(type: AuditEvent["type"]) {
  if (typeof window === "undefined") return;
  const log = getAuditLog();
  log.unshift({ type, at: new Date().toISOString() });
  window.localStorage.setItem(
    AUDIT_KEY,
    JSON.stringify(log.slice(0, MAX_AUDIT_EVENTS))
  );
}

export function getAuditLog(): AuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(AUDIT_KEY);
    return raw ? (JSON.parse(raw) as AuditEvent[]) : [];
  } catch {
    return [];
  }
}

export function getStoredProfile(): StoredProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    return null;
  }
}

export function setStoredProfile(profile: StoredProfile) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

export function clearStoredProfile() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_KEY }));
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY);
}

function getServerSnapshot() {
  return null;
}

export function useStoredProfile(): StoredProfile | null {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredProfile;
  } catch {
    return null;
  }
}
