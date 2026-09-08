"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tree } from "@phosphor-icons/react";
import { usePeople } from "./PeopleProvider";
import FormField from "./FormField";
import Select from "./Select";
import { SEX_VALUES, type Sex } from "../lib/people";

// Shown instead of the focus view when the tree has no one in it yet —
// every card after this one is added via the "+" tiles in TreeFocusView,
// but that view has nothing to focus on until at least one person exists.
export default function StartTreeCard() {
  const router = useRouter();
  const { createFirstPerson } = usePeople();

  const [givenName, setGivenName] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [sex, setSex] = useState<Sex>("unknown");
  const [error, setError] = useState<string | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!givenName.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      const person = await createFirstPerson({ givenName, familyName: familyName || undefined, sex });
      router.push(`/tree?focus=${person.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't create that person.");
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-[420px] flex-col items-center gap-[8px] rounded-lg border border-dashed border-hairline-input bg-canvas p-[28px] text-center">
      <Tree size={26} weight="light" className="text-ink-mute" />
      <p className="text-[15px] font-medium text-ink">Start your tree</p>
      <p className="max-w-sm text-[12px] leading-relaxed text-ink-mute">
        Add yourself, or the relative you want to build outward from — everyone else gets added as a parent, partner, child, or sibling
        of someone already on the tree.
      </p>

      <form
        className="mt-[10px] flex w-full flex-col gap-[10px] text-left"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <div className="grid grid-cols-2 gap-[10px]">
          <FormField id="startGivenName" label="Given name" value={givenName} onChange={setGivenName} />
          <FormField id="startFamilyName" label="Family name" value={familyName} onChange={setFamilyName} />
        </div>
        <div>
          <label htmlFor="startSex" className="text-[13px] font-medium text-ink">
            Sex
          </label>
          <div className="mt-[8px]">
            <Select id="startSex" value={sex} options={SEX_VALUES} onChange={setSex} />
          </div>
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="mt-[4px] flex h-[37px] w-full items-center justify-center rounded-pill bg-primary text-[14px] font-medium text-on-primary transition-transform active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Creating…" : "Start tree"}
        </button>
      </form>
    </div>
  );
}
