# نظام المحاسبة العراقي - Iraqi Accounting System

## Overview
This project is a comprehensive Iraqi accounting system designed to manage revenues, expenses, inventory, employees, and payroll. It features a full Arabic RTL interface with a professional design, dark/light mode support, and aims to be a complete solution for financial management tailored for the Iraqi market. The system operates offline, storing data locally, and provides an intelligent AI assistant named "Alaa" specialized in guiding users through the system's functionalities.

## User Preferences
I prefer simple, clear language in explanations. I appreciate an iterative development approach. Please ask before making any major architectural changes or introducing new external dependencies. When implementing features, prioritize a modern, professional aesthetic with full RTL support and responsive design. Ensure the system remains functional offline. I prefer detailed explanations of new features and changes, especially regarding performance and code structure.

## System Architecture
The system is built as a single-page application with a modern and professional UI/UX, supporting full RTL and responsive design.

### UI/UX Decisions
-   **Language Support:** Full Arabic RTL interface designed for the Iraqi market. System operates entirely in Arabic with proper RTL text direction.
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
### System Cleanup - Bilingual Feature Removed ✅ COMPLETED
-   **Decision:** Removed bilingual (Arabic/English) feature per user request to avoid complexity and potential errors
-   **Changes Implemented:**
    -   Deleted translation infrastructure files:
        -   `client/src/contexts/LanguageContext.tsx` (deleted)
        -   `client/src/translations.ts` (deleted)
    -   Removed all `t()` translation function calls throughout the codebase
    -   Replaced dynamic translations with static Arabic text
    -   Removed `useLanguage()` hook usage and language toggle buttons
    -   Removed `Languages` icon import from lucide-react
    -   Fixed critical bugs:
        -   Removed `t` prop from `EmployeePageComponent`, `InventoryPageComponent`, and `InventoryEntryComponent` component definitions
        -   Removed `t={t}` prop passing in main `PageComponent` render
        -   Removed obsolete "Language Hook" comment
    -   System now operates exclusively in Arabic with hardcoded `dir="rtl"`
-   **Result:** Clean, simpler codebase focused solely on Arabic language support with no runtime errors
-   **Files Modified:**
    -   `client/src/App.tsx`: Removed LanguageProvider wrapper
    -   `client/src/pages/AccountingApp.tsx`: 
        -   Removed all translation system references
        -   Replaced ~80+ t() calls with direct Arabic text
        -   Fixed component prop signatures to remove `t` parameter
        -   Removed `t={t}` prop passing to PageComponent
    -   `replit.md`: Updated documentation to reflect changes
-   **Testing:** Application verified working without errors after changes