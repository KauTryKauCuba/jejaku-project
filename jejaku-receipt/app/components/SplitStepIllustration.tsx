// One looping illustration per Quick Split tutorial step, mirroring the
// real split screens (the receipt picker, the people pills, the per-item
// toggles, the per-person totals). Same house style as
// ScanStepIllustration: inline SVG, SMIL <animate>, CSS variables for color.
//
// The worked example continues the Quick Scan tutorial's receipt — Nando's,
// Chicken 38.00 + Drinks 9.30, 5.00 tax, 52.30 total — and every figure
// below is what computeSplitTotals actually returns for it: Chicken shared,
// Drinks on Ben alone, giving Aina 21.01 and Ben 31.29.

const SPLIT = {
  merchant: "Nando's",
  currency: "MYR",
  total: "52.30",
  date: "2026-08-28",
  category: "Food & Drink",
  people: ["Aina", "Ben"],
  items: [
    { name: "Chicken", price: "38.00", sharedBy: ["Aina", "Ben"] },
    { name: "Drinks", price: "9.30", sharedBy: ["Ben"] },
  ],
  tax: "5.00",
  // Per-person: what they ordered, the tax that rides on it, the total.
  owed: [
    { person: "Aina", tax: "2.01", total: "21.01" },
    { person: "Ben", tax: "2.99", total: "31.29" },
  ],
};

// Keeps computed keyTimes off floating-point tails like 0.38000000000000006.
const at = (n: number) => n.toFixed(2);

// Step 1 — the receipt picker Quick Split opens on. The pick lands on the
// receipt that has items; the one without is dimmed and unpickable.
const PICKER_ROWS = [
  { merchant: SPLIT.merchant, meta: "2 items", amount: `${SPLIT.currency} ${SPLIT.total}`, pickable: true },
  { merchant: "Ippudo", meta: "3 items", amount: "SGD 64.50", pickable: true },
  { merchant: "Petronas", meta: "No items to split", amount: "MYR 85.00", pickable: false },
];

function PickStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <text x="12" y="14" fontSize="6.5" fill="var(--color-ink-mute)">
        Pick a receipt to split.
      </text>

      {/* The pick settling on the first row. */}
      <rect x="8" y="20" width="164" height="26" rx="6" fill="var(--color-canvas-soft)">
        <animate
          attributeName="opacity"
          values="0; 0; 1; 1; 0"
          keyTimes="0; 0.24; 0.36; 0.88; 1"
          dur="4s"
          repeatCount="indefinite"
        />
      </rect>

      {PICKER_ROWS.map((row, i) => (
        <g key={row.merchant} opacity={row.pickable ? 1 : 0.4}>
          <text x="16" y={i * 28 + 31} fontSize="7.5" fontWeight="500" fill="var(--color-ink)">
            {row.merchant}
          </text>
          <text x="16" y={i * 28 + 40} fontSize="5.5" fill="var(--color-ink-mute)">
            {row.meta}
          </text>
          <text
            x="164"
            y={i * 28 + 36}
            textAnchor="end"
            fontSize="7"
            fontWeight="500"
            fill="var(--color-ink)"
            className="tabular"
          >
            {row.amount}
          </text>
          {i > 0 && (
            <line x1="16" y1={i * 28 + 20} x2="164" y2={i * 28 + 20} stroke="var(--color-hairline)" strokeWidth="1" />
          )}
        </g>
      ))}
    </svg>
  );
}

// Step 2 — the people pills, added one at a time from the "Add person"
// field, exactly as the split panel builds them.
const PILL_X = [12, 58];

function PeopleStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <text x="12" y="24" fontSize="7" fontWeight="500" fill="var(--color-ink)">
        Split this bill
      </text>

      {/* Each name lands in turn. */}
      {SPLIT.people.map((person, i) => (
        <g key={person}>
          <animate
            attributeName="opacity"
            values="0; 0; 1; 1; 0"
            keyTimes={`0; ${at(0.2 + i * 0.18)}; ${at(0.28 + i * 0.18)}; 0.9; 1`}
            dur="4s"
            repeatCount="indefinite"
          />
          <rect x={PILL_X[i]} y="38" width="42" height="18" rx="9" fill="var(--color-canvas-soft)" />
          <text x={PILL_X[i] + 11} y="50" fontSize="7" fontWeight="500" fill="var(--color-ink)">
            {person}
          </text>
          <text x={PILL_X[i] + 34} y="50" fontSize="7" fill="var(--color-ink-mute)">
            ×
          </text>
        </g>
      ))}

      {/* The "Add person" field and its + button. */}
      <rect
        x="12"
        y="66"
        width="76"
        height="20"
        rx="5"
        fill="var(--color-canvas)"
        stroke="var(--color-hairline-input)"
        strokeWidth="1.5"
      />
      <text x="20" y="79" fontSize="6.5" fill="var(--color-ink-mute)">
        Add person
      </text>
      <circle cx="99" cy="76" r="10" fill="var(--color-canvas)" stroke="var(--color-hairline-input)" strokeWidth="1.5" />
      <path d="M99 71v10M94 76h10" stroke="var(--color-ink-mute)" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Step 3 — tagging who had what: the per-item toggles fill in one by one.
