**1\. DESIGN PHILOSOPHY (The “Enterprise Calm” Standard)**

This dashboard must feel like the premium AI/mental-health dashboards in the reference screenshots you shared earlier — **exactly** the same DNA as the Universal UX Constraints document.

* **Bento-grid mastery** with generous negative space  
* **Large, soft border-radius** (never sharp corners)  
* **Depth via soft diffused shadows \+ background tints** (no 1px solid borders)  
* **Extreme typography contrast** (huge bold metrics vs tiny muted labels)  
* **Premium, trustworthy, and calm** — this is a tool used by counselors, school districts, and administrators who need clarity under pressure.

**Brand colors (locked)**

* Primary (Earthy Olive): \#5C6B46 — structural anchor, headers, active states  
* Accent (Warm Goldenrod): \#D6A033 — CTAs, progress bars, highlights, success states  
* Background: \#F8F5F0 (off-white canvas)  
* Cards: pure white \#FFFFFF with 3–5% overlay depth when nested  
* Text: \#1C2526 (deep charcoal) for primary, \#64748B (muted) for secondary

**Typography (exact)**

* Headings: **Instrument Serif** (or system fallback serif)  
* Data / metrics / mono: **IBM Plex Mono**  
* Body / UI: **Geist** (or Inter / SF Pro)

---

### **2\. GLOBAL SPATIAL & LAYOUT RULES (Bento System)**

Follow the **Universal UX Constraints** document 100%. No deviations.

* **Container padding**: 32px on all main cards  
* **Grid gap**: 24px (gap-6)  
* **Card border-radius**: 24px (rounded-3xl)  
* **Inner elements radius**: 12px  
* **Interactive elements**: fully rounded pills (rounded-full)  
* **Shadows**: 0 10px 40px \-10px rgba(0,0,0,0.08) only — never default browser shadows  
* **Separation**: background tint only (off-white canvas \+ white cards)  
* **Mobile**: 16–20px edge margins, edge-to-edge feel

**Layout Shell**

* Left sidebar (collapsible on mobile) — borderless, active item \= soft olive rounded background fill  
* Top bar: clean, search pill on left, user avatar \+ role badge on right  
* Main content: responsive 12-column bento grid

---

### **3\. DASHBOARD SHELL & NAVIGATION**

**Sidebar (Desktop)**

* Logo top: “Scholars OS” in Instrument Serif \+ olive shield icon  
* Navigation items:  
  * Dashboard (home)  
  * Students  
  * My Caseload (for counselors)  
  * Incidents  
  * Sessions  
  * Success Plans  
  * Reports  
  * AI Insights (owner/assistant only)  
* Bottom: role badge (“Owner”, “Assistant”, “Counselor – De’marieya Nelson”) \+ logout

**Mobile Bottom Nav**

Floating pill-style bar with soft top shadow (exactly like reference screenshots).

**Role-Based Views**

* Counselor: sees **only** assigned students (filtered at API \+ UI)  
* Owner/Assistant: full org view \+ cohort analytics

---

### **4\. KEY SCREENS — COMPONENT BLUEPRINT**

**4.1 Dashboard Home (Owner/Assistant View)**

Top row (hero bento):

* Large “Organization Impact” card (83% avg incident reduction) — huge bold metric \+ sparkline  
* “Active Students” count card  
* “This Month’s Sessions” card

Main bento grid (3×4 responsive):

* Student list table (clean, no vertical borders, faint horizontal dividers)  
* Incident Frequency Trend (smooth bezier line \+ baseline highlight)  
* Goal Completion Rate (rounded bar chart)  
* AI Flagged Students (priority list with escalation pills)

**4.2 Student Profile**

* Top: student name \+ grade \+ school badge \+ huge baseline reduction %  
* Tabs: Overview | Incidents | Sessions | Success Plan | AI Intelligence  
* Left column: quick stats (incident count, attendance rate, goal completion)  
* Right 70%: scrollable timeline of sessions \+ incidents (cards with soft shadows)  
* Prominent **AI Briefing Card** (olive accent border) — next session guide \+ recommended interventions

**4.3 Session Logging Form** (Critical UX)

* Opens as full-screen modal or side panel  
* **Everything pre-populated** except:  
  * Session summary (large textarea)  
  * Attendance status dropdown  
  * Duration (default 30\)  
  * Dynamic goals list (add/remove \+ met/not-met toggles)  
* “Link recent incidents” multi-select at bottom  
* Submit button \= goldenrod pill

**4.4 Progress Charts (Everywhere)**

* Smooth bezier lines \+ fading vertical gradient under line  
* Rounded bar tops  
* Horizontal-only faint dashed grids  
* Week / Month / Year toggle pills (top-right)  
* Baseline period always highlighted in light olive

---

### **5\. COMPONENT LIBRARY (Exact Specs)**

**Cards**

* bg-white rounded-3xl p-8 shadow-\[0\_10px\_40px\_-10px\_rgba(0,0,0,0.08)\]  
* Inner nested blocks: bg-white/60 backdrop-blur-md rounded-2xl p-6

**Metrics**

* Number: 48px Instrument Serif, font-weight 700, olive  
* Label: 13px Geist, muted \#64748B, uppercase tracking

**Buttons**

* Primary: goldenrod pill, white text, soft inner shadow on hover  
* Secondary: olive outline pill

**Tables**

* No vertical borders  
* Faint horizontal dividers only (border-b border-slate-100)  
* Row hover: soft olive background fill

**Progress / Status**

* Thick pill bars (8px height, fully rounded)  
* Tags: soft rounded blobs with light background

---

### **6\. ANIMATION & MICRO-INTERACTIONS (Subtle & Premium)**

* Card entry: gentle scale \+ fade on scroll (GSAP ScrollTrigger)  
* Chart drawing: line paths animate on load  
* AI card: soft glow pulse when new analysis arrives  
* Session form: fields slide up as they auto-populate  
* No over-the-top motion — everything feels calm and deliberate

---

### **7\. DO NOT DO (Anti-Generic Rules)**

* Never use 1px solid borders on cards  
* Never use default browser shadows  
* Never make all text the same weight/color  
* Never sharp 0px corners  
* Never clutter tables with vertical lines  
* Never generic blue “Save” buttons — always use brand goldenrod/olive

---

