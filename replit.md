# نظام المحاسبة العراقي - Iraqi Accounting System

### Overview
This project is a comprehensive Iraqi accounting system designed to manage revenues, expenses, inventory, employees, and payroll. It features a full Arabic RTL interface with a professional design, dark/light mode support, and aims to be a complete solution for financial management tailored for the Iraqi market. The system operates offline, storing data locally, and provides an intelligent AI assistant named "Alaa" specialized in guiding users through the system's functionalities.

### Recent Changes (October 20, 2025)
**Inventory Management Workflow Enhancement (v5.5 - Complete):**
- ✅ Removed direct "Add Item" functionality from Inventory page
- ✅ All inventory items must now be added through the Inventory Entry (الإدخال المخزني) workflow
- ✅ Ensures proper purchase tracking and invoice management for all inventory items
- ✅ Simplified Inventory page to focus on viewing and managing existing items only
- ✅ Maintains data integrity by requiring all items to have associated purchase records

**Barcode Sticker Printing Feature (v5.4 - Complete):**
- ✅ Added barcode sticker printing button in inventory item details modal
- ✅ Implemented `printBarcodeSticker()` function for generating printable sticker labels
- ✅ Sticker format optimized for label printers (50mm × 30mm size)
- ✅ Sticker includes: Item name, visual barcode representation, barcode number, and price
- ✅ Professional print preview window with gradient header and styling
- ✅ User can review sticker before printing with dedicated "طباعة الآن" button
- ✅ CSS configured with `@page` size directive for precise label printer output
- ✅ Purple button with Printer icon positioned between item details and purchase history

**Sidebar Utility Buttons Enhancement (v5.3.2 - Complete):**
- ✅ Added text labels to all utility buttons in sidebar (Dark Mode, Language Switch, About System)
- ✅ All utility buttons now follow consistent pattern: icon + text when expanded, icon only when collapsed
- ✅ Text labels use translation system and switch between Arabic/English
- ✅ Tooltips display when sidebar is collapsed
- ✅ Unified styling with navigation items (same padding, hover effects, transitions)

**Language Switching - Dashboard Implementation (v5.3 - Partially Complete):**
- ✅ Created comprehensive translation system infrastructure:
  - Added `client/src/translations.ts` with complete Arabic/English translation pairs for all UI text
  - Implemented `LanguageContext` and `LanguageProvider` for state management
  - Added language toggle buttons (Languages icon) in both sidebar and mobile header
  - Language preference persists in localStorage
  - Toggle functionality switches between 'ar' (Arabic) and 'en' (English)
  - RTL/LTR direction switching works automatically based on language
- ✅ **Dashboard Translation Complete (v5.3.1):**
  - Applied translation system to Dashboard component as proof-of-concept
  - All Dashboard text now switches between Arabic and English
  - Translation keys: currentCashFund, totalRevenues, totalExpenses, totalAdvances, totalSuspended, totalSalaries, financialSummary, categoryStatistics, revenuesByCategory, expensesByCategory, upcomingBirthdaysReminder, employee, birthdayOn, aboutSystem, darkMode, lightMode, languageSwitch
  - E2E tested and verified working correctly
- **Status:** Dashboard complete, remaining pages pending (Revenues, Expenses, Advances, Employees, Inventory, Settings, etc.)
- **Next Steps:** Apply translation system to remaining components throughout the application

