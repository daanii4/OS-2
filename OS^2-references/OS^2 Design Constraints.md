# Operation Scholars OS — Design Brief v2
### QuasarNova LLC · Solutions UI/UX · April 2026
### For: Cursor Agent · All frontend component generation

---

## Why This Brief Exists

The v1 prototype established structure and function. Every screen covered the right data. What it did not do was **command authority**. The typography was flat. Cards had no depth story. The visual hierarchy told the user "here is some information" instead of "here is the most important thing — now look here next." This brief fixes that. Every rule below is derived from research into high-conversion SaaS dashboards, clinical data platforms, and the Linear/Vercel/Stripe school of interface craft — then calibrated to Operation Scholars' institutional identity.

The north star for v2: **a school district administrator who has never seen this product before opens it on a laptop and understands in 8 seconds that Operation Scholars reduces behavioral incidents. That understanding should require zero explanation.**

---

## Part 1 — Research Synthesis

### What High-Conversion Dashboards Do That Flat Ones Don't

Research across SaaS dashboard design (Eleken, DataCamp, Art of Styleframe, F1Studioz 2026), healthcare data visualization (JMIR scoping review, AHRQ guidelines), and enterprise typography systems (IBM Carbon, Toptal, Datafloq) converges on six differentiators between dashboards that drive action and dashboards that just display data:

**1. The 5-Second Rule is non-negotiable.**
Users identify the answer to their primary question within 5 seconds or they disengage. Every screen has one primary question. Design the visual hierarchy to answer that question first, at the largest visual weight, before anything else loads meaning.

**2. Typography weight contrast does the work that color cannot.**
Flat dashboards use one or two font weights at similar sizes. High-craft dashboards use extreme weight contrast: a 500-weight 28px number next to a 400-weight 11px label reads as a clear hierarchy. The IBM Carbon design system formalizes this: "a lighter weight font can rank hierarchically higher than a bold font if the lighter weight type size is significantly larger." Exploit this. The number should feel heavy and settled. The label should feel subordinate and quiet.

**3. Depth is created by background offset, not borders.**
The Linear/Vercel pattern: page background is a slightly tinted off-white. Cards are pure white. Inner components are a slightly deeper tint. No `1px solid #ccc` borders separating content — that pattern is a UX smell. Elevation is communicated through tonal layering and a single, highly diffused shadow. This gives the interface a three-dimensional spatial quality without any decorative chrome.

**4. The F-pattern scan path must be designed, not assumed.**
Eye-tracking research confirms users scan top-left to bottom-right in an F-shape. KPIs go top-left. Trend direction (up/down) goes immediately adjacent. Secondary detail flows down and right. Charts that answer "is this getting better?" belong in the primary scan zone. Tables and lists belong below.

**5. Data numbers and UI text are typographically different objects.**
High-craft dashboards treat numeric data as a separate typographic class from interface text. Monospaced data fonts (IBM Plex Mono) enforce tabular alignment and signal precision. Sans-serif UI fonts signal instruction and navigation. Mixing them without semantic discipline produces visual noise. Using them consistently produces professional authority.

**6. Color is an alarm system, not a decoration.**
The Stripe, Linear, and clinical dashboard convention: use your accent color sparingly, reserved for the most important one or two states. Green means improvement. Amber means watch. Red means act now. Gold means achievement. If everything is colored, nothing is prioritized. The background is predominantly neutral olive and white. Color fires only when it means something.

---

## Part 2 — Operation Scholars Design System v2

### 2.1 Brand Foundation

Operation Scholars serves school counselors in California's Central Valley. It partners with school districts. It handles behavioral records for minors. The visual identity must project **institutional authority with human warmth** — not clinical coldness, not consumer friendliness. Think: a well-funded school district's communications team, not a startup's landing page.

The three brand anchors:

| Token | Hex | Role |
|---|---|---|
| `--olive-600` | `#5C6B46` | Structural anchor. Sidebar, primary actions, focus rings, active states. Communicates stability and growth. |
| `--gold-500` | `#D6A033` | Achievement accent. Progress milestones, graduation states, AI briefing indicators, success. Used sparingly. |
| `--white` | `#FFFFFF` | Card surface, typography on dark backgrounds, breathing space. |