// Chicken goes to both, Drinks to Ben alone.
function TagStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      {SPLIT.items.map((item, itemIndex) => {
        const rowY = 30 + itemIndex * 34;
        return (
          <g key={item.name}>
            <text x="12" y={rowY} fontSize="7" fill="var(--color-ink)">
              {item.name}
            </text>
            <text x="52" y={rowY} fontSize="6.5" fill="var(--color-ink-mute)" className="tabular">
              {item.price}
            </text>

            {SPLIT.people.map((person, personIndex) => {
              const isIn = item.sharedBy.includes(person);
              const x = 96 + personIndex * 40;
              // Filled toggles land in reading order: row 1 then row 2.
              const lands = 0.24 + (itemIndex * 2 + personIndex) * 0.12;
              return (
                <g key={person}>
                  {/* Unselected outline sits underneath the whole time. */}
                  <rect
                    x={x}
                    y={rowY - 9}
                    width="36"
                    height="14"
                    rx="7"
                    fill="var(--color-canvas)"
                    stroke="var(--color-hairline-input)"
                    strokeWidth="1.5"
                  />
                  <text x={x + 18} y={rowY + 1} textAnchor="middle" fontSize="6" fill="var(--color-ink-mute)">
                    {person}
                  </text>

                  {isIn && (
                    <g>
                      <animate
                        attributeName="opacity"
                        values="0; 0; 1; 1; 0"
                        keyTimes={`0; ${at(lands)}; ${at(lands + 0.06)}; 0.9; 1`}
                        dur="4s"
                        repeatCount="indefinite"
                      />
                      <rect x={x} y={rowY - 9} width="36" height="14" rx="7" fill="var(--color-primary)" />
                      <text
                        x={x + 18}
                        y={rowY + 1}
                        textAnchor="middle"
                        fontSize="6"
                        fontWeight="500"
                        fill="var(--color-on-primary)"
                      >
                        {person}
                      </text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

// Step 4 — the payoff: tax rides along in proportion to what each person
// ordered, so the two shares are uneven and still add up to the receipt.
function TaxStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <text x="12" y="20" fontSize="6.5" fill="var(--color-ink-mute)">
        Tax
      </text>
      <text x="34" y="20" fontSize="6.5" fill="var(--color-ink)" className="tabular">
        {SPLIT.currency} {SPLIT.tax}
      </text>
      <text x="168" y="20" textAnchor="end" fontSize="6" fill="var(--color-ink-mute)">
        split by what each ordered
      </text>
      <line x1="12" y1="28" x2="168" y2="28" stroke="var(--color-hairline)" strokeWidth="1" />

      {SPLIT.owed.map((row, i) => {
        const y = 48 + i * 30;
        return (
          <g key={row.person}>
            <text x="12" y={y} fontSize="7.5" fontWeight="500" fill="var(--color-ink)">
              {row.person}
            </text>
            <text x="168" y={y} textAnchor="end" fontSize="8" fontWeight="500" fill="var(--color-ink)" className="tabular">
              {SPLIT.currency} {row.total}
            </text>
            {/* The tax slice each person carries, landing in turn. */}
            <g>
              <animate
                attributeName="opacity"
                values="0; 0; 1; 1; 0"
                keyTimes={`0; ${at(0.3 + i * 0.16)}; ${at(0.38 + i * 0.16)}; 0.9; 1`}
                dur="4s"
                repeatCount="indefinite"
              />
              <text x="12" y={y + 10} fontSize="6" fill="var(--color-primary)" className="tabular">
                + {row.tax} tax
              </text>
            </g>
          </g>
        );
      })}

      <line x1="12" y1="104" x2="168" y2="104" stroke="var(--color-hairline)" strokeWidth="1" />
      <text x="12" y="114" fontSize="6" fill="var(--color-ink-mute)">
        Adds up to
      </text>
      <text x="168" y="114" textAnchor="end" fontSize="6.5" fontWeight="500" fill="var(--color-ink)" className="tabular">
        {SPLIT.currency} {SPLIT.total}
      </text>
    </svg>
  );
}

// Step 5 — saving: the split is recorded on the receipt, which keeps its
// own details and just picks up the "Split 2 ways" note in the list.
function SaveSplitStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      {/* The real primary "Save split" button, pressed. Drawn around its own
          origin so the scale presses toward its centre, not the corner. */}
      <g transform="translate(90 27)">
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            values="1; 1; 0.97; 1; 1"
            keyTimes="0; 0.3; 0.38; 0.46; 1"
            dur="4s"
            repeatCount="indefinite"
          />
          <rect x="-78" y="-11" width="156" height="22" rx="11" fill="var(--color-primary)" />
          <text x="0" y="4" textAnchor="middle" fontSize="7.5" fontWeight="500" fill="var(--color-on-primary)">
            Save split
          </text>
        </g>
      </g>

      {/* The receipt row it lands on, now carrying the split note. */}
      <rect
        x="12"
        y="54"
        width="156"
        height="46"
        rx="8"
        fill="var(--color-canvas)"
        stroke="var(--color-hairline)"
        strokeWidth="1.5"
      />
      <rect x="20" y="64" width="15" height="15" rx="4" fill="var(--color-canvas-soft)" />
      <text x="41" y="70" fontSize="7" fontWeight="500" fill="var(--color-ink)">
        {SPLIT.merchant}
      </text>
      <text x="41" y="78" fontSize="5.5" fill="var(--color-ink-mute)">
        {SPLIT.category} · {SPLIT.date}
      </text>
      <text x="160" y="74" textAnchor="end" fontSize="7" fontWeight="500" fill="var(--color-ink)" className="tabular">
        {SPLIT.currency} {SPLIT.total}
      </text>

      <g>
        <animate
          attributeName="opacity"
          values="0; 0; 1; 1; 0"
          keyTimes="0; 0.46; 0.56; 0.9; 1"
          dur="4s"
          repeatCount="indefinite"
        />
        <rect x="41" y="84" width="52" height="11" rx="5.5" fill="var(--color-primary-subdued)" />
        <text x="67" y="92" textAnchor="middle" fontSize="5.5" fontWeight="500" fill="var(--color-primary-deep)">
          Split 2 ways
        </text>
      </g>
    </svg>
  );
}

const STEP_ILLUSTRATIONS = [PickStep, PeopleStep, TagStep, TaxStep, SaveSplitStep];

export default function SplitStepIllustration({ step }: { step: number }) {
  const Illustration = STEP_ILLUSTRATIONS[step];
  return <Illustration />;
}
