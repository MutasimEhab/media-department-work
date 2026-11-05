# Design System Master — Media Department Work Management System
**Organization:** Hearing and Sight Association for Development and Social Rehabilitation  
**Status:** Canonical Visual Identity & UI Design System Master  
**Date:** 2026-10-31 / 2026-11-01  
**Generated via:** UI/UX Pro Max Skill + Media Department Design System v1.0

---

## 1. Product Context & Philosophy
- **Product Type:** Institutional Admin & Workforce Management System (Bilingual Arabic-first RTL, English LTR).
- **Core Archetype:** Clean Institutional Admin / Structured Productivity Tool.
- **Key Tenet:** High legibility, zero decorative clutter, WCAG 2.1 AA accessibility, instant form completion (<60s daily log), and crystal-clear task progression.

---

## 2. Color Palette & Semantic Tokens
*Strictly restricted to approved brand identity; no unapproved neon or ad-hoc accent colors.*

| Token | CSS Variable | Hex | Usage & Contrast Rule |
|---|---|---|---|
| **Primary Magenta** | `--color-primary` | `#C80893` | Primary action buttons, active tab indicators, key accents. Contrast with light gray is 4.34:1 (use on white surface 5.37:1 for normal text). |
| **Dark Plum** | `--color-secondary` | `#871281` | Topbars, primary brand headers, accessible focus rings (2px-3px), high-contrast secondary action. 6.97:1 on light gray. |
| **Charcoal** | `--color-text` | `#444444` | High-contrast body text, data table headers, icons, secondary details. 7.87:1 on light gray. |
| **Fresh Green** | `--color-success` | `#83C704` | Approved / completed badges (must be paired with dark text `#444444` for 4.70:1 contrast). |
| **Light Lime Green** | `--color-accent` | `#A9D203` | Non-text progress indicators, secondary badges with dark text (5.52:1 contrast). |
| **Light Gray** | `--color-bg` | `#E6E7E9` | Application base background, subtle card borders, muted dividers. |
| **Neutral White** | `--color-surface` | `#FFFFFF` | Card surfaces, modals, dropdown menus (*PROVISIONAL / PENDING STAKEHOLDER APPROVAL*). |
| **Border Gray** | `--color-border` | `#D5D7DC` | Clean card and input boundaries. |

---

## 3. Typography & Numerals
- **Approved Heading Font:** `AdvertisingExtraBold` (Display headings, prominent modal titles).
- **Approved Body & UI Font:** `Janna LT Regular` (Body, tables, inputs, captions) & `Janna LT Bold` (Card titles, badges, button text).
- **Numerals Rule:** Strictly Latin numerals `0 1 2 3 4 5 6 7 8 9` across Arabic and English interfaces, tables, dates, time, and badges.
- **Time Format:** 12-hour format (`09:15 ص` / `09:15 AM`) with configurable organization time zone.
- **Frozen Demo Date:** `2026-10-31`.

---

## 4. Spacing Scale & Elevation (Visual Density: 8 / Dashboard)
- **Base Grid:** 4px / 8px incremental scale (`4, 8, 12, 16, 20, 24, 32, 40, 48, 64px`).
- **Touch Targets:** Minimum `44px × 44px` on all mobile interactive elements.
- **Card Padding:** `20px` desktop, `16px` mobile.
- **Form Row Spacing:** `16px`.
- **Radii:** Input `8px`, Button `8px`, Card `12px`, Dialog `16px`, Badge `6px`.
- **Elevation:** Flat with subtle border separation (`1px solid #D5D7DC`); never apply shadows to logos.

---

## 5. UI/UX Pro Max Anti-Patterns to Avoid
1. **Never use emoji as functional or navigation icons:** Only use crisp SVG icons (Lucide vector set).
2. **Never convey status through color alone:** Always pair badges and states with clear text labels and icons.
3. **Never allow page-level horizontal scroll:** Responsive wrapping and card-list transforms on mobile (<768px).
4. **Never rely on hover-only interactions:** Touch targets must work predictably on touch screens and keyboards.
5. **Never use placeholder-only inputs:** Always provide visible, accessible `<label>` elements.
6. **No fabricated identities:** Strictly reuse the shared fictional demo user dataset (U-001 to U-008).
