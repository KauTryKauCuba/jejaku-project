import type { people, families, familyChildren } from "./schema";
import type { DatePrecision, Family, FamilyChild, FamilyStatus, Person, Sex } from "../lib/people";

export function toPerson(row: typeof people.$inferSelect): Person {
  return {
    id: row.id,
    treeId: row.treeId,
    givenName: row.givenName,
    familyName: row.familyName,
    sex: row.sex as Sex,
    birthDate: row.birthDate,
    birthDatePrecision: row.birthDatePrecision as DatePrecision | null,
    isDeceased: row.isDeceased,
    deathDate: row.deathDate,
    deathDatePrecision: row.deathDatePrecision as DatePrecision | null,
    birthPlace: row.birthPlace,
    occupation: row.occupation,
    note: row.note,
    photoUrl: row.photoUrl,
    claimedByUserId: row.claimedByUserId,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toFamily(row: typeof families.$inferSelect): Family {
  return {
    id: row.id,
    treeId: row.treeId,
    partnerAId: row.partnerAId,
    partnerBId: row.partnerBId,
    status: row.status as FamilyStatus,
    unionDate: row.unionDate,
    unionDatePrecision: row.unionDatePrecision as DatePrecision | null,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toFamilyChild(row: typeof familyChildren.$inferSelect): FamilyChild {
  return {
    id: row.id,
    familyId: row.familyId,
    childId: row.childId,
    relToA: row.relToA,
    relToB: row.relToB,
    createdAt: row.createdAt.toISOString(),
  };
}
