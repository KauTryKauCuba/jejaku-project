"use client";

import { useState } from "react";
import Modal from "./Modal";
import FormField from "./FormField";
import Select from "./Select";
import { usePeople, NeedsFamilyChoiceError, type AddRelativeRelation } from "./PeopleProvider";
import { SEX_VALUES, type PersonInput, type Sex } from "../lib/people";

const RELATION_COPY: Record<AddRelativeRelation, { title: string; helper: string }> = {
  parent: { title: "Add a parent", helper: "Their father or mother." },
  partner: { title: "Add a partner", helper: "A spouse or partner." },
  child: { title: "Add a child", helper: "Their son or daughter." },
  sibling: { title: "Add a sibling", helper: "A brother or sister." },
};

// One modal used for all four relative types (see RELATION_COPY) — the
// only thing that varies is the copy and, for "child" on someone with
// more than one partner, an extra step asking which union the child
// belongs to (server-driven via NeedsFamilyChoiceError, not guessed
// client-side).
export default function AddRelativeModal({
  anchorId,
  relation,
  onClose,
  onAdded,
}: {
  anchorId: string;
  relation: AddRelativeRelation;
  onClose: () => void;
  onAdded: (personId: string) => void;
}) {
  const { addRelative } = usePeople();

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [sex, setSex] = useState<Sex>("unknown");
  const [birthDate, setBirthDate] = useState("");
  const [isDeceased, setIsDeceased] = useState(false);
  const [deathDate, setDeathDate] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [familyChoices, setFamilyChoices] = useState<{ id: string; otherPartnerName: string | null }[] | null>(null);

  const copy = RELATION_COPY[relation];

  const submit = async (familyId?: string) => {
    if (!givenName.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(undefined);

    const input: PersonInput = {
      givenName,
      familyName: familyName || undefined,
      sex,
      birthDate: birthDate || undefined,
      isDeceased,
      deathDate: isDeceased ? deathDate || undefined : undefined,
    };

    try {
      const person = await addRelative(anchorId, relation, input, familyId);
      onAdded(person.id);
      onClose();
    } catch (err) {
      if (err instanceof NeedsFamilyChoiceError) {
        setFamilyChoices(err.families);
        setSaving(false);
        return;
      }
      setError(err instanceof Error ? err.message : "Couldn't add that person.");
      setSaving(false);
    }
  };

  if (familyChoices) {
    return (
      <Modal title="Which family?" onClose={onClose}>
        <p className="text-[13px] text-ink-mute">This person has more than one partner — which union is this child part of?</p>
        <div className="mt-[14px] flex flex-col gap-[8px]">
          {familyChoices.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => submit(f.id)}
              disabled={saving}
              className="rounded-sm border border-hairline-input px-[12px] py-[9px] text-left text-[14px] text-ink transition-colors hover:border-primary hover:bg-canvas-soft disabled:opacity-60"
            >
              With {f.otherPartnerName ?? "unknown partner"}
            </button>
          ))}
        </div>
        {error && <p className="mt-[10px] text-[12px] text-error">{error}</p>}
      </Modal>
    );
  }

  return (
    <Modal title={copy.title} onClose={onClose}>
      <p className="text-[13px] text-ink-mute">{copy.helper}</p>

      <form
        className="mt-[14px] flex flex-col gap-[12px]"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-2 gap-[10px]">
          <FormField id="givenName" label="Given name" value={givenName} onChange={setGivenName} />
          <FormField id="familyName" label="Family name" value={familyName} onChange={setFamilyName} />
        </div>

        <div>
          <label htmlFor="sex" className="text-[13px] font-medium text-ink">
            Sex
          </label>
          <div className="mt-[8px]">
            <Select id="sex" value={sex} options={SEX_VALUES} onChange={setSex} />
          </div>
        </div>

        <FormField id="birthDate" label="Birth date (or just a year)" placeholder="1952 or 1952-08-14" value={birthDate} onChange={setBirthDate} />

        <label className="flex items-center gap-[8px] text-[13px] text-ink">
          <input type="checkbox" checked={isDeceased} onChange={(e) => setIsDeceased(e.target.checked)} className="h-[15px] w-[15px]" />
          Deceased
        </label>

        {isDeceased && <FormField id="deathDate" label="Death date (or just a year)" value={deathDate} onChange={setDeathDate} />}

        {error && <p className="text-[12px] text-error">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-[4px] flex h-[37px] w-full items-center justify-center rounded-pill bg-primary text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Saving…" : "Add"}
        </button>
      </form>
    </Modal>
  );
}
