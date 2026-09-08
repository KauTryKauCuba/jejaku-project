import type { Family, FamilyChild, Person, Sex } from "./people";

// Labels every card relative to whichever card is currently focused —
// this is computed on the fly from the graph, never stored, so it's
// always correct after any edit and there's no "sibling" row to keep in
// sync. See the design note on `families` in db/schema.ts for the graph
// this walks.

type Graph = {
  peopleById: Map<string, Person>;
  parentsOf: Map<string, string[]>; // childId -> parent person ids
  childrenOf: Map<string, string[]>; // partner person id -> child ids
  partnersOf: Map<string, string[]>; // person id -> co-partner ids
  familiesAsChild: Map<string, string>; // person id -> the one family id they're a child in
};

export function buildGraph(people: Person[], families: Family[], familyChildren: FamilyChild[]): Graph {
  const peopleById = new Map(people.map((p) => [p.id, p]));
  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const partnersOf = new Map<string, string[]>();
  const familiesAsChild = new Map<string, string>();
  const familyById = new Map(families.map((f) => [f.id, f]));

  for (const f of families) {
    if (f.partnerAId && f.partnerBId) {
      partnersOf.set(f.partnerAId, [...(partnersOf.get(f.partnerAId) ?? []), f.partnerBId]);
      partnersOf.set(f.partnerBId, [...(partnersOf.get(f.partnerBId) ?? []), f.partnerAId]);
    }
  }

  for (const link of familyChildren) {
    const family = familyById.get(link.familyId);
    if (!family) continue;
    familiesAsChild.set(link.childId, family.id);
    const parents = [family.partnerAId, family.partnerBId].filter((id): id is string => Boolean(id));
    parentsOf.set(link.childId, parents);
    for (const parentId of parents) {
      childrenOf.set(parentId, [...(childrenOf.get(parentId) ?? []), link.childId]);
    }
  }

  return { peopleById, parentsOf, childrenOf, partnersOf, familiesAsChild };
}

// depth 0 = self, depth N = N steps up the parent chain. A person can
// have up to two parents per generation, so this is a small BFS, not a
// straight line.
function ancestorDepths(graph: Graph, id: string): Map<string, number> {
  const depths = new Map<string, number>([[id, 0]]);
  let frontier = [id];
  let depth = 0;
  while (frontier.length > 0 && depth < 10) {
    depth++;
    const next: string[] = [];
    for (const current of frontier) {
      for (const parentId of graph.parentsOf.get(current) ?? []) {
        if (!depths.has(parentId)) {
          depths.set(parentId, depth);
          next.push(parentId);
        }
      }
    }
    frontier = next;
  }
  return depths;
}

function ordinal(n: number): string {
  if (n === 1) return "First";
  if (n === 2) return "Second";
  if (n === 3) return "Third";
  if (n === 4) return "Fourth";
  if (n === 5) return "Fifth";
  return `${n}th`;
}

function greatPrefix(times: number): string {
  return times <= 0 ? "" : `${"Great-".repeat(times)}`;
}

function gendered(sex: Sex | undefined, male: string, female: string, neutral: string): string {
  if (sex === "male") return male;
  if (sex === "female") return female;
  return neutral;
}

// Full vs. half sibling: they share a common parent (that's what put them
// at up=1/down=1 below) — full means they share the *same family row*
// (both parent slots match), half means they only share one parent across
// two different families (see db/schema.ts's remarriage example).
function siblingLabel(graph: Graph, fromId: string, toId: string, toSex: Sex | undefined): string {
  const fromFamilyId = graph.familiesAsChild.get(fromId);
  const toFamilyId = graph.familiesAsChild.get(toId);
  const full = fromFamilyId && fromFamilyId === toFamilyId;
  const base = gendered(toSex, "Brother", "Sister", "Sibling");
  return full ? base : `Half-${base.toLowerCase()}`;
}

/**
 * The label `toId` should wear on a card when `fromId` is the focused
 * person — e.g. getRelationshipLabel(graph, focus, cardShown) returns
 * "Father", "First cousin", "Wife", etc. Returns null when no
 * relationship (blood or partnership) is found within the walked depth.
 */
export function getRelationshipLabel(graph: Graph, fromId: string, toId: string): string | null {
  if (fromId === toId) return "You";

  const toSex = graph.peopleById.get(toId)?.sex;

  // Partnership isn't a blood relation, so it won't show up in the
  // ancestor walk below — checked directly first.
  if ((graph.partnersOf.get(fromId) ?? []).includes(toId)) {
    return gendered(toSex, "Husband", "Wife", "Partner");
  }

  const fromAncestors = ancestorDepths(graph, fromId);
  const toAncestors = ancestorDepths(graph, toId);

  let best: { commonId: string; up: number; down: number } | null = null;
  for (const [commonId, up] of fromAncestors) {
    const down = toAncestors.get(commonId);
    if (down === undefined) continue;
    if (!best || up + down < best.up + best.down) {
      best = { commonId, up, down };
    }
  }

  if (!best) return null; // no known blood or partner path
  const { up, down } = best;

  if (up === 1 && down === 0) return gendered(toSex, "Father", "Mother", "Parent");
  if (up === 0 && down === 1) return gendered(toSex, "Son", "Daughter", "Child");
  if (up === 1 && down === 1) return siblingLabel(graph, fromId, toId, toSex);

  if (down === 0 && up >= 2) {
    return `${greatPrefix(up - 2)}${gendered(toSex, "Grandfather", "Grandmother", "Grandparent")}`;
  }
  if (up === 0 && down >= 2) {
    return `${greatPrefix(down - 2)}${gendered(toSex, "Grandson", "Granddaughter", "Grandchild")}`;
  }

  if (down === 1 && up >= 2) {
    return `${greatPrefix(up - 2)}${gendered(toSex, "Uncle", "Aunt", "Uncle/Aunt")}`;
  }
  if (up === 1 && down >= 2) {
    return `${greatPrefix(down - 2)}${gendered(toSex, "Nephew", "Niece", "Nephew/Niece")}`;
  }

  // Both at least 2 steps from the common ancestor: cousins. Degree is
  // how many generations back the *closer* side's grandparent-equivalent
  // is; "removed" is the generation gap between the two people.
  const degree = Math.min(up, down) - 1;
  const removed = Math.abs(up - down);
  const removedSuffix = removed > 0 ? ` ${removed}x removed` : "";
  return `${ordinal(degree)} cousin${removedSuffix}`;
}
