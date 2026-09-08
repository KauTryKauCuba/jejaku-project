"use client";

import { Plus, User } from "@phosphor-icons/react";
import { getInitials } from "../lib/initials";
import { displayName, type Person } from "../lib/people";

// One card everywhere in the tree UI — the focused person, a parent, a
// partner, a child, a sibling. `size` distinguishes the focused card
// (bigger, filled) from the surrounding relatives (smaller, outlined) so
// the eye finds the center of the view immediately.
export default function PersonCard({
  person,
  relationshipLabel,
  size = "sm",
  onClick,
}: {
  person: Person;
  relationshipLabel?: string | null;
  size?: "sm" | "lg";
  onClick?: () => void;
}) {
  const years = [person.birthDate?.match(/^\d{4}/)?.[0], person.isDeceased ? person.deathDate?.match(/^\d{4}/)?.[0] ?? "d." : null]
    .filter(Boolean)
    .join(person.isDeceased ? " – " : "");

  const isLg = size === "lg";

  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isLg
          ? "flex w-[168px] flex-col items-center gap-[8px] rounded-xl border-2 border-primary bg-canvas p-[14px] text-center shadow-sm transition-transform active:scale-[0.98]"
          : "flex w-[132px] flex-col items-center gap-[6px] rounded-lg border border-hairline-input bg-canvas p-[10px] text-center transition-colors hover:border-primary hover:bg-canvas-soft"
      }
    >
      <div
        className={
          isLg
            ? "flex h-[56px] w-[56px] items-center justify-center overflow-hidden rounded-full border border-hairline bg-canvas-soft text-[19px] font-medium text-primary-deep"
            : "flex h-[40px] w-[40px] items-center justify-center overflow-hidden rounded-full border border-hairline bg-canvas-soft text-[14px] font-medium text-primary-deep"
        }
      >
        {person.photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.photoUrl} alt="" className="h-full w-full object-cover" />
        ) : person.givenName ? (
          getInitials(displayName(person))
        ) : (
          <User size={isLg ? 24 : 18} weight="light" />
        )}
      </div>

      <div className="min-w-0">
        <p className={isLg ? "truncate text-[14px] font-medium text-ink" : "truncate text-[12px] font-medium text-ink"}>
          {displayName(person)}
        </p>
        {years && <p className="tabular text-[10px] text-ink-mute">{years}</p>}
        {relationshipLabel && <p className="mt-[2px] text-[10px] uppercase tracking-[0.5px] text-primary-soft">{relationshipLabel}</p>}
      </div>
    </button>
  );
}

// The dashed "+" tile used for every empty relative slot in the focus
// view — same visual language as an unfilled card, so the tree reads as
// "here's where a father would go" rather than a raw plus-icon button.
export function AddPersonTile({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-[132px] flex-col items-center justify-center gap-[6px] rounded-lg border border-dashed border-hairline-input bg-transparent p-[10px] text-center text-ink-mute transition-colors hover:border-primary hover:text-primary"
    >
      <span className="flex h-[40px] w-[40px] items-center justify-center rounded-full border border-dashed border-hairline-input">
        <Plus size={16} weight="bold" />
      </span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
