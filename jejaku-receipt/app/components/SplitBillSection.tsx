"use client";

import { useState, type FormEvent } from "react";
import { Plus, Users, X } from "@phosphor-icons/react";
import { computeSplitTotals, formatCurrency, type ExpenseItem, type SplitData } from "../lib/expenses";

export default function SplitBillSection({
  items,
  tax,
  currency,
  value,
  onChange,
  alwaysOpen = false,
}: {
  items: ExpenseItem[];
  tax?: number;
  currency: string;
  value: SplitData;
  onChange: (next: SplitData) => void;
  /** Skips the collapsed "Split this bill" toggle button and its own
   * close control — for a host (like SplitBillModal) that's already a
   * dedicated split screen, so there's no need to open/collapse in place. */
  alwaysOpen?: boolean;
}) {
  const [personDraft, setPersonDraft] = useState("");
  const [open, setOpen] = useState(alwaysOpen || value.people.length > 0);

  const addPerson = (e?: FormEvent) => {
    e?.preventDefault();
    const name = personDraft.trim();
    if (!name || value.people.includes(name)) return;
    onChange({ ...value, people: [...value.people, name] });
    setPersonDraft("");
  };

  const removePerson = (name: string) => {
    onChange({
      people: value.people.filter((p) => p !== name),
      assignments: value.assignments.map((a) => ({ ...a, people: a.people.filter((p) => p !== name) })),
    });
  };

  const toggleAssignment = (itemIndex: number, person: string) => {
    const existing = value.assignments.find((a) => a.itemIndex === itemIndex);
    const currentlyIn = existing?.people.includes(person) ?? false;
    const nextPeople = currentlyIn
      ? (existing?.people ?? []).filter((p) => p !== person)
      : [...(existing?.people ?? []), person];
    const otherAssignments = value.assignments.filter((a) => a.itemIndex !== itemIndex);
    onChange({ ...value, assignments: [...otherAssignments, { itemIndex, people: nextPeople }] });
  };

  if (!alwaysOpen && !open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-[37px] w-fit items-center gap-[6px] rounded-pill border border-hairline-input bg-canvas px-[13px] text-[13px] font-medium text-ink transition-colors hover:bg-canvas-soft"
      >
        <Users size={14} weight="light" />
        Split this bill
      </button>
    );
  }

  const totals = computeSplitTotals(items, tax, value);

  return (
    <div className="flex flex-col gap-[11px] rounded-md border border-hairline-input p-[11px]">
      <div className="flex items-center justify-between gap-[8px]">
        <p className="flex items-center gap-[6px] text-[13px] font-medium text-ink">
          <Users size={14} weight="light" className="text-ink-mute" />
          Split this bill
        </p>
        {!alwaysOpen && value.people.length === 0 && (
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cancel split"
            className="flex h-[26px] w-[26px] items-center justify-center rounded-pill text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <X size={13} weight="light" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-[6px]">
        {value.people.map((person) => (
          <span
            key={person}
            className="flex items-center gap-[6px] rounded-pill bg-canvas-soft py-[5px] pl-[11px] pr-[6px] text-[12px] font-medium text-ink"
          >
            {person}
            <button
              type="button"
              onClick={() => removePerson(person)}
              aria-label={`Remove ${person}`}
              className="flex h-[16px] w-[16px] items-center justify-center rounded-pill text-ink-mute transition-colors hover:bg-hairline"
            >
              <X size={10} weight="bold" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-[6px]">
          <input
            type="text"
            value={personDraft}
            onChange={(e) => setPersonDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addPerson(e);
            }}
            placeholder="Add person"
            aria-label="Add person to split"
            className="h-[29px] w-[110px] rounded-sm border border-hairline-input bg-canvas px-[9px] text-[12px] text-ink focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={() => addPerson()}
            aria-label="Add person"
            className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-pill border border-hairline-input bg-canvas text-ink-mute transition-colors hover:bg-canvas-soft"
          >
            <Plus size={13} weight="light" />
          </button>
        </div>
      </div>

      {value.people.length === 0 ? (
        <p className="text-[12px] text-ink-mute">Add everyone sharing this receipt.</p>
      ) : items.length === 0 ? (
        <p className="text-[12px] text-ink-mute">Add items above to split by item.</p>
      ) : (
        <>
          <div className="flex flex-col gap-[8px]">
            {items.map((item, i) => {
              const assignment = value.assignments.find((a) => a.itemIndex === i);
              return (
                <div key={i} className="flex flex-wrap items-center justify-between gap-[6px]">
                  <p className="min-w-0 truncate text-[12px] text-ink">
                    {item.name || `Item ${i + 1}`}{" "}
                    <span className="tabular text-ink-mute">{formatCurrency(item.price, currency)}</span>
                  </p>
                  <div className="flex flex-wrap gap-[4px]">
                    {value.people.map((person) => {
                      const isIn = assignment?.people.includes(person) ?? false;
                      return (
                        <button
                          key={person}
                          type="button"
                          onClick={() => toggleAssignment(i, person)}
                          aria-pressed={isIn}
                          className={
                            isIn
                              ? "rounded-pill bg-primary px-[9px] py-[3px] text-[11px] font-medium text-on-primary"
                              : "rounded-pill border border-hairline-input px-[9px] py-[3px] text-[11px] text-ink-mute transition-colors hover:bg-canvas-soft"
                          }
                        >
                          {person}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-[4px] border-t border-hairline pt-[8px]">
            {value.people.map((person) => (
              <div key={person} className="flex items-center justify-between text-[12px]">
                <span className="text-ink">{person}</span>
                <span className="tabular font-medium text-ink">
                  {formatCurrency(totals.get(person) ?? 0, currency)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
