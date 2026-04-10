# Drawer Menu & Profile Menu — Design Spec
**Date:** 2026-04-04

## Overview

Two interactive header controls currently render as non-tappable elements:
1. The hamburger (☰) icon — should open a slide-out navigation drawer
2. The profile avatar — should open a "Sign out" dropdown

Both appear on the Home screen. The hamburger also appears on the Cards screen. Neither the Payments nor Settings screens have these header controls.

---

## 1. Slide-out Drawer

### Behaviour
- Tapping the hamburger icon slides in a panel from the left edge
- Tapping the dimmed backdrop (right of drawer) closes it
- Navigating to a new page also closes it
- Spring animation on open (`tension: 65, friction: 11`), timing on close (200ms)
- Backdrop fades in/out alongside the panel

### Visual Design
- **Width:** 280px
- **Header area:** Cream background (`#F5F4ED`) with the official SpendStretch logo and tagline "Swipe smarter. Pay later." A 3px `#0A84FF` border runs along the bottom of the header to add brand presence
- **Logo rendering:** Matches the official SVG — "Spend" in `#141413` weight 500, `<` and `>` in `#0A84FF` weight 400, "Stretch" letters in `#0A84FF` weight 500 with letter-spacing
- **Nav items:** White background, each item is icon + label in a rounded row
- **Active page row:** `#E8F4FD` background tint, label and icon in `#0A84FF`; inactive rows use `#1C1C1E` text and `#8E8E93` icon
- **Shadow:** `shadowColor: #000, shadowOffset: {width: 2, height: 0}, shadowOpacity: 0.15, shadowRadius: 8, elevation: 8`

### Nav Items
| Label | Icon (MaterialIcons) | Route |
|-------|---------------------|-------|
| Home | `home` | `/(tabs)/` |
| Payments | `calendar-today` | `/(tabs)/payments` |
| My Cards | `credit-card` | `/(tabs)/cards` |
| Settings | `settings` | `/(tabs)/settings` |

### Active Page Detection
Use `usePathname()` from `expo-router` to determine which row to highlight. The Home tab returns `/` (not `/(tabs)/`), so the Home row match must explicitly check for `/` or empty string in addition to `/(tabs)/`.

### Component
`components/DrawerMenu.tsx` — accepts `visible: boolean` and `onClose: () => void` props. Uses a `Modal` (transparent, no animation) containing an `Animated.View` for the panel and a backdrop `TouchableWithoutFeedback`.

### Integration
- **Home screen** (`app/(tabs)/index.tsx`): add `drawerVisible` state; hamburger `TouchableOpacity.onPress` sets it true
- **Cards screen** (`app/(tabs)/cards/index.tsx`): same pattern

---

## 2. Profile Avatar Dropdown

### Behaviour
- Tapping the profile avatar in the Home screen header opens a small dropdown card
- Tapping anywhere outside closes it
- Only one option for now: **Sign out**
- Sign out triggers a native `Alert` confirmation before calling `supabase.auth.signOut()`

### Visual Design
- **Trigger:** Existing avatar circle (top-right of Home header); gains a `TouchableOpacity` wrapper and a highlighted border (`#0A84FF`) while the menu is open
- **Dropdown card:** Positioned in the Modal below the app header bar (aligned to the right margin, `right: 16`); white background, `borderRadius: 12`, subtle shadow and `#E5E5EA` border. Exact `top` offset measured from the top of the screen accounting for the safe area + header height (~56–60dp)
- **Row:** Logout icon (`MaterialIcons name="logout"`) + "Sign out" text in `#FF3B30`
- **Backdrop:** Transparent full-screen `TouchableWithoutFeedback` behind the card to catch outside taps

### Component
`components/ProfileMenu.tsx` — accepts `visible: boolean` and `onClose: () => void`. Uses a `Modal` with `animationType="fade"`.

### Integration
- **Home screen only** (`app/(tabs)/index.tsx`): add `profileMenuVisible` state; avatar `TouchableOpacity.onPress` sets it true

---

## 3. Shared Logo Component

The official logo ("Spend `<Stretch>`") already exists as inline JSX in `index.tsx`. To avoid duplication (drawer header also needs it), extract it into `components/SpendStretchLogo.tsx` accepting a `size` prop (font size in dp, defaults to `16`) that scales all text proportionally.

---

## 4. File Changes

| File | Change |
|------|--------|
| `components/DrawerMenu.tsx` | **New** — slide-out drawer |
| `components/ProfileMenu.tsx` | **New** — profile dropdown |
| `components/SpendStretchLogo.tsx` | **New** — extracted logo component |
| `app/(tabs)/index.tsx` | Wire drawer + profile menu; use logo component |
| `app/(tabs)/cards/index.tsx` | Wire drawer; use logo component |

---

## 5. Out of Scope

- No drawer on Payments or Settings screens (they have no hamburger)
- No additional profile menu options beyond Sign out
- No swipe gesture to open/close the drawer (tap only)