---

### 2.2 Typography System v2 — The Sharp Hierarchy

The v1 problem: all text sat in a narrow size and weight band. Labels at 10px looked similar to values at 13px. Nothing commanded attention. The v2 solution is **extreme contrast at every tier**.

#### Font Assignment

| Face | Variable | Purpose | Never Use For |
|---|---|---|---|
| DM Serif Display | `--font-serif` | Student names, page titles, section headings, report headlines | Body text, labels, data values, navigation |
| IBM Plex Mono | `--font-mono` | Every numeric value: counts, percentages, dates in tables, KPI figures, durations | Headings, descriptions, navigation |
| Geist Sans | `--font-sans` | All UI text: labels, nav items, descriptions, form elements, badge text, button labels | Data values, headings above 16px |

#### Type Scale — v2

Every tier specifies size, weight, line-height, letter-spacing, and color. These are not suggestions — they are the exact values Cursor must use.

```
--type-display
  font: DM Serif Display
  size: 32px
  weight: 400 (italic for emphasis phrases)
  line-height: 1.15
  letter-spacing: -0.02em
  color: var(--text-primary) on light / #fff on dark
  use: page hero headlines, impact banner headline

--type-title
  font: DM Serif Display
  size: 24px
  weight: 400
  line-height: 1.2
  letter-spacing: -0.015em
  color: var(--text-primary)
  use: student names in profile headers, section titles

--type-heading
  font: DM Serif Display
  size: 20px
  weight: 400
  line-height: 1.25
  letter-spacing: -0.01em
  color: var(--text-primary)
  use: student names in table rows and cards

--type-subhead
  font: Geist Sans
  size: 13px
  weight: 600
  line-height: 1.4
  letter-spacing: 0
  color: var(--text-primary)
  use: card titles, section labels, panel headers

--type-body
  font: Geist Sans
  size: 13px
  weight: 400
  line-height: 1.6
  letter-spacing: 0
  color: var(--text-secondary)
  use: descriptions, session summaries, AI analysis text

--type-body-strong
  font: Geist Sans
  size: 13px
  weight: 500
  line-height: 1.6
  letter-spacing: 0
  color: var(--text-primary)
  use: key phrases within body text, navigation items

--type-label
  font: Geist Sans
  size: 10px
  weight: 600
  line-height: 1.4
  letter-spacing: 0.07em
  text-transform: uppercase
  color: var(--text-tertiary)
  use: field labels, table column headers, KPI card labels, badge text

--type-caption
  font: Geist Sans
  size: 11px
  weight: 400
  line-height: 1.5
  letter-spacing: 0
  color: var(--text-tertiary)
  use: helper text, meta info, timestamps below content

--type-data-hero
  font: IBM Plex Mono
  size: 32px
  weight: 500
  line-height: 1
  letter-spacing: -0.02em
  color: var(--text-primary) or semantic color
  use: KPI card primary number, impact banner stats

--type-data-lg
  font: IBM Plex Mono
  size: 20px
  weight: 500
  line-height: 1
  letter-spacing: -0.01em
  color: var(--text-primary) or semantic color
  use: student card inline metrics, profile header stats

--type-data
  font: IBM Plex Mono
  size: 13px
  weight: 400
  line-height: 1.4
  letter-spacing: 0
  use: table numeric cells, goal completion values, durations

--type-data-sm
  font: IBM Plex Mono
  size: 11px
  weight: 400
  line-height: 1.4
  letter-spacing: 0
  color: var(--text-secondary)
  use: dates in tables and timelines, secondary inline metrics
```

#### The Core Typography Rule

> **If it is a number in a data context — it is IBM Plex Mono.**
> **If it is a name, headline, or section title — it is DM Serif Display.**
> **Everything else is Geist Sans.**

This three-way distinction is what makes the interface feel sharp. Counselors should be able to glance at a student card and their eye immediately reads the name (serif), the incident count (mono), the school and grade (sans). Three visual channels. Three semantic signals. Zero ambiguity.

