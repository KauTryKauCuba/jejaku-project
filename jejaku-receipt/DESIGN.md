# Jejaku Design Language

## Overview

Jejaku Receipt's marketing pages (landing, roadmap, onboarding) follow Jejaku's own quiet, editorial, light-on-chrome language — gradient hero, flat bordered cards, a pill-shaped auth/onboarding card. The signed-in `/dashboard`, however, is a real product surface, not a portfolio page: it's a proper sidebar + navbar app shell, since this is the one place on either site where "dashboard" isn't just a word — the app actually does something (scan a receipt). See **Dashboard Shell** below; everywhere else, the marketing-page rules still apply: no pricing tables, no dark "product UI" surfaces, gradient mesh confined to a hero band.

The color system centers on **Blue** (`{colors.primary}` — `#1d4ed8`), used sparingly for the single filled pill button per section and for link/label emphasis. **Deep blue-black ink** (`{colors.ink}` — `#0a1826`) is the body text color everywhere — never pure black. Amber, sky-blue, and citrine live only inside the animated gradient mesh blobs and the `IconFlowBadge` accent lines; they never appear as button or text colors.

Typography runs on **Inter** (`next/font/google`, weights 300/400/500/600) with the `ss01` stylistic set enabled globally on `<body>`. Headlines render at weight 300 (font-light) with tight negative tracking; UI text (nav, labels, buttons) sits at 400–600. Numeric/tabular values use the `.tabular` utility (`tnum` + tightened tracking).

**Key Characteristics:**
- Gradient mesh confined to the hero band only (header + first section) — the rest of every page is flat white or `{colors.canvas-soft}`/`{colors.canvas-cream}`.
- Mesh is **animated**: three blurred radial blobs drift slowly (22–30s ease-in-out loops), disabled entirely under `prefers-reduced-motion`.
- Single filled `{colors.primary}` pill button per view; secondary actions are outline or plain-text links.
- Flat, shadow-free bordered cards (`card-content-flat`) are the workhorse container — used for auth, onboarding, projects, values, specs, and stack grids alike.
- `IconFlowBadge`: a small rounded-square icon tile with faint animated flow-lines behind the icon, used as the leading visual in every card grid.
- Scroll-locked tab section (`ValuesSpecsTabs`): mouse-wheel scroll near the section temporarily hijacks scrolling to step through tabs before releasing.
- Auth/onboarding pattern: compact bordered card, eyebrow label with icon, Google button + divider + email-OTP form, or a name/avatar form — never a full-page auth screen.
- Cream interlude band (`{colors.canvas-cream}`) as a short, centered, text-only pause between sections.
- `/dashboard` breaks from the rest of the site: a persistent sidebar + navbar app shell (see **Dashboard Shell**) instead of the marketing header/footer.
- Cross-app session handoff with Jejaku: signing in on Jejaku carries the profile into Jejaku Receipt via a one-time base64 URL param (`SessionHandoff.tsx`); signing out here clears both apps via a `?signout=1` round-trip to Jejaku.

## Colors

> **Source:** `app/globals.css`, `app/page.tsx`, `app/onboarding/page.tsx`.

### Brand & Accent
- **Blue** (`{colors.primary}` — `#1d4ed8`): Filled-pill CTA, link emphasis, active tab fill.
- **Blue Deep** (`{colors.primary-deep}` — `#1e3a8a`): Eyebrow/label text on light surfaces, avatar-initial text.
- **Blue Press** (`{colors.primary-press}` — `#172554`): Pressed-state (reserved; not yet wired to an active-state class).
- **Blue Soft** (`{colors.primary-soft}` — `#3b82f6`): Wordmark color in header/footer; gradient/flow-line mid-stop.
- **Blue Subdued** (`{colors.primary-subdued}` — `#bfdbfe`): Soft pill-tag background (e.g. the "tool" tag on project cards).
- **Brand Dark 900** (`{colors.brand-dark-900}` — `#051f3d`): Defined as a token but not currently used in any shipped surface — reserve for a future dark/inverted panel.
- **Amber** (`{colors.amber}` — `#e8a33d`): Gradient-mesh blob stop only.
- **Skyline** (`{colors.seafoam}` — `#7fc0e0`): Gradient-mesh blob stop and `IconFlowBadge` flow-line stop.
- **Citrine** (`{colors.citrine}` — `#c9a227`): Reserved gradient stop; not currently rendered.

