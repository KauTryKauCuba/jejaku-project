"use client";

import { useState } from "react";
import Modal from "./Modal";
import FormField from "./FormField";
import Select from "./Select";
import { usePeople } from "./PeopleProvider";
import { SEX_VALUES, type Person, type PersonInput, type Sex } from "../lib/people";

export default function EditPersonModal({ person, onClose, onDeleted }: { person: Person; onClose: () => void; onDeleted: () => void }) {
  const { updatePerson, deletePerson } = usePeople();

  const [givenName, setGivenName] = useState(person.givenName);
  const [familyName, setFamilyName] = useState(person.familyName ?? "");
  const [sex, setSex] = useState<Sex>(person.sex);
  const [birthDate, setBirthDate] = useState(person.birthDate ?? "");
  const [isDeceased, setIsDeceased] = useState(person.isDeceased);
  const [deathDate, setDeathDate] = useState(person.deathDate ?? "");
  const [birthPlace, setBirthPlace] = useState(person.birthPlace ?? "");
  const [occupation, setOccupation] = useState(person.occupation ?? "");
  const [note, setNote] = useState(person.note ?? "");
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const save = async () => {
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
      birthPlace: birthPlace || undefined,
      occupation: occupation || undefined,
      note: note || undefined,
    };

    try {
      await updatePerson(person.id, input);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save changes.");
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      await deletePerson(person.id);
      onDeleted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't delete this person.");
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit person" onClose={onClose}>
      <form
        className="flex flex-col gap-[12px]"
        onSubmit={(e) => {
          e.preventDefault();
          save();
        }}
      >
        <div className="grid grid-cols-2 gap-[10px]">
          <FormField id="editGivenName" label="Given name" value={givenName} onChange={setGivenName} />
          <FormField id="editFamilyName" label="Family name" value={familyName} onChange={setFamilyName} />
        </div>

        <div>
          <label htmlFor="editSex" className="text-[13px] font-medium text-ink">
            Sex
          </label>
          <div className="mt-[8px]">
            <Select id="editSex" value={sex} options={SEX_VALUES} onChange={setSex} />
          </div>
        </div>

        <FormField id="editBirthDate" label="Birth date (or just a year)" value={birthDate} onChange={setBirthDate} />
        <FormField id="editBirthPlace" label="Birthplace" value={birthPlace} onChange={setBirthPlace} />
        <FormField id="editOccupation" label="Occupation" value={occupation} onChange={setOccupation} />

        <label className="flex items-center gap-[8px] text-[13px] text-ink">
          <input type="checkbox" checked={isDeceased} onChange={(e) => setIsDeceased(e.target.checked)} className="h-[15px] w-[15px]" />
          Deceased
        </label>
        {isDeceased && <FormField id="editDeathDate" label="Death date (or just a year)" value={deathDate} onChange={setDeathDate} />}

        <div className="flex flex-col gap-[8px]">
          <label htmlFor="editNote" className="text-[13px] font-medium text-ink">
            Note
          </label>
          <textarea
            id="editNote"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={3}
            className="resize-none rounded-sm border border-hairline-input bg-canvas px-[11px] py-[8px] text-[14px] text-ink outline-none transition-colors focus:border-primary"
          />
        </div>

        {error && <p className="text-[12px] text-error">{error}</p>}

        <div className="mt-[4px] flex gap-[8px]">
          <button
            type="submit"
            disabled={saving}
            className="flex h-[37px] flex-1 items-center justify-center rounded-pill bg-primary text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {!confirmingDelete ? (
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={saving}
              className="flex h-[37px] items-center justify-center rounded-pill border border-error px-[16px] text-[14px] font-medium text-error transition-colors hover:bg-error/5 disabled:opacity-60"
            >
              Delete
            </button>
          ) : (
            <button
              type="button"
              onClick={confirmDelete}
              disabled={saving}
              className="flex h-[37px] items-center justify-center rounded-pill bg-error px-[16px] text-[14px] font-medium text-on-primary transition-colors disabled:opacity-60"
            >
              Confirm delete
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
