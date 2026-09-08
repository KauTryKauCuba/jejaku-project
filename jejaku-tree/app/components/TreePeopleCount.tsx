"use client";

import { usePeople } from "./PeopleProvider";

// Split out from the server-rendered page header specifically so this
// count stays live — a caught-in-testing bug: when this text was plain
// server-rendered output baked in at initial page load, it silently went
// stale the moment someone added a relative (the count doesn't move,
// even though PeopleProvider's client state and the tree on screen both
// updated correctly). Reading straight from usePeople() here means it
// can never drift from what's actually rendered below it.
export default function TreePeopleCount() {
  const { people } = usePeople();

  if (people.length === 0) {
    return <>Nobody on this tree yet.</>;
  }

  return (
    <>
      {people.length} {people.length === 1 ? "person" : "people"} on this tree. Click a card to focus it.
    </>
  );
}