---

### 2.3 Color Semantic System v2

#### Full Token Set

```
/* Structural surfaces — tonal layering creates depth */
--surface-page:    #F2F4EE   /* Page background — slightly olive-tinted */
--surface-card:    #FFFFFF   /* Card background — pure white lifts above page */
--surface-inner:   #EEF0E8   /* Input backgrounds, nested panels */
--surface-inverse: #2D3820   /* Dark panels — sidebar, profile header, AI panel */

/* Olive palette — structural and primary */
--olive-50:  #F3F7E8
--olive-100: #E4ECCC
--olive-200: #C8D6AA
--olive-300: #AABB8A
--olive-400: #8A9E69
--olive-500: #6E8050
--olive-600: #5C6B46   /* PRIMARY ACTION */
--olive-700: #3D4C2C   /* PRIMARY HOVER */
--olive-800: #2D3820   /* SIDEBAR / DARK SURFACE */
--olive-900: #1E2517   /* DEEPEST TEXT */

/* Gold palette — achievement and accent */
--gold-50:  #FDF8EC
--gold-100: #FAF0D0
--gold-200: #F0D898
--gold-400: #E0B44E
--gold-500: #D6A033   /* ACCENT */
--gold-600: #B8861A   /* ACCENT HOVER */

/* Semantic states */
--color-success:    #16A34A   /* Incident reduction, goals met, graduated */
--color-warning:    #D97706   /* Plateau detection, mild concern */
--color-regression: #B45309   /* 25%+ incident spike — amber, not red */
--color-escalation: #991B1B   /* Safety flag — highest visual severity */
--color-error:      #DC2626   /* Form validation errors */
--color-info:       #2563EB   /* Neutral informational states */

/* Text — four levels of opacity hierarchy */
--text-primary:   #1E2517   /* olive-900 — headlines, student names, key data */
--text-secondary: #3D4C2C   /* olive-700 — body text, descriptions */
--text-tertiary:  #6E8050   /* olive-500 — labels, captions, helper text */
--text-quaternary:#8A9E69   /* olive-400 — disabled, placeholder, very secondary */

/* Border */
--border-default:  rgba(92, 107, 70, 0.12)   /* Card edges — almost invisible */
--border-hover:    rgba(92, 107, 70, 0.25)   /* Hovered/focused state */
--border-strong:   rgba(92, 107, 70, 0.40)   /* Emphasized borders */
```

---

### 2.4 Spacing System

Base unit: **4px**. All spacing values are multiples.

```
--space-1:   4px    /* icon padding, tight gaps */
--space-2:   8px    /* inline element gaps, badge padding */
--space-3:   12px   /* small internal component gaps */
--space-4:   16px   /* card internal padding (mobile), row padding */
--space-5:   20px   /* card internal padding (desktop) */
--space-6:   24px   /* card-to-card gap, section padding */
--space-8:   32px   /* page section gaps */
--space-10:  40px   /* major section separation */
--space-12:  48px   /* hero areas */
```

**Page layout padding:** `24px` horizontal on desktop, `16px` on mobile.
**Card internal padding:** `20px` vertical, `20px` horizontal on desktop. `16px` on mobile.
**Card gap (grid):** `14px` between cards. Not 24px — tighter grids feel more structured.

---

### 2.5 Elevation and Depth Model

Three tiers of elevation. Each tier has exactly one shadow definition.

```
/* Tier 0 — no elevation */
/* Use for: page background, inner table rows, flat elements */
box-shadow: none

/* Tier 1 — card elevation (default) */
/* Use for: all data cards, panels, the standard UI surface */
box-shadow:
  0 1px 2px rgba(0, 0, 0, 0.04),
  0 1px 4px rgba(0, 0, 0, 0.06);

/* Tier 2 — elevated card (hover state, popovers) */
/* Use for: hovered cards, dropdown panels, focused elements */
box-shadow:
  0 4px 8px rgba(0, 0, 0, 0.06),
  0 2px 4px rgba(0, 0, 0, 0.04);

/* Tier 3 — modal elevation */
/* Use for: dialogs, overlays, floating panels */
box-shadow:
  0 20px 40px rgba(0, 0, 0, 0.12),
  0 8px 16px rgba(0, 0, 0, 0.06);
```

