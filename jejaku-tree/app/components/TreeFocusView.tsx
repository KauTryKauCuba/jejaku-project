"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PencilSimple } from "@phosphor-icons/react";
import { usePeople, type AddRelativeRelation } from "./PeopleProvider";
import PersonCard, { AddPersonTile } from "./PersonCard";
import AddRelativeModal from "./AddRelativeModal";
import EditPersonModal from "./EditPersonModal";
import type { Person } from "../lib/people";

// Deliberately not a pan/zoom canvas — see the project's build notes:
// general family-tree layout is a DAG (two parents converge on one
// child), and laying that out generically is genuinely hard. This
// sidesteps it entirely: only the *focused* person's immediate relatives
// are ever rendered, driven by one SQL-free lookup against the tree
// already loaded client-side (see PeopleProvider). Clicking any card just
// changes the focus — no re-fetch, no layout recompute.
export default function TreeFocusView({ focusId }: { focusId: string }) {
  const router = useRouter();
  const { people, parentsOf, partnersOf, childrenOf, siblingsOf, familiesAsPartner, relationshipLabel } = usePeople();
  const [addModal, setAddModal] = useState<AddRelativeRelation | null>(null);
  const [editing, setEditing] = useState<Person | null>(null);

  const focus = people.find((p) => p.id === focusId);
  if (!focus) {
    return <p className="text-[13px] text-ink-mute">That person isn&apos;t in this tree.</p>;
  }

  const parents = parentsOf(focus.id);
  const partners = partnersOf(focus.id);
  const siblings = siblingsOf(focus.id);
  const partnerFamilies = familiesAsPartner(focus.id);

  const setFocus = (id: string) => router.push(`/tree?focus=${id}`);

  return (
    <div className="flex flex-col items-center gap-[28px] py-[12px]">
      {/* Parents row */}
      <div className="flex items-start justify-center gap-[16px]">
        {parents.length > 0 ? (
          parents.map((p) => (
            <PersonCard key={p.id} person={p} relationshipLabel={relationshipLabel(focus.id, p.id)} onClick={() => setFocus(p.id)} />
          ))
        ) : (
          <AddPersonTile label="Add parent" onClick={() => setAddModal("parent")} />
        )}
        {parents.length === 1 && <AddPersonTile label="Add parent" onClick={() => setAddModal("parent")} />}
      </div>

      {/* Focus row: siblings — focus — partners */}
      <div className="flex flex-wrap items-center justify-center gap-[16px]">
        {siblings.length > 0 && (
          <div className="flex flex-col items-center gap-[8px]">
            <p className="text-[10px] uppercase tracking-[0.5px] text-ink-mute">Siblings</p>
            <div className="flex flex-wrap justify-center gap-[8px]">
              {siblings.map((s) => (
                <PersonCard key={s.id} person={s} relationshipLabel={relationshipLabel(focus.id, s.id)} onClick={() => setFocus(s.id)} />
              ))}
            </div>
          </div>
        )}

        <div className="relative">
          <PersonCard person={focus} size="lg" />
          <button
            type="button"
            onClick={() => setEditing(focus)}
            aria-label="Edit"
            className="absolute -right-[8px] -top-[8px] flex h-[26px] w-[26px] items-center justify-center rounded-full border border-hairline bg-canvas text-ink-mute shadow-sm transition-colors hover:text-primary"
          >
            <PencilSimple size={13} weight="light" />
          </button>
        </div>

        <button
          type="button"
          onClick={() => setAddModal("sibling")}
          className="text-[11px] font-medium text-ink-mute transition-colors hover:text-primary"
        >
          + Sibling
        </button>

        <div className="flex flex-col items-center gap-[8px]">
          <p className="text-[10px] uppercase tracking-[0.5px] text-ink-mute">Partner</p>
          <div className="flex flex-wrap justify-center gap-[8px]">
            {partners.map((p) => (
              <PersonCard key={p.id} person={p} relationshipLabel={relationshipLabel(focus.id, p.id)} onClick={() => setFocus(p.id)} />
            ))}
            <AddPersonTile label="Add partner" onClick={() => setAddModal("partner")} />
          </div>
        </div>
      </div>

      {/* Children row — grouped by which union, when the focus has more than one */}
      <div className="flex flex-col items-center gap-[10px]">
        {partnerFamilies.length > 1 ? (
          partnerFamilies.map((f) => {
            const kids = childrenOf(focus.id, f.id);
            const otherId = f.partnerAId === focus.id ? f.partnerBId : f.partnerAId;
            const other = people.find((p) => p.id === otherId);
            return (
              <div key={f.id} className="flex flex-col items-center gap-[8px]">
                <p className="text-[10px] uppercase tracking-[0.5px] text-ink-mute">
                  With {other ? other.givenName : "unknown partner"}
                </p>
                <div className="flex flex-wrap justify-center gap-[16px]">
                  {kids.map((c) => (
                    <PersonCard key={c.id} person={c} relationshipLabel={relationshipLabel(focus.id, c.id)} onClick={() => setFocus(c.id)} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-wrap justify-center gap-[16px]">
            {childrenOf(focus.id).map((c) => (
              <PersonCard key={c.id} person={c} relationshipLabel={relationshipLabel(focus.id, c.id)} onClick={() => setFocus(c.id)} />
            ))}
          </div>
        )}
        <AddPersonTile label="Add child" onClick={() => setAddModal("child")} />
      </div>

      {addModal && (
        // Deliberately doesn't move focus to the newly added person —
        // the new card already appears in its slot on *this* view (local
        // state update, see PeopleProvider), so staying put lets someone
        // add several relatives to the same anchor in a row (e.g. both
        // parents, then a sibling) without the focus jumping out from
        // under them after each one. A caught-in-testing bug: this used
        // to call setFocus(id) here, which meant "add parent" silently
        // moved focus to the parent, so the next "add partner" click
        // attached to the wrong person.
        <AddRelativeModal anchorId={focus.id} relation={addModal} onClose={() => setAddModal(null)} onAdded={() => {}} />
      )}

      {editing && (
        <EditPersonModal
          person={editing}
          onClose={() => setEditing(null)}
          onDeleted={() => {
            setEditing(null);
            // The focused person no longer exists — fall back to
            // whoever's first in the tree rather than a dead focus id.
            const fallback = people.find((p) => p.id !== focus.id);
            router.push(fallback ? `/tree?focus=${fallback.id}` : "/tree");
          }}
        />
      )}
    </div>
  );
}