### Surface
- **Canvas** (`{colors.canvas}` — `#ffffff`): Default page background; card background.
- **Canvas Soft** (`{colors.canvas-soft}` — `#f4f8fc`): Mesh base gradient, `IconFlowBadge` tile fill, inactive-tab pill background, avatar placeholder fill.
- **Canvas Cream** (`{colors.canvas-cream}` — `#f5efd4`): The "none of this is finished" interlude band; also a mesh blob stop.
- **Hairline** (`{colors.hairline}` — `#dbe4ef`): 1px card/footer/divider borders.
- **Hairline Input** (`{colors.hairline-input}` — `#a8c8e0`): Borders on inputs, Google button, avatar-upload circle.

### Text
- **Ink** (`{colors.ink}` — `#0a1826`): Default body/heading text.
- **Ink Secondary** (`{colors.ink-secondary}` — `#1c2c3d`): Hero subhead, nav link idle state.
- **Ink Mute** (`{colors.ink-mute}` — `#5c6e7a`): Helper text, captions, card body copy, inactive tab label.
- **Ink Mute 2** (`{colors.ink-mute-2}` — `#5a6b76`): Reserved near-equivalent of ink-mute (nav-specific slot).
- **On Primary** (`{colors.on-primary}` — `#ffffff`): Text on filled blue surfaces.

### Semantic
- **Error** (`{colors.error}` — `#c4362b`): Form field error border/message text. This is the only semantic color in the system — there is no success/warning/info palette.

## Typography

### Font Family

**Inter**, loaded via `next/font/google` with weights `300/400/500/600`, exposed as `--font-inter` and mapped to Tailwind's `font-sans`. `font-feature-settings: "ss01"` is applied globally via a `.ss01` class on `<body>`. There is no proprietary/fallback font stack to manage — Inter is the actual production font, not a substitute.

### Hierarchy (as used, not a fixed token table)

| Role | Size | Weight | Tracking | Example |
|---|---|---|---|---|
| Hero headline | 38px → 53px (md+) | 300 (font-light) | -1.14px → -1.33px | `page.tsx` H1 |
| Section heading | 30px | 300 | -0.61px | "Projects" |
| Cream-band heading | 25px | 300 | -0.25px | "None of this is finished" |
| Card title | 19px | 300 | -0.19px | project/value/spec/onboarding card titles |
| Body / lead | 16px | 400 | 0 | hero subhead |
| Card body | 14px | 400 | 0 | card copy, helper text |
| Eyebrow / label | 12px | 500 (font-medium), uppercase | 0.1px | "Almost there", spec labels, tag pills |
| Caption / meta | 12–13px | 400–500 | 0 | footer links, form error text, helper captions |
| Button label | 14–16px | 500 (font-medium) | 0 | pill buttons |
| Tabular value | 19px | 300 | -0.19px + `tnum` | spec values (RAM, storage, etc.) |

### Principles
- **Weight 300 for anything read as a headline or card title.** Body copy, labels, and buttons sit at 400–500 — the thin/regular contrast (not a display/body split) is the brand's typographic rhythm.
- **Tighter negative tracking scales down with size**, roughly -1.3px at 53px down to -0.19px at 19px; body/caption sizes carry 0 tracking.
- **`.tabular` utility** (`font-feature-settings: "tnum" 1, "ss01" 1; letter-spacing: -0.42px`) — apply to any numeric spec/measurement value, not just money (there is no currency UI yet).
- **`ss01` is global**, set once on `<body>` — never re-applied per-component.

## Layout

### Spacing System
Spacing values in this codebase are **arbitrary bracket values tuned by eye**, not a strict 8px scale — typical values are `8 / 11 / 15 / 19 / 23 / 30 / 38 / 46 / 61 / 76 / 91px`. Treat these as the working scale rather than forcing round 8px multiples.

- **Section vertical padding**: 91px (hero, projects, tabs section) / 76px (cream interlude) / 61px (footer).
- **Card internal padding**: 30px standard (`card-content-flat`), 23px on small screens for the hero auth card.
- **Grid gaps**: 23px between cards; 46px between a section's intro copy and its grid.

