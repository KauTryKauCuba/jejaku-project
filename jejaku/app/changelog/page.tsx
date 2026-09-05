import type { Metadata } from "next";
import FlowLines from "../components/FlowLines";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import ChangelogTimeline from "../components/ChangelogTimeline";

export const metadata: Metadata = {
  title: "Changelog — Jejaku",
  description: "What's shipped, day by day.",
};

const TIMELINE = [
  {
    status: "Jejaku Beta v0.0.1",
    title: "Building Jejaku",
    body: "This site itself — still shaping the pages, the auth flow, and everything else here.",
    dateLabel: "Started",
    date: "2026-08-29",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Polishing Jejaku",
    body: "Ongoing tweaks to the design system, the onboarding flow, and the landing page content — refining what's already here before starting on anything new. Jejaku Receipt waits until this feels right, not perfect.",
    dateLabel: "Started",
    date: "2026-08-29",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Accounts, onboarding & dashboard",
    body: "Email sign-in, a profile setup step with an avatar and a holographic member card, and a signed-in dashboard at its own URL that swaps in automatically once you're set up.",
    dateLabel: "Shipped",
    date: "2026-08-29",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Jejaku Receipt gets its own look",
    body: "Gave Jejaku Receipt its own blue theme and linked navigation (roadmap, logo) between the two apps.",
    dateLabel: "Shipped",
    date: "2026-08-29",
  },
  {
    status: "Jejaku Tree Beta v0.0.1",
    title: "Jejaku Tree, a new idea",
    body: "A family tree you actually add people to — parents, siblings, kids, grandparents — one relative at a time. Just a concept card on the landing page for now, no build yet.",
    dateLabel: "Shipped",
    date: "2026-08-29",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "One sign-in across both apps",
    body: "Signing in on Jejaku now carries your session into Jejaku Receipt automatically, and signing out of either one signs you out of both — no separate accounts to juggle between the two.",
    dateLabel: "Shipped",
    date: "2026-08-29",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "A real dashboard for Jejaku Receipt",
    body: "Rebuilt the dashboard with a proper sidebar and navbar shell — a collapsible icon rail on mobile, full labels on desktop, and the same gradient header as the rest of the site.",
    dateLabel: "Shipped",
    date: "2026-08-29",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "\"Use this system\" now points to the right place",
    body: "The Jejaku Receipt card's launch button was hardcoded to an old local address. It's now configured per environment, so it correctly opens Jejaku Receipt both locally and in production.",
    dateLabel: "Shipped",
    date: "2026-08-30",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Custom dropdown and date picker",
    body: "Swapped the browser's native category dropdown and date input for themed ones that actually match the app — no more OS-styled popups breaking the design mid-form.",
    dateLabel: "Shipped",
    date: "2026-08-30",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A sign-in code email that looks like Jejaku",
    body: "The OTP email went from plain text to a branded one — the logo, gradient mesh, and flow lines from the site, plus a live countdown before you're allowed to request a new code.",
    dateLabel: "Shipped",
    date: "2026-08-30",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Google sign-in, with a code to back it up",
    body: "\"Continue with Google\" now actually works — and still asks for a quick email code afterward, right on the landing page, before you're signed in for real.",
    dateLabel: "Shipped",
    date: "2026-08-30",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Your name and photo actually stick around",
    body: "First sign-in saves your name and avatar for real. Come back later — by email or Google, doesn't matter which — and it's already there, no re-entering anything.",
    dateLabel: "Shipped",
    date: "2026-08-30",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Expenses and receipt photos, saved for real",
    body: "Expenses and scanned receipt photos used to live only in your browser and disappeared the moment you cleared it. Both now save to the server against your account — add one on your phone, see it on your laptop.",
    dateLabel: "Shipped",
    date: "2026-08-30",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan, full-screen with a framing guide",
    body: "The camera view is now genuinely full-screen instead of letterboxed, with an on-screen tip to keep the receipt flat, fully in frame, and well lit before you tap the shutter.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Automatic receipt extraction",
    body: "Scanning a receipt no longer means typing in the merchant, amount, and date yourself — they're read straight from the photo and pre-filled, ready to check over and save.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Receipt photos that actually show up",
    body: "Fixed a bug where a scanned receipt's thumbnail could silently fail to load after a server restart — the photo was always saved, it just wasn't being served correctly.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Profile photos that actually persist",
    body: "Uploading a photo during sign-up looked like it worked, but it never really saved anywhere — it only lived in that one browser tab. Photos now genuinely upload and stick around.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A real Settings page",
    body: "Added a place to change your name and photo after signing up, on both apps — previously the only chance to set a photo was during onboarding, with no way to update it later.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Line items, location, and currency, read off every receipt",
    body: "A scanned receipt no longer stops at merchant/amount/date — it now reads the itemized list with prices, the store's location, and the currency it's priced in, all editable before you save.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Totals that actually work across currencies",
    body: "Scan a receipt in USD, another in MYR, another in SGD — Total Spent and Monthly Trend used to just add the raw numbers together, which was meaningless. Each expense now converts into your account's default currency at save time, so the combined totals are real. Set your default currency (or let it auto-detect from where you sign up) on Jejaku's Settings page.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Tax, and a heads-up when a category is just a guess",
    body: "Receipts can now carry a tax amount, pulled straight off the photo when it's printed. And when the scanner can't confidently tell what category a receipt belongs to, the form says so instead of silently defaulting to \"Food & Drink\" with no explanation.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Categories you make yourself",
    body: "The built-in category list wasn't going to cover everyone. You can now add your own right from the category dropdown — it's remembered on your account and shows up everywhere alongside the defaults.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "A full Receipts page, with editing and deleting",
    body: "The dashboard only ever showed your most recent receipts. There's now a dedicated Receipts page listing everything, with paging and a per-page size you control — and, for the first time, a way to fix a mistake or remove a receipt after it's saved, instead of living with it forever.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Where your money actually goes, charted",
    body: "Categories Tracked and Monthly Trend went from a single number to a real breakdown — a ranked list of categories with their own colors, and a stacked bar per month you can hover for the exact split. Both now let you switch between this month, 3, 6, or 12 months.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "One button height, everywhere",
    body: "Some buttons and form fields were 37px tall, others a couple pixels taller depending on the browser's font metrics — invisible until two sat side by side. Every button and input on both apps is now a fixed 37px, no exceptions.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "The navbar clock now shows the date",
    body: "It told you the day of the week and the time, but not the date itself. Now it does — on both apps.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Total Spent and Receipts Scanned, on the same clock as everything else",
    body: "Both tiles used to just show an all-time number. They now default to this month, take the same this month/3/6/12-month range as the other tiles, show the change versus the period before, and keep the all-time total visible underneath so neither view is lost.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "A way to reset — and reload — your data",
    body: "Settings now has a way to permanently clear every expense on your account (receipt photos included, behind a typed confirmation so it can't happen by accident), and, separately, a one-click way to reload a set of sample receipts spanning several months so the dashboard has something to show right away.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Sample receipts, from the moment you sign up — and easy to clear",
    body: "A brand-new account now arrives with a handful of months of sample receipts already in it, so the dashboard isn't empty on day one. Those sample rows are tagged as demo data behind the scenes, so \"Remove demo data\" in Settings clears exactly those and leaves anything you've actually entered untouched — separate from the full account wipe, which still deletes everything.",
    dateLabel: "Shipped",
    date: "2026-08-31",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A sign-in code you can actually copy",
    body: "Email clients block scripts, so a real \"click to copy\" button was never going to work there — instead the code itself is now the tap target: bigger, no gaps breaking up mobile long-press selection, with a hint telling you to tap and hold.",
    dateLabel: "Shipped",
    date: "2026-09-01",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Cards that no longer run off the edge of the screen",
    body: "On some phones, a card's content could force the whole row wider than the screen, cutting off everything sharing that row with it — not just the one card that looked like the culprit. Fixed at the root across the dashboard and Receipts page, and checked by hand against 16 different screen widths, from a small phone to a wide desktop.",
    dateLabel: "Shipped",
    date: "2026-09-01",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A lighter, smoother background on mobile",
    body: "The drifting background gradient behind every page — including the navbar on every Jejaku Receipt screen — was quietly expensive to animate, a common cause of choppy scrolling and extra battery drain on phones. Simplified the animation and lightened it further on small screens, with no real difference in how it looks.",
    dateLabel: "Shipped",
    date: "2026-09-01",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "A dashboard card for tax you've actually paid",
    body: "Tax was captured per receipt but never added up anywhere. There's now a Tax Records card alongside the others — same this month/3/6/12-month range, same running total at the bottom — so it's visible at a glance instead of something you'd have to dig for.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Tag a receipt for a warranty claim, and find it again later",
    body: "Scanning or entering a receipt now has a \"Tag as Warranty Claim\" toggle. Tagged receipts get a small badge wherever they show up, and a \"Warranty claims\" filter appears to narrow the list down to just those — plus a dashboard card counting how many you've got, on the same time-range pattern as everything else.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan tells you when it couldn't read a receipt",
    body: "Pointing the scanner at something that isn't a receipt used to quietly hand back an empty form with no explanation. It now says so directly — \"Couldn't read this as a receipt\" — instead of the usual \"details auto-filled\" message, which was misleading when nothing had actually been found.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "An audit trail for your account",
    body: "Settings now keeps a running log of every expense added, edited, or deleted, categories you've created, and demo data seeded or removed — with a timestamp on each, paged the same way as your receipts list. An edit or delete used to leave no trace once it happened; now there's a record.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "This roadmap, grouped by day and collapsible",
    body: "Every entry used to sit in one long scroll. Now each day collapses into a single row with a count, and only the most recent day opens automatically — click any day to see what shipped on it.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Fixed the account menu's Log out getting cut off",
    body: "On pages with the gradient background — Roadmap, Settings, Onboarding, the homepage — hovering your avatar could clip the \"Log out\" button off the bottom of the popover, because the header sat inside a box that clips overflow. Restructured it the same way the Jejaku Receipt dashboard already handles it. Also removed a full-page dimming effect on hover that was actually washing out content further down the page, not just behind the popover.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Roadmap is now Changelog",
    body: "This page's content was always a record of what shipped, not a forward-looking plan — the name just caught up. Same page, same grouped-by-day layout, new URL: /changelog.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "See where your receipts came from",
    body: "Receipts now capture city, state, and country instead of a free-text address, and the dashboard has a new Receipt Locations card: a draggable, zoomable globe (drag to spin, scroll to zoom) with a pin for every city you've spent in, plus a history list underneath. Countries you have a receipt from are highlighted. No external maps service involved — coordinates are resolved from an offline city lookup, and the globe is rendered entirely client-side.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Split — split a receipt by item",
    body: "A new Quick Split button sits next to Quick Scan for exactly the case where you scan a receipt and only remember later it needs splitting. Add the people sharing a receipt, tag who had which item, and tax gets divided proportionally to what each person actually ordered. It's a dedicated flow, separate from scanning and editing, so it never gets in the way of just saving a receipt.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Receipts now have a short reference number",
    body: "Each receipt shows a memorable #0001-style number (in the order it was added) on the receipts list and in the edit view, instead of the raw database ID — easier to say out loud or search for than a UUID fragment.",
    dateLabel: "Shipped",
    date: "2026-09-02",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Monthly Trend's heatmap now colors by category",
    body: "The heatmap view used to shade each month as one flat tile by total spend. Now each month is a cluster of small squares, GitHub-contribution-style — one square per category, colored the same as Bar and Donut, and sized by how much was spent in that category, so all three chart views read as one system.",
    dateLabel: "Shipped",
    date: "2026-09-03",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Dates and times are ISO 8601 everywhere",
    body: "Every date and time shown across Jejaku and Jejaku Receipt — the live clock, member card, account-created and last-login labels, the audit trail, the calendar, the date picker, receipts, and the trend chart's month labels — now renders as YYYY-MM-DD / YYYY-MM-DDTHH:MM (ISO 8601), replacing the mix of locale-formatted strings (\"Sep 3, 3:45 PM\") used before. Currency codes (ISO 4217 — MYR, USD, SGD, ...) and country codes (ISO 3166 — MY, SG, US, ...) were already following their own standards, so between the three, every value here that has an international standard to lean on now actually uses it.",
    dateLabel: "Shipped",
    date: "2026-09-03",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Terms of Service and Privacy Policy",
    body: "Real pages, not placeholders — what's collected, why, who else (Google, Resend, DeepSeek, Cloudflare) is involved and for what, where it's stored, and what's still manual (like full account deletion) rather than self-serve. Linked from both apps' footers.",
    dateLabel: "Shipped",
    date: "2026-09-04",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Receipt Scanner card back to its correct size",
    body: "On the Receipts page, the scanner card had drifted narrower than its actual width on the dashboard after an earlier layout change — the 24-column split it was sized against was based on a dashboard structure that no longer existed. Corrected the math so it matches again.",
    dateLabel: "Shipped",
    date: "2026-09-04",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Jejaku Receipt's project card wears its own colors",
    body: "The Jejaku Receipt card on the landing page now borrows that app's blue theme instead of jejaku's teal — tag, button, and the receipt illustration itself — since it's previewing a sibling app with its own identity, not blending into this site's palette.",
    dateLabel: "Shipped",
    date: "2026-09-04",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A digit sphere on the sign-in code screen",
    body: "A small draggable, auto-rotating sphere of scattered digits now sits above the email code entry — a Fibonacci-lattice globe (same technique as Jejaku Receipt's location globe) where the digits nearest the center glow larger and brighter as it turns. Type a digit and it visibly plucks a matching one off the sphere and flies it into the box you just filled.",
    dateLabel: "Shipped",
    date: "2026-09-04",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Search and filter on the Receipts page",
    body: "The full Receipts list was a plain paginated dump — fine at 20 receipts, painful past 200. It now has a merchant search box, a category filter, and a from/to date range, all combinable, with pagination recalculated against the filtered set instead of the full list.",
    dateLabel: "Shipped",
    date: "2026-09-04",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Export your receipts as CSV or PDF",
    body: "An Export button on the Receipts page hands you whatever's currently filtered — as a CSV (RFC 4180-escaped, with a UTF-8 byte-order mark so Excel doesn't mangle non-ASCII merchant names) or a formatted PDF table with a total. The first way to get data out of the app rather than just into it — handing a month's receipts to an accountant no longer means opening each one by hand.",
    dateLabel: "Shipped",
    date: "2026-09-04",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "Sign in with GitHub and Discord",
    body: "Two more ways in alongside Google and email code — same rules apply either way: a quick email code still confirms the account afterward, and first sign-in still walks you through picking a name and photo.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Search now looks inside your receipts, not just at the merchant",
    body: "The Receipts page search only ever matched merchant names. It now also searches each receipt's itemized list — searching \"charger\" finds the receipt it was on, not just receipts from a merchant named Charger.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Recent Receipts sorted by the receipt's actual date",
    body: "Recent Receipts (and the full Receipts list) used to order by when a receipt was added to the app, not the date printed on it — an old receipt entered today could sit above one from last week. Both now sort by the receipt's own date, newest first, with same-day receipts falling back to entry order.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Warranty claims now have an expiry, not just a tag",
    body: "Tagging a receipt as a warranty claim now optionally sets how long it's covered, from 3 months to 3 years. The app derives an expiry from that and the purchase date, shows \"Expires in 6 weeks\" (or \"Expired\") right on the receipt, and the Warranty Claims dashboard card now counts how many are expiring within 30 days.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan tells you where your photo is going",
    body: "The camera screen now says outright that a captured photo is sent to DeepSeek to read it, and isn't stored there — the only AI call in the app, made visible instead of assumed.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Import Photo reads the receipt too, not just Quick Scan",
    body: "Only photos taken with Quick Scan were ever run through automatic extraction — importing a photo from your camera roll (screenshots, e-receipts, a friend's photo of a shared bill) dropped straight into a blank form. Imported photos now get the same auto-fill a fresh scan does. PDF import still needs entering by hand for now.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan is limited to your own account",
    body: "The receipt-reading endpoint had no login check at all — anyone who found it could trigger scans without an account. It's now limited to signed-in users, with a cap on how large a photo it'll accept and a daily scan limit per account as a backstop against a runaway or compromised session.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan tells you when a scan didn't go through",
    body: "Hitting the daily scan limit, sending too large a photo, or losing your session used to fail the same way as a normal scan miss — a blank form with no explanation. Each of those now shows its own message, so it's clear the form is blank because something was blocked, not because the receipt itself was unreadable.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "CSV export now includes warranty coverage and expiry",
    body: "Exporting receipts to CSV only ever noted whether something was tagged as a warranty claim. It now includes the coverage length and the derived expiry date too, so a warranty's shelf life travels with the rest of the export.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Dashboard stat cards, recolored and spinning",
    body: "Total Spent moved off an unused gold token onto its own purple, and Receipts Scanned moved off a color it shared with another card onto its own pink, so all four stat cards read as genuinely distinct at a glance. Each card's large background icon now turns like a slowly spinning globe, with a handful of small matching icons spinning independently behind it.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "The Receipt Scanner card gets an icon",
    body: "Every dashboard tile has a badge icon above its title except this one. Added a matching camera badge so the scanner card looks like it belongs with the rest.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Click a receipt to preview it",
    body: "The Receipts page list only ever led to editing — there was no quick way to just look at a receipt. Clicking a row now opens a preview with the photo, items, tax, and warranty/split details, while the split, edit, and delete buttons still work on their own without opening it.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Receipt rows highlight cleanly on hover",
    body: "Hovering a row on the Receipts page now shows a consistent rounded highlight on every row, first and last included, without curving the hairline dividers between them.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan and Quick Split walk you through it, step by step",
    body: "Tapping either button now opens a short animated tutorial first — one screen per step, illustrated with the actual receipt data moving through the flow, with Back/Next to move through it and \"Don't show this again\" to skip it from then on.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Warranty tracking, down to the item",
    body: "Tagging used to cover a whole receipt at once — a Lazada order with a kettle and a phone case had no way to tell them apart. Items can now be tagged individually, with a keyword-based suggestion for how long common appliances and electronics are usually covered (a starting guess to confirm, never applied on its own), and a one-tap Claim Kit PDF for anything tagged — the receipt photo, the item, the dates, and a pre-written claim message, ready to hand over.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "A bell for expiring warranties",
    body: "A badge next to the account menu now lists anything expired or expiring within 30 days, across every tagged item and receipt — previously the only way to notice was opening the Warranty Claims card yourself.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Sample data that actually shows off warranty tracking",
    body: "None of the sample receipts a new account starts with had ever been tagged for warranty, so the feature looked unused on day one. Added a small appliance purchase timed to show up as \"expiring soon,\" and tagged one item on an existing sample receipt to demonstrate tagged and untagged items sitting side by side on the same receipt.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "The landing page, trimmed down to what it's actually for",
    body: "The public landing page was a stale copy of jejaku's own homepage — the same portfolio pitch, hardware specs, and tech stack tabs, with a card linking to itself. Removed the Projects list and the Mind/Hardware/Tech Stack tabs, and the \"Sign in on jejaku\" button now opens jejaku's homepage instead of skipping straight to its login form.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Beta v0.0.1",
    title: "A \"Learn more\" button on the landing page's project cards",
    body: "Each project card only ever offered a way to use it — or a login wall if you weren't signed in — with no way to just read about it first. Jejaku Receipt's card now has a Learn more button pointing at its own landing page; Jejaku Tree's is in place too, waiting on somewhere to send it.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan can read a lot more of a long receipt",
    body: "A receipt with more than around 35 items used to fail completely — the scan came back as if nothing was there at all, no explanation, even though the photo was perfectly readable. Quick Scan can now read several times that many items, and if a receipt is still too long to fully capture in one read, it keeps what it actually found instead of throwing the whole scan away — you'll see exactly how many items were read, with a note to check the rest and the total yourself.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "The captured photo preview shows the whole receipt",
    body: "A tall receipt used to get cropped down to a small square after capture, showing only a middle slice of it. The preview now shows the entire photo, letterboxed instead of cropped, whatever its shape.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Quick Scan reads items more reliably again",
    body: "A shorter, more compact format was tried for reading line items faster, but it made the scan less consistent — item lines would occasionally go missing that used to come through fine. Switched back to the sturdier format, and made the scanner accept either shape per line, so one line formatted differently than the rest doesn't cost you that item.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "Item prices read correctly on receipts with a separate total column",
    body: "Some receipts print a per-item price and a separate line total side by side; others print only one number per line. Quick Scan used to ask the AI to tell those apart and do the math itself — usually right, but it could quietly get it backwards partway through a long list, doubling or halving a price with nothing to show for it. It no longer has to decide: it now just reads the numbers as printed, and the app does the arithmetic and cross-checks the two numbers against each other. A line that doesn't add up now gets flagged instead of silently trusted.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
  {
    status: "Jejaku Receipt Beta v0.0.1",
    title: "A \"Long receipt\" option in Quick Scan",
    body: "A long grocery run still fits in one photo, but the scanner reads less detail per line the longer that photo gets. Quick Scan's camera screen now has a Long receipt toggle — off by default, one tap and shoot exactly as before — that splits the photo into a few overlapping slices before sending it off, giving each part its own full read instead of sharing one shrinking one.",
    dateLabel: "Shipped",
    date: "2026-09-05",
  },
];

export default function ChangelogPage() {
  return (
    <>
      <div className="relative">
        {/* Background layer is a sibling of the header/hero content below,
            not their parent — gradient-mesh clips overflow, which would
            cut off the UserBadge popover (Settings/Log out) if it were a
            descendant. Same rule as the Dashboard Shell navbar, documented
            in DESIGN.md. */}
        <div className="gradient-mesh" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
          <div className="mesh-blob" aria-hidden="true" />
          <FlowLines />
        </div>

        <div className="relative">
          <SiteHeader />

          <section className="mx-auto max-w-4xl px-[23px] pt-[38px] pb-[91px] lg:pt-[61px]">
            <h1 className="text-[38px] font-light leading-[1.05] tracking-[-1.14px] text-ink md:text-[46px]">
              Changelog
            </h1>
            <p className="mt-[19px] max-w-[52ch] text-[16px] leading-relaxed text-ink-secondary">
              What&apos;s shipped, day by day.
            </p>
          </section>
        </div>
      </div>

      <section className="bg-canvas py-[91px]">
        <div className="mx-auto max-w-4xl px-[23px]">
          <ChangelogTimeline items={TIMELINE} />
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
