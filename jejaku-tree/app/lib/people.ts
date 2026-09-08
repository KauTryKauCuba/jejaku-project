// Shared types/constants for a person card — mirrors jejaku-receipt's
// lib/expenses.ts pattern (constants + a plain type, no class), kept in
// one place so the API routes and client components validate against the
// exact same rules.

export const SEX_VALUES = ["male", "female", "unknown"] as const;
export type Sex = (typeof SEX_VALUES)[number];

export const DATE_PRECISION_VALUES = ["day", "month", "year"] as const;
export type DatePrecision = (typeof DATE_PRECISION_VALUES)[number];

export const FAMILY_STATUS_VALUES = [
  "married",
  "partnered",
  "divorced",
  "separated",
  "widowed",
  "unknown",
] as const;
export type FamilyStatus = (typeof FAMILY_STATUS_VALUES)[number];

export const MAX_NAME_LENGTH = 80;
export const MAX_PLACE_LENGTH = 120;
export const MAX_OCCUPATION_LENGTH = 120;
export const MAX_NOTE_LENGTH = 2000;

export type Person = {
  id: string;
  treeId: string;
  givenName: string;
  familyName: string | null;
  sex: Sex;
  birthDate: string | null;
  birthDatePrecision: DatePrecision | null;
  isDeceased: boolean;
  deathDate: string | null;
  deathDatePrecision: DatePrecision | null;
  birthPlace: string | null;
  occupation: string | null;
  note: string | null;
  photoUrl: string | null;
  claimedByUserId: string | null;
  createdAt: string;
};

export type Family = {
  id: string;
  treeId: string;
  partnerAId: string | null;
  partnerBId: string | null;
  status: FamilyStatus;
  unionDate: string | null;
  unionDatePrecision: DatePrecision | null;
  createdAt: string;
};

export type FamilyChild = {
  id: string;
  familyId: string;
  childId: string;
  relToA: string;
  relToB: string;
  createdAt: string;
};

// What the client sends when creating a new person card (as either the
// first person in a tree, or the "other end" of an add-relative action).
export type PersonInput = {
  givenName: string;
  familyName?: string;
  sex: Sex;
  birthDate?: string;
  birthDatePrecision?: DatePrecision;
  isDeceased?: boolean;
  deathDate?: string;
  deathDatePrecision?: DatePrecision;
  birthPlace?: string;
  occupation?: string;
  note?: string;
};

export function validatePersonInput(input: unknown): input is PersonInput {
  if (!input || typeof input !== "object") return false;
  const i = input as Record<string, unknown>;

  if (typeof i.givenName !== "string" || !i.givenName.trim() || i.givenName.length > MAX_NAME_LENGTH) {
    return false;
  }
  if (i.familyName !== undefined && (typeof i.familyName !== "string" || i.familyName.length > MAX_NAME_LENGTH)) {
    return false;
  }
  if (typeof i.sex !== "string" || !(SEX_VALUES as readonly string[]).includes(i.sex)) {
    return false;
  }
  if (
    i.birthDatePrecision !== undefined &&
    (typeof i.birthDatePrecision !== "string" || !(DATE_PRECISION_VALUES as readonly string[]).includes(i.birthDatePrecision))
  ) {
    return false;
  }
  if (
    i.deathDatePrecision !== undefined &&
    (typeof i.deathDatePrecision !== "string" || !(DATE_PRECISION_VALUES as readonly string[]).includes(i.deathDatePrecision))
  ) {
    return false;
  }
  if (i.isDeceased !== undefined && typeof i.isDeceased !== "boolean") return false;
  if (i.birthDate !== undefined && typeof i.birthDate !== "string") return false;
  if (i.deathDate !== undefined && typeof i.deathDate !== "string") return false;
  if (i.birthPlace !== undefined && (typeof i.birthPlace !== "string" || i.birthPlace.length > MAX_PLACE_LENGTH)) {
    return false;
  }
  if (i.occupation !== undefined && (typeof i.occupation !== "string" || i.occupation.length > MAX_OCCUPATION_LENGTH)) {
    return false;
  }
  if (i.note !== undefined && (typeof i.note !== "string" || i.note.length > MAX_NOTE_LENGTH)) return false;

  return true;
}

export function displayName(person: Pick<Person, "givenName" | "familyName">): string {
  return person.familyName ? `${person.givenName} ${person.familyName}` : person.givenName;
}

// Best-effort year, for sorting/display, tolerant of "1952", "1952-08",
// or a full "1952-08-14" — never throws on garbage input, just returns
// null so callers can fall back to "unknown".
export function birthYear(person: Pick<Person, "birthDate">): number | null {
  const match = person.birthDate?.match(/^\d{4}/);
  return match ? Number(match[0]) : null;
}