### Grid & Container
- Header/footer container: `max-w-7xl` / `max-w-6xl` respectively, horizontal padding 23px (30px at `lg`).
- Content sections: `max-w-6xl`, cream interlude narrows to `max-w-3xl` and centers text.
- Card grids: 1-col mobile → `md:grid-cols-2` (projects) or `md:grid-cols-3` (values/specs/stack) → `lg:grid-cols-3` (projects).
- Hero: 1-col mobile stacked, `lg:grid-cols-2` (copy left, auth card right).

### Whitespace Philosophy
The gradient mesh is deliberately short — one hero band, not a page-spanning wash. Everything below it returns to flat white/soft-canvas immediately, keeping the rest of the page quiet and text-forward.

## Elevation & Depth

| Level | Treatment | Use |
|---|---|---|
| 0 | Flat, no shadow | Default — nearly every card on the site (`card-content-flat`, auth card, onboarding card) |
| 1 | Gradient mesh (animated blur blobs) | The site's only depth medium — no box-shadows are used anywhere in the current UI |

There is currently no shadow-based elevation system in use — cards are distinguished by a 1px `{colors.hairline}` border on `{colors.canvas}`, not by lift. If a future component needs to visually float above the page, introduce a shadow token deliberately rather than defaulting to one.

### Decorative Depth
`.gradient-mesh` is three stacked, absolutely-positioned, blurred (`blur(40px)`) radial-gradient pseudo-elements/divs (`::before`, `::after`, `.mesh-blob`), each with its own slow drift keyframe animation (translate + scale, 22–30s loops). All three are disabled via `prefers-reduced-motion`. This is implemented in plain CSS, not SVG or a static image.

## Shapes

### Border Radius Scale

| Token | Value | Use |
|---|---|---|
| `{rounded.xs}` | 4px | Reserved, not currently used |
| `{rounded.sm}` | 6px | Form inputs |
| `{rounded.md}` | 8px | `IconFlowBadge` tile |
| `{rounded.lg}` | 12px | All content cards (`card-content-flat`, auth card, onboarding card) |
| `{rounded.xl}` | 16px | Reserved, not currently used |
| `{rounded.pill}` | 9999px | Buttons, tag pills, tab-switcher container/buttons |

### Photography Geometry
There is no photography or product-UI mockup pattern in this site — it's a text/icon-driven personal site. The only "image" surfaces are the wordmark logo (`/jk-logo.svg`) and user-uploaded avatar previews (circular, `object-cover`, 64×64px).

## Components

### Buttons

**`button-primary-pill`** — the one filled CTA per view.
- Background `{colors.primary}`, text `{colors.on-primary}`, height `37px`, padding `0 15–16px`, `font-medium`, rounded `{rounded.pill}`.
- Press feedback via `active:scale-[0.98]` (a transform, not a color-swap pressed state).

**`button-outline-pill`** — used for the Google auth button.
- Background `{colors.canvas}`, text `{colors.ink}`, 1px `{colors.hairline-input}` border, same pill geometry, `hover:bg-canvas-soft`.

**`tab-pill`** — segmented control button (see `ValuesSpecsTabs`).
- Active: `{colors.primary}` fill, `{colors.on-primary}` text. Inactive: transparent, `{colors.ink-mute}` text. Sits inside a `{colors.canvas-soft}` pill-shaped track with 4px padding.
- Height `37px` (explicit, content vertically centered via flex) — not derived from padding.

All interactive pill/rectangular buttons are explicit `height: 37px` (`h-[37px]`), never padding-derived — padding-only sizing drifts a pixel or two with line-height/font differences, which is exactly the "39px vs 37px" mismatch to avoid. Center content with `flex items-center [justify-center]` instead of relying on vertical padding for balance. Small icon-only controls (e.g. the `26px`/`28px`/`33px` round buttons in `ReceiptsList`/`ReceiptScannerCard`, pagination arrows) are an intentionally separate, smaller scale — they're not part of a form row and don't need to match `37px`.

### Cards & Containers

