# Feature Landscape: Estimation Schemes

**Domain:** Planning poker estimation scheme selection
**Researched:** 2026-04-04
**Scope:** Milestone — adding customizable estimation schemes to an existing planning poker app

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Preset Fibonacci scheme | Industry standard; every competing tool includes it; teams default to it | Low | Already exists as hardcoded values — this milestone makes it explicit |
| Preset T-shirt sizes (XS/S/M/L/XL/XXL) | Second most common scale after Fibonacci; teams that don't use story points expect it; Wikipedia and multiple sources confirm it as standard | Low | Values are static and well-known |
| Preset Simple numeric (1-5) | Common for teams new to estimation or using very coarse granularity | Low | Short fixed list |
| Custom scheme entry | Expected by any team with a non-standard scale; all major competing tools (PlanningPoker.com, PlanningPoker.live, AgileBox) offer this | Medium | Input validation is the hard part |
| ? (unsure) meta-card | Standard across physical and digital decks; signals "need more info before estimating"; Wikipedia documents it as a conventional card | Low | Toggle, not part of scheme definition |
| Coffee break meta-card | Standard convention; signals "I need a break"; documented in Wikipedia and multiple tool glossaries | Low | Toggle, not part of scheme definition |
| All session participants see the same card set | Core correctness requirement; a joiner seeing different cards than the host breaks the entire estimation mechanic | Medium | Requires scheme propagation via joinSession response |
| Vote validation against session scheme | Server must reject votes that are not in the active scheme; prevents stale client state from submitting invalid estimates | Medium | Replace hardcoded `LEGAL_ESTIMATES` with per-session lookup |
| Scheme defaults to Fibonacci | Backwards compatibility; existing flows must not break; teams who don't configure a scheme get the current experience | Low | Default param on createSession |
| Card labels match scheme values in results | Results chart and table must show T-shirt labels or custom values, not numeric indexes | Low | ResultsChart/ResultsTable already work on string keys per spec |

---

## Differentiators

Features that set a product apart. Not universally expected, but valued when present.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Meta-card toggles (host-controlled) | Not all teams want ? or Coffee cards; making them opt-out gives control without removing the default; no competing tool prominently surfaces this as a host control | Low | Two boolean switches on CreateGame |
| Custom value validation with real-time feedback | Poor UX in many tools (silent rejection or post-submit error); showing character count, dupe warnings, and value count inline makes custom entry less error-prone | Medium | Client-side only; server re-validates |
| Scheme locked for session duration | Prevents mid-session drift where host changes scheme and invalidates votes already cast; simplifies mental model for participants | Low | State decision, not a feature users explicitly request — but absence causes confusing bugs |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Saving custom schemes for reuse | Requires persistent storage (database or user account), neither of which exists; adds account/auth complexity disproportionate to benefit for this milestone | Accept custom values per-session; log it as a future backlog item |
| Changing scheme mid-session | Invalidates any votes already cast in the current round; forces a reset; complicates server state (which scheme is "current"?); no standard pattern across competing tools | Lock scheme at createSession; if different scheme needed, start a new session |
| Per-round scheme switching | Even more complex than mid-session switching; no evidence this is expected by users | Out of scope |
| Infinity card as a meta-card | Wikipedia and some tools include ∞ as a meta-card meaning "too large to estimate"; Fibonacci preset already includes it as a value, making a separate toggle confusing | Keep ∞ as a Fibonacci preset value only; do not add as a separate toggle |
| Card colors or visual themes per scheme | Cosmetic; adds frontend complexity with no estimation value | Not in scope for this milestone |
| Import/export of custom schemes (CSV/JSON) | Useful for power users; disproportionate complexity for first iteration | Defer; save-for-reuse feature above covers the primary use case |
| Deck builder UI (label/value separation) | PlanningPoker.com separates display label from numeric value for averaging; planning-poker.up.railway.app is a qualitative tool where averaging mixed types (T-shirt, custom text) is not meaningful | Custom values are display strings only; no hidden numeric value needed |
| AI-suggested estimates or estimate analytics | Multiple tools (Zenhub, Kollabe) are moving here; out of scope for this milestone and adds external dependencies | Future milestone |

---

## Feature Dependencies

```
Preset scheme selection (fibonacci/tshirt/simple)
  -> createSession accepts schemeType param
  -> joinSession returns schemeType + values
  -> Redux store holds scheme state
    -> Vote.jsx resolves card list from Redux
    -> VoteController validates against session scheme (not hardcoded)
    -> Results display uses scheme values as labels (already works)

Custom scheme entry
  -> Depends on: createSession accepting schemeType=custom + customValues
  -> Depends on: server-side validation of customValues (length, dupes, chars)
  -> Depends on: joinSession returning customValues for custom sessions
  -> Depends on: Vote.jsx custom-scheme branch

Meta-card toggles (?, Coffee)
  -> Orthogonal to scheme type — applies to all schemes
  -> createSession accepts includeUnsure + includeCoffee
  -> joinSession returns these booleans
  -> Vote.jsx conditionally appends meta-cards to card list
  -> VoteController includes meta-card values in legal set when toggles are on
```

---

## MVP Recommendation

All items in the Table Stakes section are required for a correct, shippable feature. The spec already defines all of them. Do not defer any table-stakes item.

From Differentiators, prioritise:

1. **Meta-card toggles** — low complexity, already in the spec, visible host control
2. **Custom value validation with real-time feedback** — medium complexity, prevents the most common failure mode (users submitting a broken custom deck)

Defer:

- **Scheme locked for session duration** — this is a constraint, not a user-visible feature; it is implicitly satisfied by storing scheme at createSession time and never updating it. No extra work needed beyond the core implementation.
- Everything in Anti-Features — revisit in a future milestone after real usage data.

---

## Confidence Assessment

| Area | Confidence | Basis |
|------|------------|-------|
| Standard preset schemes (Fibonacci, T-shirt, Simple) | HIGH | Wikipedia, multiple official tool docs, consistent across all sources |
| Meta-cards (?, Coffee) meaning and conventions | HIGH | Wikipedia, PlanningPoker.live glossary, multiple tool descriptions |
| Custom deck as table stakes | HIGH | All major competing tools offer it; multiple 2025 comparison articles confirm |
| Save-for-reuse as deferred, not table stakes | MEDIUM | Competing tools offer it but it requires persistence; this app is in-memory only |
| Scheme-locking as the standard pattern | MEDIUM | No competing tool documentation explicitly describes a "locked" state; conclusion drawn from absence of "change mid-session" patterns in search results |
| Deck label/value separation being unnecessary here | MEDIUM | PlanningPoker.com docs describe this; judgment call that it does not apply to a qualitative tool |

---

## Sources

- Wikipedia — Planning poker: https://en.wikipedia.org/wiki/Planning_poker
- PlanningPoker.live glossary: https://planningpoker.live/glossary
- AgileBox blog — customize your planning poker deck: https://agilebox.app/blog/customize-planning-poker-deck/
- PlanningPoker.com deck builder docs: https://www.planningpoker.com/answer/using-the-deck-builder/
- Parabol — 5 Best Planning Poker Tools 2025: https://www.parabol.co/blog/best-planning-poker-tools/
- Kollabe — Best Free Planning Poker Tools 2026: https://kollabe.com/posts/best-free-planning-poker-tools
- TeamRetro — Best Planning Poker Tools 2026: https://www.teamretro.com/best-planning-poker-tools-for-agile-teams/
- Zenhub — Best Planning Poker Tools 2025: https://www.zenhub.com/blog-posts/best-planning-poker-tools-for-2025-from-free-to-enterprise
