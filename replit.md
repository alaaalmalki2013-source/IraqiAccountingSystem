# نظام المحاسبة العراقي - Iraqi Accounting System

## Overview
This project is a comprehensive Iraqi accounting system designed to manage revenues, expenses, inventory, employees, and payroll. It features a full Arabic RTL interface with a professional design, dark/light mode support, and aims to be a complete solution for financial management tailored for the Iraqi market. The system operates offline, storing data locally, and provides an intelligent AI assistant named "Alaa" specialized in guiding users through the system's functionalities.

## User Preferences
I prefer simple, clear language in explanations. I appreciate an iterative development approach. Please ask before making any major architectural changes or introducing new external dependencies. When implementing features, prioritize a modern, professional aesthetic with full RTL support and responsive design. Ensure the system remains functional offline. I prefer detailed explanations of new features and changes, especially regarding performance and code structure.

## System Architecture
The system is built as a single-page application with a modern and professional UI/UX, supporting full RTL and responsive design.

### UI/UX Decisions
-   **Language Support:** Full bilingual system supporting Arabic and English with real-time language switching via `LanguageContext` and `useLanguage()` hook. Translation function `t(key)` is used throughout all components for seamless UI text translation. Comprehensive translation keys defined in `client/src/translations.ts`. Language preference saved in `localStorage` with proper RTL/LTR direction switching.
-   **Dark/Light Mode:** Fully functional dark mode with comprehensive support across all components. Toggle switch saves user preference.
-   **Color Scheme:** Utilizes a modern color palette with primary, secondary, and accent colors, along with functional colors for revenues, expenses, and warnings. All colors include dark mode variants.
-   **Gradients:** Modern gradients are used for dashboard cards, sidebar, and active buttons.
-   **Typography & Icons:** Clear, colored icons and legible Arabic typography with proper contrast in both light and dark modes.
-   **Layout:** Collapsible sidebar with state saving.
-   **Accessibility:** Designed with a 4.5:1 contrast ratio for enhanced accessibility, adhering to Material Design 3 principles.

### Technical Implementations & Feature Specifications
-   **Dashboard:** Displays comprehensive financial statistics, interactive charts, and birthday alerts.
-   **Financial Management:** Includes modules for Revenues, Expenses, and Suspended Payments with features like categorization, filtering, search, print, and export.
-   **Employee Management:** Covers Employees (database, birthday tracking, basic salary), Advances (manage various categories of advances, track payments, print vouchers), and Payroll (comprehensive table with salary breakdown, bonuses, deductions, absences, overtime, net salary calculation, payslip printing).
-   **Inventory Management:** Features Inventory Entry (purchase invoice entry, item modification, cash/credit approval, status tracking) and Inventory (material database, barcode generation, stock tracking, expenditure tracking, purchase history).
-   **Settings:** Manages categories (revenues, expenses, advances), departments, job titles, vendors, representatives, user permissions, and company details.
-   **AI Assistant "Alaa":** A GPT-5-mini powered intelligent assistant integrated into the system, specialized in guiding users on system functionalities, providing accurate and context-aware responses in Arabic.

### System Design Choices
-   **Offline First:** Designed to function without an internet connection, storing all data in `localStorage`.
-   **Modularity:** Codebase structured with utilities and types separated for better maintainability and performance using code splitting, `React.memo`, `useMemo`, and `useCallback`.
-   **Permissions System:** Robust user permissions for different functionalities.

## External Dependencies
-   **Frontend:**
    -   React: UI library.
    -   Tailwind CSS: For styling.
    -   Lucide React: For icons.
    -   LocalStorage: For local data storage.
-   **Backend:**
    -   Express.js: Web server.
    -   TypeScript: Programming language.
    -   OpenAI GPT-5 (via Replit AI Integrations): For the intelligent assistant "Alaa" (accessible via `/api/chat` REST API endpoint).

## Recent Updates (October 20, 2025)
### Comprehensive Bilingual System Implementation
-   **Translation Infrastructure:** Expanded `client/src/translations.ts` with comprehensive English translation keys matching all Arabic keys (100+ translation pairs)
-   **Component Architecture:** Updated all React.memo components to receive `t` function as prop for proper translation access:
    -   `DataPageComponent`: Financial list pages (revenues, expenses, advances, suspended)
    -   `EmployeePageComponent`: Employee management with full translation support
    -   `InventoryPageComponent`: Inventory listing with bilingual interface
    -   `InventoryEntryComponent`: Purchase entry system with translations
-   **Translation Keys Added:**
    -   Page titles: `employeesManagement`, `inventoryManagement`, `inventoryEntryManagement`, `payrollManagement`
    -   UI elements: `globalSearch`, `dateAndTime`, `procedures`, `vendorAndRep`, `stockCount`, `stockQuantity`
    -   Filter labels: `filterByCategory`, `tableFilters`, `dateFrom`, `dateTo`, `filteredTotal`
    -   Action buttons: `addRevenue2`, `addExpense2`, `addAdvance2`, `printAll`, `exportAll`, `details`
    -   Material details: `materialDetails`, `currentUnitPrice`, `purchaseHistoryTitle`, `printBarcodeSticker`
    -   Messages: `noDataToExport`, `noDataToPrint`, `exportedSuccessfully`, `mustSelectVendorRep`
-   **Technical Fixes:**
    -   Fixed computed property names for dynamic object keys using `[t('key')]` syntax
    -   Corrected template literal usage with translation calls
    -   Added `t` prop passing through PageComponent to all child components
    -   Verified LSP compliance with zero errors
-   **Testing:** Comprehensive E2E testing completed successfully:
    -   Language toggle functionality verified across all pages
    -   Employee and Inventory pages load correctly in both languages
    -   All UI elements translate properly
    -   No runtime errors or blocking issues