**`card-content-flat`** — the one card pattern used everywhere: projects, values, specs, stack, hero auth, onboarding.
- Background `{colors.canvas}`, padding `30px`, rounded `{rounded.lg}` 12px, 1px `{colors.hairline}` border, **no shadow, ever**.
- Structure: optional `IconFlowBadge` or eyebrow label up top, `19px`/weight-300 title, `14px` `{colors.ink-mute}` body, optional trailing link/action.

**`card-auth`** — the hero auth card and onboarding card are the same shape as `card-content-flat`, specialized with an icon+eyebrow header (`Fingerprint`/`Prompt` icon + uppercase label), a form body, and helper copy below.

### Inputs & Forms

**`text-input`**
- Background `{colors.canvas}`, text `{colors.ink}`, `14px`, height `37px` (explicit, not padding-derived), horizontal padding `11px`, rounded `{rounded.sm}` 6px, 1px `{colors.hairline-input}` border, `focus:border-primary`.
- Any trigger styled to sit in a form row alongside a text input (`Select`, `DatePicker`) shares this same explicit `37px` height so the row lines up exactly.
- Error state swaps the border (and adds a `12px` `{colors.error}` message below) to `{colors.error}` — no red background fill.
- Label sits above the field: `13px` `font-medium` `{colors.ink}`.

**Avatar upload control** (`OnboardingForm`)
- 64×64px circular button, `{colors.canvas-soft}` fill, `{colors.hairline-input}` border, shows an uploaded image, an initials letter (`{colors.primary-deep}`), or a placeholder `User` icon.

### Navigation

**`site-header`**
- Transparent, sits directly on the gradient mesh. Logo mark + wordmark (`{colors.primary-soft}`, `font-semibold`) on the left; nav links + a live clock on the right. No sign-in/CTA button in the header — auth lives in the hero card instead.

**`site-footer`**
- Plain white, 1px top `{colors.hairline}` border. Same logo lockup (smaller), nav links repeated, and a copyright line — no multi-column link farm.

### Pills, Tags, and Chips

**`pill-tag-soft`**
- Background `{colors.primary-subdued}`, text `{colors.primary-deep}`, `9px` uppercase, `font-medium`, padding `4px 8px`, rounded `{rounded.pill}`. Used for the project-card category tag ("tool").

### Signature Components

**Gradient Mesh Hero** — animated, blurred, layered radial blobs (cream/amber/sky-blue/deep-blue) confined to the hero band only; see Elevation & Depth above.

**`IconFlowBadge`** — a `{colors.canvas-soft}` rounded-square tile containing a Phosphor icon, with 3 faint animated SVG flow-lines (seeded pseudo-random paths) drifting behind it in a green→teal gradient stroke. The recurring leading visual for every card-grid item (values, specs, stack). Respects `prefers-reduced-motion` by freezing the gradient animation.

**`ValuesSpecsTabs`** — a centered pill-shaped tab switcher (Values / Specs / Stack) whose content fades in (`tab-fade-in`, 0.25s). Uniquely, mouse-wheel scroll near this section is intercepted: once the section nears viewport-center, wheel deltas accumulate and step through tabs before allowing the page to keep scrolling — a scroll-jacked stepper, not plain in-page tabs.

**Cream Interlude** (`bg-canvas-cream`) — a short, centered, copy-only band used once per page to create a tonal pause between the tab section and the footer.

**`ReceiptIllustration`** (project-card illustration) — a small hand-built inline SVG scene, the first non-icon illustration on the site. Composed of, in the site's existing green/mint/amber palette only: a receipt strip (white fill, `{colors.hairline}` stroke, zigzag torn bottom edge) with a few text-line strokes inside; a thin `{colors.primary-soft}` scan-beam bar that sweeps top-to-bottom on a loop, exactly matching the receipt's width so it never overhangs; a thin (`1.5px`) ink-colored camera-capture corner frame (4 independent corner brackets, generous ~10px gap from the receipt edge, vertically balanced so the frame sits centered in its box) around the whole receipt; and 6 total amber sparkle accents (4-point star shape, one large + 5 scattered smaller ones at varied size/opacity) that each blink independently on their own duration/delay so they twinkle out of sync. No background box — it sits directly on the card's canvas.
- This establishes the pattern for any future per-project illustration: flat-line SVG, brand palette only, one clear animated focal motion (the scan), thin strokes throughout, ink-colored (not primary-green) framing elements, and scattered blinking sparkle accents as the "AI/insight" motif. Reuse this recipe rather than introducing a new illustration style per project.

