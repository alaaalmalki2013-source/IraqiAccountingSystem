# Design Guidelines: Iraqi Accounting System (نظام المحاسبة العراقي)

## Design Approach

**Selected Approach:** Design System-Based (Material Design 3 + Modern Enterprise Dashboard Patterns)

**Justification:** Data-intensive accounting application requiring exceptional clarity, efficiency, and visual appeal. Inspired by modern SaaS dashboards (Linear, Stripe Dashboard, Notion) with Material Design 3's dynamic color system for comprehensive dark mode support.

**Key Design Principles:**
1. **Visual Clarity:** Financial data presented with modern gradients and color-coded hierarchy
2. **Dark Mode Excellence:** Sophisticated dual-theme system with vibrant accent colors
3. **RTL Mastery:** Flawless right-to-left Arabic experience
4. **Modern Aesthetics:** Contemporary gradients, shadows, and color treatments
5. **Professional Trust:** Polished interface inspiring confidence

---

## Core Design Elements

### A. Color Palette

**Light Mode:**

Primary Colors:
- Primary: 220 90% 56% (Vibrant Blue)
- Primary Hover: 220 90% 48%
- Secondary: 280 65% 60% (Purple)
- Accent: 180 70% 50% (Turquoise)

Functional Colors:
- Revenue: 142 76% 36% (Green)
- Expense: 0 84% 60% (Red)
- Warning: 38 92% 50% (Amber)
- Info: 217 91% 60% (Blue)

Surfaces:
- Background: 220 15% 98%
- Card: 0 0% 100%
- Card Hover: 220 20% 99%
- Border: 220 13% 91%
- Divider: 220 13% 88%

Text:
- Primary: 220 15% 15%
- Secondary: 220 10% 45%
- Tertiary: 220 8% 60%

**Dark Mode:**

Primary Colors:
- Primary: 220 85% 65% (Brighter Blue)
- Primary Hover: 220 85% 72%
- Secondary: 280 60% 68% (Lighter Purple)
- Accent: 180 65% 58% (Brighter Turquoise)

Functional Colors:
- Revenue: 142 70% 45%
- Expense: 0 78% 68%
- Warning: 38 88% 58%
- Info: 217 85% 68%

Surfaces:
- Background: 220 15% 8%
- Card: 220 12% 12%
- Card Hover: 220 12% 15%
- Border: 220 10% 22%
- Divider: 220 8% 18%

Text:
- Primary: 0 0% 98%
- Secondary: 220 5% 75%
- Tertiary: 220 5% 60%

**Gradient Definitions:**

Dashboard Cards (Light):
- Blue Gradient: from 220 100% 96% to 220 100% 92%
- Purple Gradient: from 280 100% 97% to 280 100% 94%
- Turquoise Gradient: from 180 100% 96% to 180 100% 92%
- Multi Gradient: from 220 100% 96% via 280 100% 96% to 180 100% 96%

Dashboard Cards (Dark):
- Blue Gradient: from 220 50% 18% to 220 40% 14%
- Purple Gradient: from 280 45% 18% to 280 35% 14%
- Turquoise Gradient: from 180 45% 18% to 180 35% 14%
- Multi Gradient: from 220 40% 16% via 280 40% 16% to 180 40% 16%

### B. Typography

**Font Families:**
- Primary Arabic: 'Cairo', 'Noto Sans Arabic', sans-serif
- Numbers/Data: 'IBM Plex Sans Arabic', 'Tajawal', sans-serif

**Hierarchy:**
- Page Headers: text-3xl font-bold
- Section Headers: text-2xl font-semibold
- Card Titles: text-xl font-medium
- Metric Numbers: text-4xl font-bold
- Body Text: text-base
- Table Headers: text-sm font-semibold uppercase tracking-wide
- Helper Text: text-xs

**Number Formatting:** Bold, larger sizes for financial amounts with comma separators and "د.ع" suffix

### C. Layout System

**Spacing Scale:** Tailwind units of **2, 4, 6, 8, 12, 16, 20**

Component Spacing:
- Card padding: p-6 to p-8
- Section spacing: space-y-8
- Dashboard grid gaps: gap-6
- Form field gaps: gap-4

**Container Widths:**
- Dashboard: max-w-full with px-6 lg:px-8
- Forms/Modals: max-w-3xl
- Reports: max-w-7xl

**Grid Layouts:**
- Stat Cards: grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6
- Filter Cards: grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4
- Data Tables: Full width responsive

### D. Component Library

**Navigation Sidebar:**
- Fixed right (RTL), width 72-80
- Light: bg-white shadow-xl border-l
- Dark: bg-[220 12% 12%] border-l border-[220 10% 22%]
- Active: Gradient background with icon color matching section theme
- Icons: 24px Lucide icons with vibrant colors (blue/purple/turquoise based on section)
- Hover: Subtle background tint with scale transform

