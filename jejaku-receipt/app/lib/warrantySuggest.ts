// A rough, purely local guess at coverage length from an item's name —
// offered as a pre-filled starting point next to the per-item warranty
// toggle in ExpenseForm, never applied on its own (the user still has to
// tap the toggle to actually tag the item). No AI call: a keyword match
// against the receipt-printed name can't tell a $3 generic cable from a
// $25 branded one carrying a real 18-month warranty, or a disposable phone
// case from a laptop bag that comes with one — it's a starting point to
// confirm or change, not a lookup of the item's real coverage. Keep the
// UI copy that surfaces this ("Estimated — check yours") honest about
// that; see the coverage-length Select in ExpenseForm.
type Rule = { keywords: string[]; months: number | undefined };

const RULES: Rule[] = [
  // Recognized, but no real expectation of a warranty on something this
  // cheap/disposable — `months: undefined` here means "matched, and the
  // guess is: don't bother," not "no rule matched."
  {
    keywords: ["case", "cover", "cable", "strap", "screen protector", "sticker", "pouch", "bag"],
    months: undefined,
  },
  // Small appliances: commonly sold with 12 months.
  {
    keywords: [
      "kettle",
      "blender",
      "toaster",
      "iron",
      "fan",
      "rice cooker",
      "air fryer",
      "microwave",
      "vacuum",
      "mixer",
      "grinder",
    ],
    months: 12,
  },
  // Consumer electronics: commonly 12, sometimes 24 — default to the safer
  // floor rather than promise coverage that may not apply.
  {
    keywords: [
      "laptop",
      "phone",
      "tablet",
      "tv",
      "television",
      "monitor",
      "camera",
      "speaker",
      "headphone",
      "earphone",
      "earbud",
      "console",
      "router",
      "printer",
    ],
    months: 12,
  },
  // Big-ticket appliances often carry longer coverage.
  {
    keywords: ["refrigerator", "fridge", "washing machine", "washer", "dryer", "air conditioner", "aircond"],
    months: 24,
  },
];

export function suggestWarrantyMonths(itemName: string): number | undefined {
  const name = itemName.trim().toLowerCase();
  if (!name) return undefined;
  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => name.includes(keyword))) return rule.months;
  }
  return undefined;
}