**`link-on-light`**
- Text `{colors.primary}`, `13–15px`, `font-medium`, no underline, often paired with a trailing `ArrowRight` icon (project card "View project", hero "See the work").

### Dashboard Shell

The one departure from the marketing-page pattern, used only on `/dashboard` (`DashboardShell.tsx`).

- **Navbar**: full-width, spans the whole top — logo/wordmark left, Roadmap link + `LiveClock` + `UserBadge` right. Sits on the gradient mesh, same treatment as `site-header` elsewhere, with a `{colors.hairline}` bottom border.
  - **Structural gotcha**: the gradient/`FlowLines` layer is rendered as `<div className="gradient-mesh" style={{position:"absolute", inset:0}}>` — an inline style, not the `absolute inset-0` Tailwind utility. `.gradient-mesh`'s own `position: relative` rule in `globals.css` and Tailwind's `absolute` utility have equal CSS specificity, and the plain rule wins the cascade tie by source order, silently collapsing the box to 0 height. The header content itself lives as a **sibling** of the gradient layer (not a descendant), specifically so popovers inside the navbar (the `UserBadge` hover card) aren't clipped by `.gradient-mesh`'s own `overflow: hidden` — on marketing pages this never bites because `.gradient-mesh` wraps the whole tall hero section, but a thin navbar-only wrapper is exactly tall enough to clip a popover that extends past it.
- **Sidebar** (`DashboardSidebar.tsx`, inside an `<aside>` in `DashboardShell.tsx`): a persistent **vertical** icon rail at every screen size — never horizontal, never a top strip. `64px` wide with icon-only pills below `lg`, `176px` with icon+label at `lg`+. Padding, gap, and pill shape (`px-[12px] py-[7px]`, `gap-[3px]`, `rounded-md`) are **identical** at every breakpoint — mobile is a genuine collapse of the same list, not a differently-spaced variant.
  - Nav pills carry an explicit `min-h-[32px]` — without it, hiding the label span on mobile also removes its 18px line-height from the flex row's height calc, silently shrinking the pill to 30px.
  - Icons carry `shrink-0` and the rail is sized with enough room (`outer padding + pill padding×2 + icon width`) so the icon never gets squeezed non-uniformly narrow by flex-shrink in the narrow mobile rail — a real bug that happened when the rail was sized to look "compact" without doing that arithmetic first.
  - Unbuilt nav items (Receipts, Upload, Settings) show a `SOON` tag and `opacity-60`, `cursor-not-allowed` — same "coming soon" honesty as `Coming soon` project-card CTAs.
- **Main content column**: no gradient by default — plain `{colors.canvas-soft}` background, `px-[18px] py-[24px]` (`lg:px-[20px] lg:py-[20px]`). Page-specific hero copy (e.g. the dashboard greeting) can wrap itself in its own `.gradient-mesh` band if it wants one, sized to its own content height — never stretched to fill the sidebar's full height.

### Dashboard Content Components

**`DashboardStats`** — a 3-up grid (`sm:grid-cols-3`) of stat tiles, same shape as Jejaku's own `dashboardCardsGrid`: `IconFlowBadge` (40px, 16px icon) + uppercase 10–11px label + 15–16px light value + muted detail line. Values are honest zeros (`$0.00`, `0`) until there's a real backend — no fake data.

