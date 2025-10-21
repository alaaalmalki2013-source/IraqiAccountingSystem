# Design Guidelines: Iraqi Accounting System (نظام المحاسبة العراقي)

## Design Approach

**Selected Approach:** Design System-Based (Material Design + Enterprise Accounting Best Practices)

**Justification:** This is a data-intensive, utility-focused accounting application where clarity, efficiency, and trustworthiness are paramount. Drawing inspiration from established accounting platforms (QuickBooks, Xero, Wave) combined with Material Design principles for data-rich interfaces.

**Key Design Principles:**
1. **Clarity First:** Financial data must be immediately readable and unambiguous
2. **RTL Excellence:** Seamless right-to-left Arabic experience throughout
3. **Professional Trust:** Conservative, stable design that inspires confidence
4. **Efficient Workflows:** Minimize clicks, optimize form layouts for speed
5. **Data Hierarchy:** Clear visual distinction between primary and secondary information

---

## Core Design Elements

### A. Color Palette

**Primary Brand Colors:**
- **Primary:** 13 58% 45% (Teal - professional, trustworthy)
- **Primary Hover:** 13 58% 38%
- **Secondary:** 220 13% 20% (Charcoal - for text/headers)

**Functional Colors:**
- **Revenue/Income:** 142 76% 36% (Green)
- **Expense/Cost:** 0 84% 60% (Red)
- **Warning/Pending:** 38 92% 50% (Amber)
- **Info/Neutral:** 217 91% 60% (Blue)
- **Success:** 142 71% 45%

**Background & Surfaces:**
- **Page Background:** 220 13% 97% (Light gray)
- **Card/Surface:** 0 0% 100% (White)
- **Border:** 220 13% 91%
- **Hover State:** 220 13% 95%

**Category-Specific Colors** (as defined in code):
- Expenses: Yellow-100/800, Red-100/800, Purple-100/800
- Revenues: Teal-100/800

### B. Typography

**Font Families:**
- **Primary Arabic:** 'Cairo', 'Noto Sans Arabic', sans-serif (Google Fonts)
- **Numbers/Data:** 'IBM Plex Sans Arabic', 'Tajawal', sans-serif
- **Monospace (for amounts):** 'Courier New', monospace

**Hierarchy:**
- **Page Headers:** text-2xl font-bold (1.5rem)
- **Section Headers:** text-xl font-semibold (1.25rem)
- **Card Titles:** text-lg font-medium (1.125rem)
- **Body Text:** text-base (1rem)
- **Table Headers:** text-sm font-semibold uppercase tracking-wide
- **Table Data:** text-sm
- **Helper Text:** text-xs text-gray-600

**Financial Numbers:** Always bold or semi-bold, larger size for primary amounts (text-lg to text-2xl for dashboard metrics)

### C. Layout System

**Spacing Scale:** Use Tailwind units of **2, 4, 6, 8, 12, 16** consistently
- Component padding: p-4 to p-6
- Section spacing: space-y-6 to space-y-8
- Card margins: m-4
- Form field gaps: gap-4

**Container Widths:**
- **Full Dashboard:** max-w-full with px-4 to px-8
- **Forms/Modals:** max-w-2xl to max-w-4xl
- **Reports:** max-w-7xl

**Grid Layouts:**
- **Dashboard Cards:** grid-cols-1 md:grid-cols-2 lg:grid-cols-4
- **Form Fields:** grid-cols-1 md:grid-cols-2 gap-4
- **Data Tables:** Full width with horizontal scroll on mobile

### D. Component Library

**Navigation:**
- **Sidebar:** Fixed right side (RTL), bg-white, width 64-72, shadow-lg
- **Mobile:** Collapsible hamburger menu (top-right)
- **Active State:** bg-teal-50 with border-r-4 border-teal-600
- **Icons:** Lucide icons at 20px, paired with Arabic labels

**Cards:**
- **Standard:** bg-white rounded-lg shadow-md p-6 border border-gray-200
- **Dashboard Metrics:** Include icon (40px), large number (text-3xl), label, and trend indicator
- **Hover:** shadow-lg transition-shadow duration-200

