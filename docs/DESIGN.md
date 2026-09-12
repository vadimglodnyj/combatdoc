# CombatDOC Design System

## Design Concept: Mobile-First Adaptive (chosen)

**Decision:** CombatDOC is built **mobile-first**. The unit medic often works
from a phone in the field, so every screen must be fully usable at ~360–414px
width, and desktop is treated as a progressive enhancement — never the
baseline.

This is the single agreed design direction for the app. The enforceable,
day-to-day checklist lives in `.cursor/rules/mobile-first-ui.mdc` (auto-applied
when editing `apps/web`). This section explains *why*; that rule explains *how*.

### Principles

1. **Mobile-first CSS.** Base styles target the phone; complexity is added
   upward with `min-width` breakpoints only. No desktop-first + `max-width`
   patching.
2. **No data tables.** `nz-table` / HTML `<table>` / fixed multi-column grids
   are banned for collections — they break on phones. Collections render as a
   vertical stack of **card tiles** (`.tile-stack` + `.data-tile`), and
   key/value detail uses **field chips** (`.field-list` + `.field`). Both live
   in `apps/web/src/styles/_data.scss` and already reflow 1 → 2 → 3 columns.
3. **One canonical page scaffold.** Every list screen uses the shared
   `.page-list` classes (`__header`, `__filters`, `__meta`, `__pager`) instead
   of per-feature layout classes. `members-list` is the reference implementation.
4. **Touch ergonomics.** ≥44px targets, `tel:` links, wrapping/full-width
   filters, reachable primary actions.
5. **Adaptive navigation.** Sidebar collapses to a drawer under 768px
   (already wired in `core/layout`).
6. **Breakpoints** (aligned with the NG-ZORRO grid): `xs`<576, `sm`≥576,
   `md`≥768 (primary switch), `lg`≥992, `xl`≥1200.
7. **Reference the NG-ZORRO demos first.** Before building or changing any
   component, open its official demo at [ng.ant.design](https://ng.ant.design/components/overview/en)
   (e.g. `modal`, `upload`, `form`, `list`, `tag`, `date-picker`) and use the
   exact, versioned Angular code (imports, module, template) — then adapt it to
   these mobile-first conventions. Match NG-ZORRO 17 as used in `apps/web`.

### Why not classic dense tables?

The old Medhar workflow leaned on wide desktop tables. On a phone those force
horizontal scroll and tiny tap targets. Card tiles keep the same information
(title + status tags + meta) in a thumb-friendly, vertically-scrolling stack,
while still supporting a multi-column tile grid on large screens — so desktop
density is preserved without a table.

## UI Theme Lock (Ant Design Pro)

### Layout Configuration

Following Ant Design Pro-style settings for enterprise application layout:

- **Layout Type**: Side menu classic
  - Left sidebar navigation (250px width, collapses to 80px)
  - Top header (64px height, fixed)
  - Main content area (fluid width, full content area)

- **Fixed Elements**:
  - ✅ Fixed Header: true
  - ✅ Fixed Sidebar: true
  - On mobile (&lt;768px): sidebar collapses to drawer/trigger

- **Content Width**: Fluid
  - Content uses full available width of the content area
  - Not constrained to a fixed narrow column

### Theme Color: Golden Purple

**Primary Color**: `#722ED1` (Ant Design Pro "goldenPurple" preset)

This rich purple color is applied as the primary/accent color throughout the application:

- ✅ Primary buttons background
- ✅ Active menu item highlight (rgba overlay + border accent)
- ✅ Links and interactive elements
- ✅ Focus rings and input borders on hover
- ✅ Tag accents for status indicators
- ✅ Form controls (checkboxes, radio buttons)

**Background Strategy**: Keep enterprise light surfaces
- Body background: `#f0f2f5` (light gray)
- Component background: `#ffffff` (white cards/panels)
- Header/Sidebar: `#001529` (dark blue-gray, Ant Design default)
- Purple is used for accents and interactive elements — NOT a purple wallpaper

### Implementation

**Theme configuration location**:
- `apps/web/src/styles.scss` — Global styles with Inter font import, purple primary color, NG-ZORRO component font inheritance
- `apps/web/src/theme.less` — Ant Design Less variables override (Inter font-family + golden purple)
- `apps/web/src/app/app.module.ts` — NZ_CONFIG provider for NG-ZORRO theme
- `apps/web/src/app/core/layout/layout.component.scss` — Layout positioning (fixed header/sidebar)
- `apps/web/package.json` — `@fontsource-variable/inter` dependency (self-hosted, no Google Fonts runtime)

**Key CSS classes**:
- `.menu-sidebar` — Fixed left sidebar with overflow scroll
- `.app-header` — Fixed header at top
- `.main-layout` — Main content area with margin-left for sidebar
- `.inner-content` — White content cards with border-radius

### Responsive Behavior

- **Desktop (≥768px)**: Side menu visible, fixed header, fluid content
- **Mobile (&lt;768px)**: 
  - Sidebar hidden by default (drawer mode)
  - Trigger button to show/hide sidebar
  - Full-width content
  - Fixed header remains

### Typography & Spacing

**Font**: Inter (variable font, self-hosted via `@fontsource-variable/inter`)
- Excellent Ukrainian Cyrillic support
- Weights: 400–700 (variable font includes full range)
- Fallbacks: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- Features: ligatures (`liga`) and contextual alternates (`calt`) enabled

**Spacing**:
- Base font size: 14px
- Header height: 64px
- Sidebar width: 250px (expanded), 80px (collapsed)
- Content padding: 24px
- Card border-radius: 4px

### Component Library

- **UI Framework**: NG-ZORRO (Angular port of Ant Design)
- **Icons**: Ant Design Icons
- **Locale**: Ukrainian (`uk_UA`)
- **Date formatting**: `date-fns` with Ukrainian locale

### Design References

Inspired by Ant Design Pro:
- Layout: https://pro.ant.design/ (side menu template)
- Theme: Golden Purple preset from Ant Design color system
- Component patterns: Ant Design component library best practices

## Feature-Specific Patterns

### Service Members (Особовий склад)
- **List View**: картки (ПІБ, теги статусу, звання / підрозділ / посада / телефон) на всіх ширинах екрана. Без `nz-table`.
- **Detail Page**: профіль з полем-чіпами (`field-list`) + вкладки. Епізоди — окремі плитки з кольоровою лівою смугою (бойовий / небойовий), не вкладені білі картки.
- **Forms**: модалка з `nz-form` (на мобільному на всю ширину).

### Excel Import (Імпорт)
- Drag-and-drop (`nz-upload`)
- Прев’ю рядків як вибіркові картки (без широкої таблиці)
- Банери помилок / успіху

### Status Indicators
- Episode nature: `nz-tag` with color coding (red=COMBAT, blue=SOMATIC)
- Episode status: `nz-tag` with color coding (green=active, gray=closed)
- Import row status: `nz-badge` with dot indicators (success/warning/error)

## Next Steps

- [ ] Extend theme to other modules as they are implemented
- [ ] Add dark mode toggle (future iteration)
- [ ] Додати картки консультацій і сегментів, коли з’явиться логіка
- [ ] Create reusable component library for common patterns