**Comprehensive Dark Mode Implementation (v5.2 - Complete):**
- Fixed dark mode application mechanism: Changed from `document.body` to `document.documentElement` for Tailwind CSS compatibility
- Applied **59 comprehensive dark mode fixes** across all components:
  - **Table headers** (Fixes #41-42): All `<thead>` elements now have `dark:bg-gray-600` (rgb(75, 85, 99))
    - Removed all `bg-gradient` overrides from `<th>` elements for consistent thead background
    - Affects: Revenues, Expenses, Advances, Employees, Payroll, Inventory (purchase/dispatch)
  - **Settings page** (Fixes #43-50): Complete dark mode coverage
    - Main container: dark:bg-gray-800
    - All section headings: proper dark variants (indigo-300, teal-300, blue-300, purple-300)
    - Category buttons: dark:bg-gray-700 for inactive state
    - Users table header: dark:bg-purple-900 (solid background)
    - All text elements: proper dark:text-* variants
  - **Payroll page** (Fix #51): Status filter buttons (الكل، مدفوعة، غير مدفوعة) now have dark:bg-gray-700
  - **Table header text unification** (Fix #52): All 60+ table headers now use consistent dark:text-gray-300 for better clarity
  - **Category cards and icons** (Fix #53): Category filter cards and action icons now fully support dark mode
    - Custom category colors: All 4 categories (الإيجارات, مواد أولية, صيانة, الصالون) now have dark variants
    - Print icon: Fixed hover state for dark mode (dark:hover:text-gray-100)
    - Default category cards: Both green and red variants include dark:bg-*-900 and dark:text-*-200
  - **Inventory entry filter cards** (Fixes #54-57): All status filter cards in inventory entry page now fully support dark mode in both active and inactive states
    - Fix #54: "معلقة" (Pending) card - Added dark:bg-yellow-700 and dark:text-yellow-200 for active state
    - Fix #55: "معتمدة كاش" (Dispatched/Cash) card - Added dark:bg-green-700 and dark:text-green-200 for active state
    - Fix #56: "معتمدة آجل" (CreditApproved/Credit) card - Added dark:bg-blue-700 and dark:text-blue-200 for active state
    - Fix #57: All inactive states now have consistent dark:text-*-200 for proper visibility
  - **Invoice modal empty state message** (Fix #58): "الرجاء إضافة مواد إلى الفاتورة" message now has dark:text-yellow-200 and dark:border-yellow-600
  - **Barcode generation button** (Fix #59): "توليد باركود" button in inventory item form now has dark:bg-gray-700 and dark:hover:bg-gray-600
  - Filter panels: All filter backgrounds updated with dark:bg-gray-700 (including main filters container)
  - Modal headers: Updated with dark:bg-teal-900/30
  - Close buttons: Proper dark backgrounds (dark:bg-gray-700)
  - Totals cards: Updated with dark:bg-teal-900/30 and appropriate text colors
  - Dispatch history section: dark:bg-gray-800 with proper heading colors
  - All input fields now support dark mode
  - All select dropdowns (Vendor, Representative, Category, etc.) now support dark mode with proper backgrounds
  - All form elements across all modals now support dark mode
- Verified with comprehensive E2E testing across all pages and modals (Dashboard, Revenues, Expenses, Employees, Advances, Payroll, Settings, Inventory)
- Dark mode preference saved in localStorage and persists across sessions
- Total: **59 fixes** - Complete dark mode coverage with every UI element properly styled for both light and dark themes, including unified table header colors, category filter cards, inventory entry status filter cards, modal empty state messages, and form buttons

### User Preferences
I prefer simple, clear language in explanations. I appreciate an iterative development approach. Please ask before making any major architectural changes or introducing new external dependencies. When implementing features, prioritize a modern, professional aesthetic with full RTL support and responsive design. Ensure the system remains functional offline. I prefer detailed explanations of new features and changes, especially regarding performance and code structure.

### System Architecture
The system is built as a single-page application with a modern and professional UI/UX, supporting full RTL and responsive design.

**UI/UX Decisions:**
- **Language Support:** Bilingual system supporting Arabic and English with infrastructure for easy switching. Language preference saved in localStorage. Currently Arabic UI only (English translation application in progress).
- **Dark/Light Mode:** Fully functional dark mode with comprehensive support across all components. Toggle switch in header saves user preference. Implemented using Tailwind's class-based strategy with dark class applied to `document.documentElement`.
- **Color Scheme:** Utilizes a modern color palette with primary (vibrant blue), secondary (purple), and accent (turquoise) colors, along with functional colors for revenues (green), expenses (red), and warnings (amber). All colors include dark mode variants.
- **Gradients:** Modern gradients are used for dashboard cards, sidebar, and active buttons.
- **Typography & Icons:** Clear, colored icons and legible Arabic typography with proper contrast in both light and dark modes.
- **Layout:** Collapsible sidebar with state saving.
- **Accessibility:** Designed with a 4.5:1 contrast ratio for enhanced accessibility, adhering to Material Design 3 principles. Dark mode ensures proper contrast for all UI elements.

**Technical Implementations & Feature Specifications:**
- **Dashboard:** Displays comprehensive financial statistics, interactive charts, and birthday alerts.
- **Financial Management:**
    - **Revenues:** Add, edit, delete, categorize, advanced filtering, search (supports Arabic numerals), print, and export to CSV.
    - **Expenses:** Record expenses with vendor/representative details, link to inventory purchases, advanced invoicing, print vouchers (80mm & A4).
    - **Suspended Payments:** Track and manage outstanding payments and debts.
- **Employee Management:**
    - **Employees:** Full database, birthday tracking, basic salary management, personal document storage.
    - **Advances:** Manage employee financial advances (personal, emergency, medical, family, other categories), track payments, print vouchers, filter by category.
    - **Payroll:** Comprehensive payroll table including basic salary, bonuses, deductions, absences, overtime, advances, net salary calculation, status tracking, and 80mm payslip printing. Supports monthly payroll selection.
- **Inventory Management:**
    - **Inventory Entry:** Purchase invoice entry with smart autocomplete for items, ability to modify/delete items from invoices, RTL quantity input, cash/credit invoice approval, cancellation with reason, status tracking.
    - **Inventory:** Full material database, direct item addition (without invoice), duplicate name prevention, automatic barcode generation, stock tracking, material expenditure, and full purchase history for each item.
- **Settings:** Manage categories (revenues, expenses, advances), departments, job titles, vendors, representatives, user permissions, and company details.
- **AI Assistant "Alaa":** A GPT-5-mini powered intelligent assistant integrated into the system, specialized in guiding users on how to use the Iraqi Accounting System specifically, providing accurate and context-aware responses in Arabic.

**System Design Choices:**
- **Offline First:** Designed to function without an internet connection, storing all data in `localStorage` under `IRAQI_ACCOUNTING_DATA_V3_LOCAL`.
- **Modularity:** Codebase structured with utilities and types separated for better maintainability and performance using code splitting, `React.memo`, `useMemo`, and `useCallback`.
- **Permissions System:** Robust user permissions for different functionalities (e.g., add, edit, delete for inventory).

### External Dependencies
- **Frontend:**
    - **React:** UI library.
    - **Tailwind CSS:** For styling.
    - **Lucide React:** For icons.
    - **LocalStorage:** For local data storage.
- **Backend:**
    - **Express.js:** Web server.
    - **TypeScript:** Programming language.
    - **OpenAI GPT-5 (via Replit AI Integrations):** For the intelligent assistant "Alaa" (accessible via `/api/chat` REST API endpoint).