**Dashboard Metric Cards:**
- Gradient backgrounds per category
- Large icon (48px) in colored circle with shadow
- Metric number: text-4xl font-bold
- Label: text-sm with secondary text color
- Trend indicator: Colored arrow with percentage
- Shadow: Light mode (shadow-lg), Dark mode (shadow-2xl with glow)
- Rounded: rounded-2xl
- Border: 1px subtle in dark mode for definition

**Filter Section:**
- Modern card design: rounded-xl with gradient background
- Light: White with colored gradient overlay at 5% opacity
- Dark: Elevated card with subtle gradient
- Soft shadows: shadow-md hover:shadow-lg
- Input fields with colored focus rings matching theme
- Date pickers, dropdowns, and search in horizontal layout
- Icons: Colored to match section theme

**Tables:**
- Header: Gradient background subtle, sticky positioning
- Rows: Alternating transparent/subtle tint
- Hover: Colored tint (blue/purple/turquoise at 8% opacity)
- Cell padding: px-6 py-4
- Borders: Subtle dividers between rows
- Action buttons: Icon-only with colored hover backgrounds
- Currency columns: Bold, right-aligned with monospace numbers

**Forms & Inputs:**
- Light: bg-white border-2 border-gray-200
- Dark: bg-[220 12% 15%] border-[220 10% 25%]
- Focus: Colored ring (2px) matching section theme
- Labels: font-medium with required indicator
- Validation: Colored borders and helper text

**Buttons:**

Primary:
- Light: Gradient from primary to primary-hover with shadow-md
- Dark: Bright gradient with enhanced shadow and subtle glow
- Text: White, font-semibold
- Padding: px-8 py-3, rounded-lg
- Hover: Scale 1.02 with enhanced shadow

Secondary:
- Light: bg-gray-100 hover:bg-gray-200
- Dark: bg-[220 10% 20%] hover:bg-[220 10% 25%]
- Colored text matching theme

Icon Buttons:
- Circular, colored backgrounds on hover
- 40px minimum touch target

**Modals:**
- Overlay: backdrop-blur-md
- Light: bg-black/40
- Dark: bg-black/60
- Content: Matching theme with rounded-2xl and enhanced shadows
- Header with colored accent border-bottom
- Footer with button alignment (RTL)

**Charts & Visualizations:**
- Chart.js with gradient fills
- Color scheme: Blue/Purple/Turquoise based on data category
- Grid lines: Subtle, matching theme
- Tooltips: Matching card style with gradients
- Legend: Arabic labels with colored indicators

**Status Badges:**
- Rounded-full with gradient backgrounds
- Light: Colored background at 15% with bold text
- Dark: Colored background at 25% with bright text
- Icons paired with status text
- Shadow for depth

**Empty States:**
- Large colored icon (96px) with gradient
- Heading and descriptive text
- Call-to-action button with gradient
- Centered layout with breathing room

### E. Animations

**Subtle & Modern:**
- Hover transitions: 200ms ease-in-out
- Button hover: scale-[1.02] with shadow enhancement
- Card hover: shadow-lg transition
- Modal enter: fade + scale from 95% over 250ms
- Loading states: Gradient shimmer effect
- Success feedback: Colored checkmark with bounce (400ms)
- Tab transitions: Smooth color fade
- NO scroll-based animations

---

## Dark Mode Implementation

**Strategy:** CSS variables with Tailwind dark: variant throughout

**Toggle Control:**
- Persistent preference in localStorage
- Icon button in header (sun/moon)
- Smooth transition on theme change (150ms)

**Consistency Rules:**
- All form inputs styled for both modes
- Shadows enhanced in dark mode with subtle glows
- Gradients optimized per mode (lighter in light, vibrant in dark)
- Icons maintain colored vibrancy in both modes
- Charts adapt colors for optimal contrast

---

## RTL Excellence

- Root dir="rtl"
- Text alignment: text-right default
- Sidebar: Fixed right side
- Table actions: Far right column
- Form labels: Above or right of inputs
- Icons: Right side of labels
- Number inputs: LTR direction for numeric entry
- Dropdowns: Open leftward

---

## Accessibility

- Contrast: 4.5:1 minimum (enhanced in dark mode)
- Focus rings: 2px colored, visible on all interactive elements
- Touch targets: 44px minimum
- ARIA labels: Complete coverage
- Keyboard navigation: Full support with logical tab order
- Error messages: Clear, actionable Arabic text
- Confirmation dialogs: All destructive actions

---

## Visual Enhancements

**Shadows:**
- Light cards: shadow-md default, shadow-lg hover
- Dark cards: shadow-xl with subtle colored glow
- Modals: shadow-2xl

**Borders:**
- Light: 1px subtle gray
- Dark: 1px to define elevated surfaces

**Colored Iconography:**
- Section icons: Blue (accounting), Purple (reports), Turquoise (inventory)
- Consistent color mapping across all sections
- 24px standard, 48px for stat cards

**Glass Effects:**
- Filter sections: Subtle backdrop-blur
- Modal overlays: backdrop-blur-md
- Hover states: Slight opacity changes