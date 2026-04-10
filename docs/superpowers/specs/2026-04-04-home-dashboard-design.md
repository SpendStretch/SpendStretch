# Home Screen Dashboard — Design Spec
**Date:** 2026-04-04

## Overview

Redesign the home screen to show top 3 cards (collapsible to show all) followed by a "Your Financial Pulse" stats dashboard. Layout follows Option B: urgent alert banner first, then stacked stat rows.

---

## 1. Cards Section

### Default state
- Show only the **top 3** cards sorted by float (highest float first — existing sort)
- If there are more than 3 cards, show a pill button: **"Show N more cards ▾"** where N = total cards − 3
- Tapping the pill expands to show all cards inline (no separate screen)
- Once expanded, the pill changes to **"Show less ▲"** and collapses back to 3 on tap

### If ≤ 3 cards
- Show all cards, no pill button

---

## 2. "Your Financial Pulse" Section

Appears below the cards section (pill button or last card), separated by a centered divider label.

### Data fetched
The home screen currently fetches only `is_paid=false AND payment_due_date >= today`. This must be extended to also fetch **overdue cycles** (`is_paid=false AND payment_due_date < today`) to power the dashboard stats.

Fetch strategy: two queries merged client-side:
1. Existing: unpaid future cycles (`payment_due_date >= today`)
2. New: unpaid overdue cycles (`is_paid=false AND payment_due_date < today`)

Also fetch paid cycles for the current calendar month to populate the "Paid" count in the breakdown.

### Tiles (top to bottom)

#### A. Overdue Alert Banner (conditional)
- Only shown if there are 1+ overdue cycles
- Red-tinted background (`#FFF2F2`), red border
- Shows: 🚨 icon, "N overdue payment(s)", total overdue amount
- If no overdue payments: omit entirely (no "all clear" message)

#### B. Next Payment + Total Owed (side-by-side row)
- **Left**: "Next Payment Due" label, dollar amount, card name + "in N days" or "overdue"
- **Right**: "Total Owed" label, sum of all unpaid balances, "across N cards" subtitle
- Background: `#F2F2F7`, rounded card

#### C. Credit Utilization Bar
- Label "Credit Utilization" + percentage value (right-aligned, color-coded)
- Gradient progress bar: green → orange as % increases
- Color thresholds: ≤30% green (`#34C759`), 31–60% orange (`#FF9500`), >60% red (`#FF3B30`)
- Subtitle: "$X,XXX / $X,XXX limit"
- Only shown if at least one card has a `credit_limit` set

#### D. This Month Payment Breakdown
- Label "This Month"
- Proportional colored bar (segments: overdue=red, due_soon=orange, upcoming=blue, paid=green)
- Legend row: "N Overdue · N Due Soon · N Upcoming · N Paid"
- Counts are for the **current calendar month** only

### Empty state
If the user has no billing cycles at all, the entire "Financial Pulse" section is omitted.

---

## 3. Data Model Changes

No schema changes. All stats derived from existing `billing_cycles` and `cards` tables.

New computed values in `fetchCards()`:
- `overdueCycles`: `is_paid=false AND payment_due_date < today`
- `paidThisMonth`: `is_paid=true AND payment_due_date` within current calendar month
- `nextDueCycle`: earliest `payment_due_date` among all unpaid cycles (overdue or future)
- `totalOutstanding`: sum of `(statement_balance - amount_paid)` for all unpaid cycles
- `totalLimit`: sum of `credit_limit` for all active cards with a limit set
- `utilizationPct`: `totalOutstanding / totalLimit * 100`
- `breakdownCounts`: `{ overdue, dueSoon, upcoming, paid }` for current month. Thresholds match the Payments screen: `overdue` = past due, `dueSoon` = due within 7 days, `upcoming` = due >7 days out, `paid` = `is_paid=true`

---

## 4. File Changes

| File | Change |
|------|--------|
| `app/(tabs)/index.tsx` | Add show-more state, dashboard section, extended data fetch |

No new components needed — dashboard tiles are inline JSX within the home screen.

---

## 5. Out of Scope
- No charts/graphs (bar/line over time) — counts and numbers only
- No "average float" tile (requires historical data not currently stored)
- No tap interactions on dashboard tiles (they are read-only stats)