**`ScanCard`** — the primary dashboard action, not a bare button. A `card-content-flat` container: `IconFlowBadge` + "Scan a receipt" title + a short tip list (lay it flat / keep it in frame / we'll structure it), then the `ScanReceiptButton` pill CTA at the bottom. Instructional copy always precedes the action for anything camera/upload-related — don't ship a bare capture button without it.

**`ScanReceiptButton`** — a hidden `<input type="file" accept="image/*" capture="environment">` behind a `button-primary-pill` labeled "Scan a receipt" with a `Camera` icon. `capture="environment"` opens the device camera directly on mobile; desktop falls back to a normal file picker. On selection, swaps to a preview card (captured image + Retake / discard actions) — client-side only, no upload wired up yet.

**`RecentReceipts`** — a `card-content-flat` with a proper empty state (`Tray` icon, "No receipts yet", pointing back at the scan action) rather than placeholder text — the shape a populated receipts list will eventually fill.

## Do's and Don'ts

### Do
- Keep the gradient mesh confined to the hero band of a page — don't let it bleed into content sections below.
- Use `card-content-flat` (flat, bordered, no shadow) as the default container for any new card — don't invent a shadowed variant unless there's a specific floating/overlay use case.
- Render headline/card-title text at weight 300; keep buttons, labels, and nav at 400–500.
- Reserve `{colors.primary}` fill for exactly one CTA per view; everything else is outline, ghost, or plain text link.
- Respect `prefers-reduced-motion` on any new animated element — the mesh, `IconFlowBadge`, and tab fade-in all already do this; match that pattern.
- Apply `.tabular` to any numeric/measurement value (spec cards, future stats).

### Don't
- Don't add drop shadows to cards — the entire site is currently shadow-free by design.
- Don't bring the sidebar/navbar app-shell pattern into any marketing page (landing, roadmap, onboarding) — it's `/dashboard`-only.
- Don't add a second filled-blue button in the same view.
- Don't use `{colors.brand-dark-900}` or `{colors.citrine}` yet — they're reserved tokens with no shipped surface; if you use them, document the new surface here.
- Don't wrap a popover-holding element (dropdowns, hover cards, tooltips) as a *descendant* of a `.gradient-mesh` box unless that box is guaranteed taller than the popover — `.gradient-mesh` clips overflow. Use it as an absolutely-positioned decorative sibling instead when the wrapper is short (see Dashboard Shell navbar).
- Don't hardcode spacing to a strict 8px grid — match the existing arbitrary-but-consistent bracket values (23/30/46/61/91px etc.) already in use.

## Responsive Behavior

### Breakpoints (Tailwind defaults as actually used)
| Name | Width | Key Changes |
|---|---|---|
| Mobile | < 768px (`md`) | 1-col grids everywhere; hero stacks; header clock hidden |
| Tablet | 768–1023px (`md`–`lg`) | Projects 2-col; values/specs/stack 3-col already applies at `md` |
| Desktop | ≥ 1024px (`lg`) | Hero becomes 2-col (copy + auth card side-by-side); projects 3-col; header padding increases to 30px |

### Touch Targets
- All buttons and text inputs are a fixed `37px` tall — slightly under the 44px AAA target; acceptable here given generous horizontal padding and the low-stakes, non-transactional nature of the actions (nav, auth, form submit).

### Collapsing Strategy
- Hero headline steps 38px → 53px at `md`.
- Card grids step 1 → 2/3 columns at `md`, projects additionally steps to 3 at `lg`.
- No separate mobile art-direction crops exist — there are no photographic/mockup images to crop.
- Dashboard sidebar: icon-only below `lg`, icon+label at `lg`+ — collapse by hiding the label span, never by changing spacing/padding values between breakpoints (see Dashboard Shell).
- Header nav-link text (`whitespace-nowrap` wordmark + hidden-below-`sm` full name in `UserBadge`) exists specifically so a longer product name ("jejaku receipt" vs "jejaku") doesn't break the header layout at a different width than Jejaku's own header does — check both apps' headers at 320px when touching this pattern.

## Iteration Guide

1. Focus on ONE component at a time and check `app/components/` for an existing pattern before inventing a new one — most needs are already covered by `card-content-flat`, `IconFlowBadge`, or the pill-button styles.
2. Reference real Tailwind arbitrary values already in use (e.g. `text-[19px]`, `tracking-[-0.19px]`, `p-[30px]`) rather than inventing new round numbers — consistency here matters more than a clean token scale.
3. Keep `ss01` global and `.tabular` applied per-numeric-element only.
4. New sections should default to flat white/`{colors.canvas-soft}` — only the very top of the page gets the gradient mesh.
5. If a component needs real elevation (shadow) or a dark inverted surface, that's a genuine new pattern for this site — call it out explicitly rather than quietly adding a `box-shadow`.
6. Always test new interactive/animated components against `prefers-reduced-motion`, matching the mesh/`IconFlowBadge`/tab-fade precedent.
</content>
