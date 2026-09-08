"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { Family, FamilyChild, Person, PersonInput } from "../lib/people";
import { buildGraph, getRelationshipLabel } from "../lib/relationship";

export type AddRelativeRelation = "parent" | "partner" | "child" | "sibling";

// Thrown when the server needs the caller to disambiguate which family a
// new child belongs to (a remarried person has more than one) — carries
// the choices straight through so the modal can turn it into a picker
// instead of a generic error message. Mirrors RelativeActionError
// server-side (lib/relatives.ts).
export class NeedsFamilyChoiceError extends Error {
  constructor(message: string, public readonly families: { id: string; otherPartnerName: string | null }[]) {
    super(message);
  }
}

type PeopleContextValue = {
  people: Person[];
  families: Family[];
  familyChildren: FamilyChild[];
  addRelative: (anchorId: string, relation: AddRelativeRelation, input: PersonInput, familyId?: string) => Promise<Person>;
  createFirstPerson: (input: PersonInput) => Promise<Person>;
  updatePerson: (id: string, input: PersonInput) => Promise<void>;
  deletePerson: (id: string) => Promise<void>;
  parentsOf: (personId: string) => Person[];
  partnersOf: (personId: string) => Person[];
  childrenOf: (personId: string, familyId?: string) => Person[];
  siblingsOf: (personId: string) => Person[];
  familiesAsPartner: (personId: string) => Family[];
  relationshipLabel: (fromId: string, toId: string) => string | null;
};

const PeopleContext = createContext<PeopleContextValue | null>(null);

export function PeopleProvider({
  initialPeople,
  initialFamilies,
  initialFamilyChildren,
  children,
}: {
  initialPeople: Person[];
  initialFamilies: Family[];
  initialFamilyChildren: FamilyChild[];
  children: ReactNode;
}) {
  const [people, setPeople] = useState(initialPeople);
  const [families, setFamilies] = useState(initialFamilies);
  const [familyChildren, setFamilyChildren] = useState(initialFamilyChildren);

  const upsertFamily = useCallback((family: Family) => {
    setFamilies((prev) => {
      const idx = prev.findIndex((f) => f.id === family.id);
      if (idx === -1) return [...prev, family];
      const next = [...prev];
      next[idx] = family;
      return next;
    });
  }, []);

  const createFirstPerson = useCallback(async (input: PersonInput) => {
    const res = await fetch("/api/people", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? "Couldn't add that person.");
    }
    const created: Person = await res.json();
    setPeople((prev) => [...prev, created]);
    return created;
  }, []);

  const addRelative = useCallback(
    async (anchorId: string, relation: AddRelativeRelation, input: PersonInput, familyId?: string) => {
      const res = await fetch(`/api/people/${anchorId}/relatives`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ relation, familyId, person: input }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        if (res.status === 409 && body?.code === "NEEDS_FAMILY_CHOICE") {
          throw new NeedsFamilyChoiceError(body.error, body.families ?? []);
        }
        throw new Error(body?.error ?? "Couldn't add that relative.");
      }

      // Trusts the server's own account of which family_children rows it
      // just created (`newFamilyChildren`) rather than guessing from
      // `relation` here — a real bug, caught by running this in a
      // browser: "add parent" and "add sibling" can both create a link
      // for the *anchor* person, not just the new relative (see
      // lib/relatives.ts's addParent/addSibling), and a client that only
      // ever appended a link for the new person silently never showed
      // the new card because the anchor's own side of the graph was
      // missing.
      const { person, family, newFamilyChildren }: { person: Person; family: Family; newFamilyChildren: FamilyChild[] } = await res.json();
      setPeople((prev) => [...prev, person]);
      upsertFamily(family);
      if (newFamilyChildren.length > 0) {
        setFamilyChildren((prev) => [...prev, ...newFamilyChildren]);
      }
      return person;
    },
    [upsertFamily]
  );

  const updatePerson = useCallback(async (id: string, input: PersonInput) => {
    const res = await fetch(`/api/people/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!res.ok) throw new Error("Couldn't save changes.");
    const updated: Person = await res.json();
    setPeople((prev) => prev.map((p) => (p.id === id ? updated : p)));
  }, []);

  const deletePerson = useCallback(async (id: string) => {
    const res = await fetch(`/api/people/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Couldn't delete that person.");
    setPeople((prev) => prev.filter((p) => p.id !== id));
    setFamilies((prev) => prev.map((f) => ({
      ...f,
      partnerAId: f.partnerAId === id ? null : f.partnerAId,
      partnerBId: f.partnerBId === id ? null : f.partnerBId,
    })));
    setFamilyChildren((prev) => prev.filter((fc) => fc.childId !== id));
  }, []);

  const peopleById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

  const graph = useMemo(() => buildGraph(people, families, familyChildren), [people, families, familyChildren]);

  const parentsOf = useCallback((personId: string) => (graph.parentsOf.get(personId) ?? []).map((id) => peopleById.get(id)).filter((p): p is Person => Boolean(p)), [graph, peopleById]);
  const partnersOf = useCallback((personId: string) => (graph.partnersOf.get(personId) ?? []).map((id) => peopleById.get(id)).filter((p): p is Person => Boolean(p)), [graph, peopleById]);
  const familiesAsPartner = useCallback(
    (personId: string) => families.filter((f) => f.partnerAId === personId || f.partnerBId === personId),
    [families]
  );
  const childrenOf = useCallback(
    (personId: string, familyId?: string) => {
      const relevantFamilyIds = familyId
        ? [familyId]
        : families.filter((f) => f.partnerAId === personId || f.partnerBId === personId).map((f) => f.id);
      const childIds = familyChildren.filter((fc) => relevantFamilyIds.includes(fc.familyId)).map((fc) => fc.childId);
      return childIds.map((id) => peopleById.get(id)).filter((p): p is Person => Boolean(p));
    },
    [families, familyChildren, peopleById]
  );
  const siblingsOf = useCallback(
    (personId: string) => {
      const familyId = familyChildren.find((fc) => fc.childId === personId)?.familyId;
      if (!familyId) return [];
      return familyChildren
        .filter((fc) => fc.familyId === familyId && fc.childId !== personId)
        .map((fc) => peopleById.get(fc.childId))
        .filter((p): p is Person => Boolean(p));
    },
    [familyChildren, peopleById]
  );

  const relationshipLabel = useCallback((fromId: string, toId: string) => getRelationshipLabel(graph, fromId, toId), [graph]);

  return (
    <PeopleContext.Provider
      value={{
        people,
        families,
        familyChildren,
        addRelative,
        createFirstPerson,
        updatePerson,
        deletePerson,
        parentsOf,
        partnersOf,
        childrenOf,
        siblingsOf,
        familiesAsPartner,
        relationshipLabel,
      }}
    >
      {children}
    </PeopleContext.Provider>
  );
}

export function usePeople() {
  const ctx = useContext(PeopleContext);
  if (!ctx) throw new Error("usePeople must be used within PeopleProvider");
  return ctx;
}
