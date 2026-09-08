import { describe, expect, it } from "vitest";
import { buildGraph, getRelationshipLabel } from "./relationship";
import type { Family, FamilyChild, Person } from "./people";

// Builds a minimal Person for test fixtures — only id/sex matter to the
// relationship engine, everything else is filler.
function person(id: string, sex: Person["sex"] = "unknown"): Person {
  return {
    id,
    treeId: "tree-1",
    givenName: id,
    familyName: null,
    sex,
    birthDate: null,
    birthDatePrecision: null,
    isDeceased: false,
    deathDate: null,
    deathDatePrecision: null,
    birthPlace: null,
    occupation: null,
    note: null,
    photoUrl: null,
    claimedByUserId: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function family(id: string, partnerAId: string | null, partnerBId: string | null): Family {
  return {
    id,
    treeId: "tree-1",
    partnerAId,
    partnerBId,
    status: "married",
    unionDate: null,
    unionDatePrecision: null,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function link(familyId: string, childId: string): FamilyChild {
  return { id: `${familyId}-${childId}`, familyId, childId, relToA: "biological", relToB: "biological", createdAt: "2026-01-01T00:00:00.000Z" };
}

// Ahmad + Siti -> Zaid, Aisha
// Ahmad + Mariam -> Yusuf   (half-sibling to Zaid/Aisha via Ahmad)
// Zaid + Nurul -> Hana      (Hana is Ahmad's grandchild)
// Zaid's sibling Aisha has no kids -> Hana's aunt
function buildFixture() {
  const people: Person[] = [
    person("ahmad", "male"),
    person("siti", "female"),
    person("mariam", "female"),
    person("zaid", "male"),
    person("aisha", "female"),
    person("yusuf", "male"),
    person("nurul", "female"),
    person("hana", "female"),
  ];

  const families: Family[] = [
    family("fam1", "ahmad", "siti"),
    family("fam2", "ahmad", "mariam"),
    family("fam3", "zaid", "nurul"),
  ];

  const familyChildren: FamilyChild[] = [
    link("fam1", "zaid"),
    link("fam1", "aisha"),
    link("fam2", "yusuf"),
    link("fam3", "hana"),
  ];

  return buildGraph(people, families, familyChildren);
}

describe("getRelationshipLabel", () => {
  const graph = buildFixture();

  it("labels a parent", () => {
    expect(getRelationshipLabel(graph, "zaid", "ahmad")).toBe("Father");
    expect(getRelationshipLabel(graph, "zaid", "siti")).toBe("Mother");
  });

  it("labels a child", () => {
    expect(getRelationshipLabel(graph, "ahmad", "zaid")).toBe("Son");
    expect(getRelationshipLabel(graph, "ahmad", "aisha")).toBe("Daughter");
  });

  it("labels full siblings (same family row)", () => {
    expect(getRelationshipLabel(graph, "zaid", "aisha")).toBe("Sister");
    expect(getRelationshipLabel(graph, "aisha", "zaid")).toBe("Brother");
  });

  it("labels half siblings (shared parent, different family rows)", () => {
    expect(getRelationshipLabel(graph, "zaid", "yusuf")).toBe("Half-brother");
    expect(getRelationshipLabel(graph, "yusuf", "zaid")).toBe("Half-brother");
  });

  it("labels a partner without walking the ancestor graph", () => {
    expect(getRelationshipLabel(graph, "ahmad", "siti")).toBe("Wife");
    expect(getRelationshipLabel(graph, "siti", "ahmad")).toBe("Husband");
  });

  it("labels a grandparent and grandchild", () => {
    expect(getRelationshipLabel(graph, "hana", "ahmad")).toBe("Grandfather");
    expect(getRelationshipLabel(graph, "ahmad", "hana")).toBe("Granddaughter");
  });

  it("labels an aunt/uncle and niece/nephew", () => {
    expect(getRelationshipLabel(graph, "hana", "aisha")).toBe("Aunt");
    expect(getRelationshipLabel(graph, "aisha", "hana")).toBe("Niece");
  });

  it("labels a great-generation relative through a half-sibling branch", () => {
    // Hana's nearest common ancestor with Yusuf is Ahmad: 2 steps up from
    // Hana, 1 step up from Yusuf — same up=2/down=1 shape as the aunt
    // case above, so Yusuf (Ahmad's son via the second marriage) reads as
    // Hana's uncle too, despite being on the "half" side of the family.
    expect(getRelationshipLabel(graph, "hana", "yusuf")).toBe("Uncle");
  });

  it("returns 'You' for the same person and null for no relation", () => {
    expect(getRelationshipLabel(graph, "zaid", "zaid")).toBe("You");
    expect(getRelationshipLabel(graph, "nurul", "mariam")).toBeNull();
  });
});