**Depth is primarily communicated by background offset, not shadow size.**
- Page: `--surface-page` (#F2F4EE — slightly olive-tinted off-white)
- Card: `--surface-card` (#FFFFFF — pure white, lifts visibly above the page)
- Inner component: `--surface-inner` (#EEF0E8 — drops back into the card)

This three-tier system means a user can tell which layer they are on purely from background color, before they register any shadow.

---

### 2.6 Border Radius

```
--radius-none:   0px
--radius-sm:     4px    /* badges, chips, status indicators, bar chart tops */
--radius-md:     6px    /* inputs, dropdowns, small buttons */
--radius-default: 8px   /* standard cards, panels */
--radius-lg:     12px   /* large cards, modals, floating panels */
--radius-xl:     16px   /* profile headers, impact banners */
--radius-full:   9999px /* pill buttons, segmented controls, search bars */
```

**Harsh corners (0px) are prohibited on any container.** A card with `border-radius: 0` is a design error.

---

## Part 3 — Component Rules v2

### 3.1 KPI Card

The KPI card is the most scanned element on any dashboard. It must answer one question in under 1 second.

**Structure (top to bottom):**
1. Label — `--type-label` (uppercase, muted, 10px). Answers: what is this number?
2. Value — `--type-data-hero` (32px mono, weight 500). The headline. No competition.
3. Delta row — trend indicator + comparison text. Delta value in semantic color. Comparison in `--type-caption`.

**Rules:**
- Value and label must have extreme size contrast — minimum 3:1 size ratio.
- Delta arrow (↓ or ↑) is always adjacent to the delta value, same color.
- Downward incident trends are `--color-success`. Upward incident trends are `--color-regression`. This is counterintuitive to a new reader but contextually correct for this system — add a visible label ("vs baseline") to clarify direction.
- Top accent border: `3px solid` using the semantic color of the primary metric. Success KPIs get `--color-success`. Warning KPIs get `--color-regression`. Neutral KPIs get `--olive-200`.
- No icons in KPI cards. The number is the icon.

### 3.2 Data Table Rows

**Column alignment rule** (non-negotiable, from DataCamp and Art of Styleframe research):
- Text columns: left-aligned
- Numeric columns: right-aligned, always `--type-data` (mono)
- Status badges: center-aligned
- Trend sparklines: center-aligned

**Row heights:**
- Standard dashboard table: 52px row height
- Dense data table: 44px row height
- Never below 44px

**Hover state:** `background: --surface-page` (subtle tint, no border change, no layout shift)

**Sticky header:** `position: sticky; top: 0; z-index: 10; background: --surface-card`. Header uses `--type-label` (uppercase, muted). Never the same style as a row cell.

**Student names in tables:** Always `DM Serif Display` at `--type-heading` (20px). This is the most important differentiator from generic table design. When a student name has visual weight from the serif face, it reads as a person. When it's in the same Geist sans as the rest of the row, it reads as a record.

### 3.3 Cards

**Anatomy:**
```
card-outer (--surface-card, border: 1px solid --border-default, radius: --radius-default, shadow: tier-1)
├── card-header (padding: 14px 20px 0)
│   ├── card-title (--type-subhead)
│   └── card-subtitle (--type-caption, margin-top: 2px)
│   └── [optional: right-aligned action or toggle]
└── card-body (padding: 12px 20px 16px)
    └── content
```

**Hover transition:** Cards that are clickable navigate on click. On hover: `border-color: --border-hover`, `box-shadow: tier-2`. Transition: `all 150ms ease`. No layout shift. No scale transform on desktop cards (reserve scale for mobile tap feedback).

**Cards within cards:** Inner container uses `--surface-inner` background. No additional border. Radius: `--radius-md` (6px, which is outer 8px minus inner 2px offset). This is the "card within card" depth rule.

### 3.4 Status Badges

Every badge communicates a specific semantic state. The badge text is always Geist Sans, uppercase, letter-spaced.

```
/* Active student */
background: --olive-100
color:      --olive-800
border:     1px solid --olive-200

/* Graduated student */
background: --gold-100
color:      #7A5A10
border:     1px solid --gold-200

/* Transferred */
background: #F3F4F6
color:      #4B5563
border:     1px solid #E5E7EB

/* Inactive */
background: #F9FAFB
color:      #9CA3AF
border:     1px solid #F3F4F6

/* Escalation — safety critical */
background: #FEF2F2
color:      #991B1B
border:     1px solid #FECACA
/* + alert icon always present */

/* Regression flag */
background: #FFFBEB
color:      #B45309
border:     1px solid #FDE68A

/* Incident severity: High */
background: #FEF2F2
color:      #DC2626
border:     1px solid #FECACA

/* Incident severity: Medium */
background: #FFFBEB
color:      #B45309
border:     1px solid #FDE68A

/* Incident severity: Low */
background: --olive-50
color:      --olive-600
border:     1px solid --olive-100
```

### 3.5 Charts — v2 Standards

**The chart title is a complete sentence, not a metric name.**
- Wrong: "Incidents"
- Right: "Office Referrals per Student — Last 6 Months"

**Axis text:** Always `IBM Plex Mono` at 10px, `--text-tertiary` color. This is the detail that separates professional data interfaces from generic ones. Axis labels are numeric data — they use the data font.

**Grid lines:** Horizontal only. `stroke: rgba(92, 107, 70, 0.08)`. No vertical gridlines. No axis lines (set `border.display: false` on both axes in Chart.js).

**Chart color series:**
```
primary series:   #5C6B46 (olive-600)
secondary series: #D6A033 (gold-500)
baseline/target:  #AABB8A (olive-300), dashed 4/4 pattern
success region:   #16A34A with 15% opacity fill
regression:       #DC2626
```

**Tooltip:** Dark olive background (`#2D3820`), white title in IBM Plex Mono, muted body in Geist Sans. `border-radius: 6px`. Never use Chart.js default tooltip.

**Area fill under line charts:** Vertical linear gradient from `rgba(92,107,70,0.12)` at top to `rgba(92,107,70,0)` at bottom. Creates depth without clutter.

**Bar chart tops:** `border-radius: [3, 3, 0, 0]` — rounded top corners only.

**Period toggle placement:** Top-right of chart card header. Use `--radius-full` pill container. Segment buttons: 10px Geist Sans, medium weight.

**Baseline reference line:** Always present when baseline data exists. Dashed, `--olive-300` color, label "Baseline" in IBM Plex Mono at 10px, positioned `insideTopRight`.

**Empty chart state:**
```
centered icon (--olive-400, 20px, in --olive-100 circle 40px diameter)
+
"No data yet" in --type-subhead, --text-primary
+
context message in --type-caption, --text-tertiary
```

### 3.6 Navigation Sidebar

**Background:** `--olive-800` (`#2D3820`). Never pure black.

**Nav item states:**
```
Default:
  color:      rgba(255, 255, 255, 0.45)
  background: transparent

Hover:
  color:      rgba(255, 255, 255, 0.80)
  background: rgba(255, 255, 255, 0.06)
  transition: all 120ms ease

Active:
  color:      #FFFFFF
  background: rgba(255, 255, 255, 0.10)
  /* No left border indicator — background fill is the indicator */

Focus-visible:
  ring:       2px solid --gold-500
  ring-offset: 0px (inside the sidebar)
```

**Nav item height:** 36px on desktop. Icon: 13px, Lucide. Label: 12px Geist 500. Gap: 8px.

**Section labels:** 8px Geist, uppercase, letter-spacing 0.08em, `rgba(255,255,255,0.22)`.

**Brand mark at top:** `--gold-500` background, `26×26px`, `border-radius: 5px`. Initials "OS" in `--olive-800`, bold. Product name "Scholars OS" in DM Serif Display 13px, white, weight 400.

### 3.7 Profile Header (Student)

The student profile header is the one element that most directly communicates "this is a real student, not a database row." It must be designed with that weight.

**Background:** `--olive-800`. Full-width across the content area.
**Border-radius:** `--radius-xl` (16px).
**Geometric accents:** Two overlapping circles (no fill, low-opacity border) positioned bottom-right and top-left. `overflow: hidden` on the container clips them cleanly. These create depth without imagery.
**Gold bar:** `4px wide`, `height: 100%`, left edge of the container, `--gold-500`.

**Student name:** DM Serif Display, 22–28px depending on name length, white, weight 400. This is the largest serif element the counselor sees. It gives the student identity and presence.

**Stats row:** Four metrics in a grid. Label in `--type-label` white 35% opacity. Value in `--type-data-lg` (20px mono) white. Below each value: a 9px context string at 30% opacity white.

**Status badges in header:** Use the semi-transparent dark versions (background at 15–20% opacity of the badge color). Fully opaque badges look clumsy against the dark background.

### 3.8 Escalation Banner

**This is a safety-critical component.** It has its own rules that override normal design conventions.

- Full-width, above everything including the topbar.
- `background: #DC2626` when unacknowledged. `background: #991B1B` after acknowledgment click before full dismissal.
- Text is always white. Never olive, never muted.
- The acknowledge button is the only white element in the banner — it creates maximum contrast and draws the eye immediately.
- No border-radius on the banner itself — it spans the full width as a stripe.
- Icon: Lucide `AlertTriangle`, 16px, white, always present.
- The acknowledge button must be `min-height: 36px`, `background: #FFFFFF`, `color: #DC2626`. Clicking it should change the banner to `#991B1B` and update the button label to "Acknowledged" with a checkmark.

---

## Part 4 — Layout Architecture

### 4.1 Dashboard Page

```
Shell (flex, row, full viewport height)
├── Sidebar (200px fixed, --olive-800)
└── Main (flex-1, flex column, overflow-y: auto)
    ├── Topbar (48px, sticky, --surface-card, border-bottom)
    ├── [Escalation banner if active — full width]
    └── Content (padding: 18px 20px, flex column, gap: 16px)
        ├── KPI Row (CSS grid, 5 columns, gap: 10px)
        ├── Primary grid (2-column: 1fr 320px, gap: 14px)
        │   ├── Left: Charts stack (flex column, gap: 14px)
        │   └── Right: Sidebar metrics (flex column, gap: 14px)
        └── Insight row (3-column grid, gap: 10px)
```

### 4.2 Student Profile Page

```
Main (overflow-y: auto)
├── [Escalation banner — sticky top, full width, highest z-index]
├── Topbar (breadcrumb + actions)
└── Content (padding: 16px 20px, flex column, gap: 14px)
    ├── Profile header (--olive-800, full width, border-radius: 16px)
    │   ├── Identity block (avatar + name + badges)
    │   └── Stats row (4-column grid, border-top separation)
    └── Two-column grid (1fr 300px, gap: 14px)
        ├── Left column (charts, incident log)
        └── Right column (sessions, success plan, intake)
    └── AI Panel (full width, --olive-800, 3-column grid inside)
        ├── Problem analysis
        ├── Next session guide
        └── Interventions + Ask AI
```

### 4.3 Owner Analytics Page

```
Main
├── Topbar (period toggle + filter + export)
└── Content (padding: 18px 20px, flex column, gap: 16px)
    ├── Impact banner (full width, --olive-800, flex row: copy + stats)
    ├── KPI row (5 columns)
    ├── Primary grid (1fr 320px)
    │   ├── Left: Cohort chart + type/suspension split (2-col inner)
    │   └── Right: District table + counselor table
    └── Insight row (3 columns)
```

### 4.4 F-Pattern Compliance

Every page layout must pass this test: cover the top-left quadrant and ask "can a new user understand the most important metric?" If no, the hierarchy is wrong.

- Top-left of every page: the headline number or primary status.
- Top-right: date range / period control / primary action button.
- Below the fold: detail, history, secondary data.
- Far right column: supporting context (AI panel, intake info, linked incidents).

---

## Part 5 — Motion and Interaction

Motion is a communication tool. Every animation must earn its place by communicating a state change.

### Permitted Animations

```
/* Micro-interaction — hover, focus, active state changes */
transition: all 150ms ease
/* Used on: buttons, nav items, card hover, input border color */

/* Data load — skeleton to content */
transition: opacity 200ms ease
/* Skeletons fade out as real data renders in */

/* Alert entrance — escalation banner */
animation: slideDown 180ms ease-out
/* Banner slides down from top on first appearance */

/* Success state — form submission */
transition: background 200ms ease, color 200ms ease
/* Button transitions from olive to green on success */

/* Page navigation */
transition: opacity 150ms ease
/* Subtle fade between route changes — never slide */
```

### Prohibited Animations

- Scale transforms on desktop cards on hover (reserve for mobile active state)
- Bounce, spring, or elastic easing — not appropriate for clinical/institutional context
- Animations over 400ms for any transition
- Spinning loaders except for async submit buttons
- Chart animations that replay on every render — animate once on mount only

---

## Part 6 — Cursor Implementation Rules

These rules are directives to the Cursor agent. They override defaults.

### Always Do

- Apply `font-family: 'DM Serif Display', Georgia, serif` to every student name, page title, and section heading.
- Apply `font-family: 'IBM Plex Mono', monospace` to every number in a data context: counts, percentages, dates in tables, durations, KPI values.
- Apply `font-family: 'Geist', system-ui, sans-serif` to all UI text, labels, nav, descriptions, button labels.
- Use `--surface-page` (#F2F4EE) as the page background — never pure white as the outermost background.
- Use `--surface-card` (#FFFFFF) for cards — the white lifts against the tinted background.
- Apply `font-size: 16px` minimum to all form inputs and textareas (prevents iOS Safari zoom on focus).
- Apply `tabular-nums` (CSS: `font-variant-numeric: tabular-nums`) to all IBM Plex Mono data cells in tables.
- Use semantic color tokens (`--color-success`, `--color-regression`, `--color-escalation`) — never hardcode hex values inside component files.
- Pair every color state with a non-color cue: icon, label, or shape. Color is never the only differentiator.
- Right-align all numeric table columns. Left-align all text columns. Center-align status badges.

### Never Do

- `font-family: Inter` — this system uses Geist for UI text.
- `border: 1px solid #ccc` on cards — use tonal elevation instead.
- `border-radius: 0` on any container — minimum `--radius-sm` (4px).
- Generic Chart.js default colors — override every chart with the semantic color series.
- Render student names in Geist Sans — they always get DM Serif Display.
- Use `color: gray` or `opacity: 0.5` for muted text — use the explicit text tier tokens.
- Put more than 6 KPI cards in the top row — information overload begins at 7.
- Use a pie chart for incident type breakdown — always use stacked bar or grouped bar.
- Dismiss the escalation banner without a confirmed acknowledgment action.
- Compute chart data, goal completion rates, or incident aggregations client-side.

---

## Part 7 — The Test

Before any screen is considered complete, it must pass all five questions:

1. **5-Second Test:** Can a new user identify the primary metric or action within 5 seconds without scrolling?
2. **Typography Test:** Are there three visible typographic tiers on the page — serif heading, sans UI, mono data — each doing their distinct job?
3. **Color Test:** Is color used sparingly, with each color firing only once for its semantic purpose? Is there any element where color is the only differentiator between states?
4. **Depth Test:** Is the page-to-card-to-inner-component tonal hierarchy visible? Does the white card lift off the page background?
5. **Escalation Test:** If `escalation_flag === true` for any visible student, is the safety alert the most visually dominant element on the screen?

If any answer is no, the screen is not done.

---

*Operation Scholars OS · Design Brief v2 · QuasarNova LLC · April 2026*
*Prepared by: Solutions UI/UX Designer · For implementation by: Solutions Engineer via Cursor*