**Tables:**
- **Header:** bg-gray-100 text-gray-700 font-semibold sticky top-0
- **Rows:** Alternating bg-white/bg-gray-50, hover:bg-teal-50
- **Borders:** border-b border-gray-200
- **Cell Padding:** px-4 py-3
- **Action Buttons:** Icon-only buttons in last column (Edit/Delete) with hover:bg-gray-100 rounded

**Forms:**
- **Input Fields:** border-2 border-gray-300 rounded-md px-4 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-200
- **Labels:** text-sm font-medium text-gray-700 mb-1 block
- **Required Fields:** Red asterisk (*) after label
- **Validation Errors:** text-red-600 text-xs mt-1
- **Select Dropdowns:** Same styling as inputs with chevron icon

**Buttons:**
- **Primary:** bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md font-medium shadow-sm
- **Secondary:** bg-gray-200 hover:bg-gray-300 text-gray-800
- **Danger:** bg-red-600 hover:bg-red-700 text-white
- **Icon Buttons:** p-2 rounded-full hover:bg-gray-100 (for tables/actions)
- **Sizes:** Small (px-3 py-1.5), Medium (px-6 py-2), Large (px-8 py-3)

**Modals/Dialogs:**
- **Overlay:** bg-black/50 backdrop-blur-sm fixed inset-0
- **Content:** bg-white rounded-lg shadow-2xl max-w-2xl mx-auto mt-20 p-6
- **Header:** border-b border-gray-200 pb-4 mb-4 with close button (X)
- **Footer:** border-t border-gray-200 pt-4 mt-4 with action buttons aligned left (RTL)

**Dashboard Elements:**
- **Stat Cards:** Icon circle (bg-teal-100 text-teal-600), metric (text-3xl font-bold), label (text-sm text-gray-600), percentage change with up/down arrow
- **Charts:** Use Chart.js with teal/green/red color scheme, clean grid lines, Arabic labels
- **Filters:** Compact row with date pickers, category selects, search input - all inline on desktop

**Data Display:**
- **Currency Format:** Always show "د.ع." suffix, right-aligned in tables, comma separators
- **Dates:** Arabic format with Hijri option toggle
- **Status Badges:** Rounded-full px-3 py-1 text-xs font-semibold (green for paid/approved, yellow for pending, red for overdue)

**Inventory-Specific:**
- **Barcode Display:** Monospace font in bordered box
- **Stock Levels:** Color-coded (red < 10, yellow 10-20, green > 20)
- **Product Cards:** Image placeholder (if applicable), name, barcode, price, stock count

**Reports Section:**
- **Print Styles:** Clean, minimal, black text on white, company logo header
- **Export Buttons:** Grouped together (CSV, Print, PDF) with download icon
- **Report Headers:** Company name, report type, date range, generation timestamp

### E. Animations

**Minimal & Purposeful Only:**
- **Page Transitions:** None (instant for performance)
- **Modal Enter/Exit:** Fade in/out over 150ms
- **Hover States:** transition-colors duration-150
- **Loading States:** Spinning circle (border-t-transparent) with "جاري التحميل..." text
- **Success Feedback:** Brief green checkmark animation (500ms) on save/submit
- **NO complex scroll animations or decorative motion**

---

## RTL-Specific Guidelines

- All layouts use `dir="rtl"` on root element
- Text alignment: text-right by default
- Margins/Paddings: Use `mr/ml` carefully (reversed in RTL)
- Icons: Position on right side of text labels
- Form layouts: Labels above or to right of inputs
- Tables: Action column on far right
- Sidebar: Fixed on right side of viewport
- Dropdowns: Open to the left
- Number inputs: Consider LTR direction for numeric entry despite RTL context

---

## Accessibility & Usability

- **Contrast Ratio:** Minimum 4.5:1 for all text
- **Focus States:** Visible 2px teal ring on all interactive elements
- **Keyboard Navigation:** Full support with logical tab order
- **Screen Readers:** Proper ARIA labels for icons and dynamic content
- **Touch Targets:** Minimum 44px height for mobile buttons
- **Error Handling:** Clear, actionable error messages in Arabic
- **Confirmation Dialogs:** Required for all destructive actions (delete, cancel)

---

## Images

**No hero images required** - This is a functional dashboard application. Only use:
- **Company Logo:** Placeholder in top-right of sidebar and report headers
- **Empty States:** Simple illustrations for "no data" scenarios (optional, use icon + text instead)
- **Product Images:** In inventory system (optional, fallback to icon)