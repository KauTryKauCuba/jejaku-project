// One looping illustration per Quick Scan tutorial step, each acting out
// the thing that step asks the user to do. Same house style as
// ReceiptIllustration next door: inline SVG, SMIL <animate>, every color a
// CSS variable so the app's theme drives it. Text is real receipt/form
// content rather than placeholder bars, so each step reads as the actual
// data moving through the flow.

const SAMPLE = {
  merchant: "Nando's",
  items: [
    { name: "Chicken", price: "38.00" },
    { name: "Drinks", price: "9.30" },
  ],
  scannedTotal: "52.30",
  correctedTotal: "58.30",
  date: "2026-08-28",
  category: "Food & Drink",
  currency: "MYR",
};

// The receipt shared by every step, drawn in a 62 × 76 box so callers can
// place it with a single translate.
function ReceiptStrip({ total = SAMPLE.scannedTotal }: { total?: string }) {
  return (
    <>
      <path
        d="M4 0h54a4 4 0 0 1 4 4v72l-7.25-4.5-7.25 4.5-7.25-4.5-7.25 4.5-7.25-4.5-7.25 4.5-7.25-4.5L0 76V4a4 4 0 0 1 4-4Z"
        fill="var(--color-canvas)"
        stroke="var(--color-hairline)"
        strokeWidth="1.5"
      />
      <text x="31" y="14" textAnchor="middle" fontSize="7.5" fontWeight="500" fill="var(--color-ink)">
        {SAMPLE.merchant}
      </text>
      <line x1="8" y1="20" x2="54" y2="20" stroke="var(--color-hairline)" strokeWidth="1" />

      {SAMPLE.items.map((item, i) => (
        <g key={item.name}>
          <text x="8" y={31 + i * 10} fontSize="6.5" fill="var(--color-ink-mute)">
            {item.name}
          </text>
          <text x="54" y={31 + i * 10} textAnchor="end" fontSize="6.5" fill="var(--color-ink-mute)" className="tabular">
            {item.price}
          </text>
        </g>
      ))}

      <line x1="8" y1="46" x2="54" y2="46" stroke="var(--color-hairline)" strokeWidth="1" />
      <text x="8" y="57" fontSize="6.5" fontWeight="500" fill="var(--color-ink)">
        Total
      </text>
      <text x="54" y="57" textAnchor="end" fontSize="7.5" fontWeight="500" fill="var(--color-primary)" className="tabular">
        {total}
      </text>
    </>
  );
}

// Step 1 — the receipt slides into the viewfinder and the brackets lock on,
// which is the whole instruction: get it flat and fully inside the frame.
function FrameStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <g transform="translate(59 22)">
        <g>
          <animateTransform
            attributeName="transform"
            type="translate"
            values="-30 18; 0 0; 0 0; -30 18"
            keyTimes="0; 0.4; 0.88; 1"
            dur="3.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.22 1 0.36 1; 0 0 1 1; 0.4 0 0.6 1"
          />
          <ReceiptStrip />
        </g>
      </g>

      {/* Viewfinder brackets — dim until the receipt lands, then lock on. */}
      <g stroke="var(--color-ink)" strokeWidth="1.5" strokeLinecap="round" fill="none">
        <animate
          attributeName="opacity"
          values="0.3; 0.3; 1; 1; 0.3"
          keyTimes="0; 0.38; 0.5; 0.88; 1"
          dur="3.6s"
          repeatCount="indefinite"
        />
        <path d="M48 32V17a5 5 0 0 1 5-5h15" />
        <path d="M132 32V17a5 5 0 0 0-5-5h-15" />
        <path d="M48 88v15a5 5 0 0 0 5 5h15" />
        <path d="M132 88v15a5 5 0 0 1-5 5h-15" />
      </g>
    </svg>
  );
}

// Step 2 — the beam sweeps the receipt and each field it reads lands beside
// it: the photo turning into the values that will fill the form.
const READ_FIELDS = [
  { label: "Merchant", value: SAMPLE.merchant, y: 26, appearAt: 0.34 },
  { label: "Amount", value: `${SAMPLE.currency} ${SAMPLE.scannedTotal}`, y: 50, appearAt: 0.5 },
  { label: "Date", value: SAMPLE.date, y: 74, appearAt: 0.66 },
];

function ReadStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <g transform="translate(12 22)">
        <ReceiptStrip />
      </g>

      {/* Scan beam travelling down the receipt. */}
      <rect x="10" y="21" width="66" height="2.5" rx="1.25" fill="var(--color-primary-soft)" opacity="0.55">
        <animate
          attributeName="y"
          values="21; 94; 94; 21"
          keyTimes="0; 0.72; 0.9; 1"
          dur="3.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.4 0 0.2 1; 0 0 1 1; 0.4 0 0.2 1"
        />
      </rect>

      {/* Fields read off the receipt, each landing as the beam passes. */}
      {READ_FIELDS.map((f) => (
        <g key={f.label}>
          <animate
            attributeName="opacity"
            values="0; 0; 1; 1; 0"
            keyTimes={`0; ${f.appearAt}; ${f.appearAt + 0.06}; 0.9; 1`}
            dur="3.6s"
            repeatCount="indefinite"
          />
          <rect
            x="88"
            y={f.y}
            width="84"
            height="20"
            rx="6"
            fill="var(--color-canvas)"
            stroke="var(--color-primary-subdued)"
            strokeWidth="1.5"
          />
          <text x="96" y={f.y + 13} fontSize="6" fill="var(--color-ink-mute)">
            {f.label}
          </text>
          <text
            x="164"
            y={f.y + 13}
            textAnchor="end"
            fontSize="7"
            fontWeight="500"
            fill="var(--color-ink)"
            className="tabular"
          >
            {f.value}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Step 3 — the pre-filled form, where the amount takes focus and gets
// corrected: exactly the check this step asks the user to make.
const FORM_ROWS = [
  { label: "Merchant", value: SAMPLE.merchant, y: 22 },
  { label: "Amount", value: SAMPLE.scannedTotal, y: 50 },
  { label: "Date", value: SAMPLE.date, y: 78 },
];

function CheckStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      <rect
        x="20"
        y="10"
        width="140"
        height="100"
        rx="8"
        fill="var(--color-canvas)"
        stroke="var(--color-hairline)"
        strokeWidth="1.5"
      />

      {FORM_ROWS.map((row, i) => (
        <g key={row.label}>
          <text x="32" y={row.y} fontSize="6.5" fontWeight="500" fill="var(--color-ink)">
            {row.label}
          </text>
          <rect
            x="32"
            y={row.y + 5}
            width="116"
            height="17"
            rx="5"
            fill="var(--color-canvas)"
            stroke="var(--color-hairline-input)"
            strokeWidth="1.5"
          />
          {/* The amount is the one being corrected, so its value is drawn
              by the cross-fading pair below instead. */}
          {i !== 1 && (
            <text x="40" y={row.y + 17} fontSize="7" fill="var(--color-ink)" className="tabular">
              {row.value}
            </text>
          )}
        </g>
      ))}

      {/* Focus ring on the amount field — the form's real focus state. */}
      <rect x="32" y="55" width="116" height="17" rx="5" fill="none" stroke="var(--color-primary)" strokeWidth="1.5">
        <animate
          attributeName="opacity"
          values="0; 0; 1; 1; 0; 0"
          keyTimes="0; 0.16; 0.26; 0.82; 0.92; 1"
          dur="3.6s"
          repeatCount="indefinite"
        />
      </rect>

      {/* Scanned value, replaced by the corrected one partway through. */}
      <text x="40" y="67" fontSize="7" fill="var(--color-ink)" className="tabular">
        <animate
          attributeName="opacity"
          values="1; 1; 0; 0; 1"
          keyTimes="0; 0.42; 0.5; 0.9; 1"
          dur="3.6s"
          repeatCount="indefinite"
        />
        {SAMPLE.scannedTotal}
      </text>
      <text x="40" y="67" fontSize="7" fontWeight="500" fill="var(--color-primary)" className="tabular">
        <animate
          attributeName="opacity"
          values="0; 0; 1; 1; 0"
          keyTimes="0; 0.42; 0.5; 0.9; 1"
          dur="3.6s"
          repeatCount="indefinite"
        />
        {SAMPLE.correctedTotal}
      </text>

      {/* Caret parked at the end of the value being corrected. The group
          carries the show/hide envelope and the rect inside it does the
          blink — two opacity animations on one element would conflict. */}
      <g>
        <animate
          attributeName="opacity"
          values="0; 0; 1; 1; 0; 0"
          keyTimes="0; 0.24; 0.32; 0.84; 0.9; 1"
          dur="3.6s"
          repeatCount="indefinite"
        />
        <rect x="62" y="59" width="1.5" height="10" rx="0.75" fill="var(--color-primary)">
          <animate attributeName="opacity" values="1;1;0;0;1" dur="1.1s" repeatCount="indefinite" />
        </rect>
      </g>
    </svg>
  );
}

// Step 4 — the receipt drops into the list and lands as a real row, in the
// same layout the receipts list actually uses.
function SaveStep() {
  return (
    <svg width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
      {/* Receipt falling into the list below. */}
      <g transform="translate(71 0)">
        <g opacity="0">
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 22; 0 22; 0 0"
            keyTimes="0; 0.34; 0.9; 1"
            dur="3.6s"
            repeatCount="indefinite"
            calcMode="spline"
            keySplines="0.5 0 0.75 0; 0 0 1 1; 0 0 1 1"
          />
          <animate
            attributeName="opacity"
            values="0; 1; 1; 0; 0"
            keyTimes="0; 0.1; 0.28; 0.36; 1"
            dur="3.6s"
            repeatCount="indefinite"
          />
          <g transform="scale(0.55)">
            <ReceiptStrip total={SAMPLE.correctedTotal} />
          </g>
        </g>
      </g>

      {/* The receipts list. */}
      <rect
        x="12"
        y="52"
        width="156"
        height="58"
        rx="8"
        fill="var(--color-canvas)"
        stroke="var(--color-hairline)"
        strokeWidth="1.5"
      />

      {/* Saved receipt landing at the top of the list. */}
      <g>
        <animate
          attributeName="opacity"
          values="0; 0; 1; 1; 0"
          keyTimes="0; 0.34; 0.44; 0.9; 1"
          dur="3.6s"
          repeatCount="indefinite"
        />
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0 -8; 0 0; 0 0"
          keyTimes="0; 0.46; 1"
          dur="3.6s"
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.22 1 0.36 1; 0 0 1 1"
        />
        <rect x="20" y="60" width="15" height="15" rx="4" fill="var(--color-canvas-soft)" />
        <text x="41" y="66" fontSize="7" fontWeight="500" fill="var(--color-ink)">
          {SAMPLE.merchant}
        </text>
        <text x="41" y="74" fontSize="5.5" fill="var(--color-ink-mute)">
          {SAMPLE.category} · {SAMPLE.date}
        </text>
        <text x="160" y="70" textAnchor="end" fontSize="7" fontWeight="500" fill="var(--color-ink)" className="tabular">
          {SAMPLE.currency} {SAMPLE.correctedTotal}
        </text>
      </g>

      {/* The receipt already in the list underneath. */}
      <g opacity="0.4">
        <line x1="20" y1="83" x2="160" y2="83" stroke="var(--color-hairline)" strokeWidth="1" />
        <rect x="20" y="88" width="15" height="15" rx="4" fill="var(--color-canvas-soft)" />
        <text x="41" y="94" fontSize="7" fontWeight="500" fill="var(--color-ink)">
          IKEA
        </text>
        <text x="41" y="102" fontSize="5.5" fill="var(--color-ink-mute)">
          Home &amp; Furniture · 2026-08-27
        </text>
        <text x="160" y="98" textAnchor="end" fontSize="7" fontWeight="500" fill="var(--color-ink)" className="tabular">
          MYR 245.00
        </text>
      </g>
    </svg>
  );
}

const STEP_ILLUSTRATIONS = [FrameStep, ReadStep, CheckStep, SaveStep];

export default function ScanStepIllustration({ step }: { step: number }) {
  const Illustration = STEP_ILLUSTRATIONS[step];
  return <Illustration />;
}
