# نظام المحاسبة العراقي - Iraqi Accounting System

## Overview
This project is a comprehensive Iraqi accounting system designed to manage revenues, expenses, inventory, employees, and payroll. It features a full Arabic RTL interface with a professional design, dark/light mode support, and aims to be a complete solution for financial management tailored for the Iraqi market. The system operates offline, storing data locally, and provides an intelligent AI assistant named "Alaa" specialized in guiding users through the system's functionalities.

## User Preferences
I prefer simple, clear language in explanations. I appreciate an iterative development approach. Please ask before making any major architectural changes or introducing new external dependencies. When implementing features, prioritize a modern, professional aesthetic with full RTL support and responsive design. Ensure the system remains functional offline. I prefer detailed explanations of new features and changes, especially regarding performance and code structure.

## System Architecture
The system is built as a single-page application with a modern and professional UI/UX, supporting full RTL and responsive design.

### UI/UX Decisions
-   **Language Support:** Bilingual system supporting Arabic and English with infrastructure for easy switching. Language preference saved in `localStorage`.
-   **Dark/Light Mode:** Fully functional dark mode with comprehensive support across all components. Toggle switch saves user preference. All date picker icons properly visible in dark mode.
-   **Color Scheme:** Utilizes a modern color palette with primary, secondary, and accent colors, along with functional colors for revenues, expenses, and warnings. All colors include dark mode variants.
-   **Gradients:** Modern gradients are used for dashboard cards, sidebar, active buttons, and filter total cards.
-   **Typography & Icons:** Clear, colored icons (including TrendingUp in category cards) and legible Arabic typography with proper contrast in both light and dark modes.
-   **Layout:** Collapsible sidebar with state saving. Modern card designs with responsive grid layouts.
-   **Category Cards:** Modern rectangular horizontal cards with responsive grid (1-4 columns), icons, hover effects (shadow & translate), and right borders for RTL support.
-   **Filter Total Card:** Enhanced with gradient backgrounds, stronger shadows, and hover animations.
-   **Accessibility:** Designed with a 4.5:1 contrast ratio for enhanced accessibility, adhering to Material Design 3 principles.

### Technical Implementations & Feature Specifications
-   **Dashboard:** Displays comprehensive financial statistics, interactive charts, and birthday alerts.
-   **Financial Management:** Includes modules for Revenues, Expenses, Suspended Payments, and **Pending Expenses** (الصرفيات المعلقة) with features like categorization, filtering, search, print, Excel export, and **Excel import**.
    -   **Excel Import/Export Feature:** Complete import/export functionality for bulk data management:
        -   **Export:** One-click export of all filtered records to Excel file with Arabic column headers
        -   **Template Download:** Generate Excel template with example data and proper field structure
        -   **Import:** Upload Excel files to bulk-add records with validation and error reporting
        -   **Import Modal:** User-friendly interface with step-by-step instructions, file upload area, and status feedback
        -   **Action Buttons:** Standardized button layout (Print, Import, Export, Refresh) with consistent colors and icons across all data pages
        -   **Data Validation:** Automatic validation of required fields, type checking, and employee lookup by name
        -   **Error Handling:** Detailed success/error counts with toast notifications
        -   **Library:** Uses xlsx library for robust Excel file processing
    -   **Pending Expenses:** Manager approval workflow for expenses and advances with **permanent record retention**. Features include:
        -   **No-Delete Policy:** All records remain permanently for audit trail - only status changes
        -   **Approval Workflow:** Creates copy in expenses/advances collection AND changes original record status to 'paid' (green badge)
        -   **Cancel Workflow:** Changes record status to 'cancelled' (red badge) without deletion
        -   **Permission Control:** Edit/delete only available for 'pending' records; 'paid' and 'cancelled' records are view-only
        -   Dual filter cards showing separate totals for pending expenses and advances with modern horizontal design
        -   Type selection (expense/advance) in submission form
        -   **Status filter:** Three filter buttons (Pending, Cancelled, All) to view different request states
        -   Status badges showing pending (amber), paid (green), or cancelled (red) states
        -   Modern rectangular cards with gradients, icons (TrendingUp/Down), and RTL support
        -   Responsive grid layout (1-2 columns based on screen size)
-   **Employee Management:** Covers Employees (database, birthday tracking, basic salary), Advances (manage various categories of advances, track payments, print vouchers), and Payroll (comprehensive table with salary breakdown, bonuses, deductions, absences, overtime, net salary calculation, payslip printing).
-   **Inventory Management:** Features Inventory Entry (purchase invoice entry, item modification, cash/credit approval, status tracking) and Inventory (material database, barcode generation, stock tracking, expenditure tracking, purchase history).
-   **Settings:** Manages categories (revenues, expenses, advances), departments, job titles, vendors, representatives, user permissions, and company details.
-   **Admin Page (New):** Comprehensive administrative dashboard displaying system information including:
    -   System version and statistics
    -   User and employee counts
    -   Revenue and expense counts
    -   Inventory items count
    -   Storage usage with formatted display
    -   Last backup information
    -   System features overview
    -   Modern gradient cards with RTL support and full dark mode compatibility
-   **AI Assistant "Alaa":** A GPT-5-mini powered intelligent assistant integrated into the system, specialized in guiding users on system functionalities, providing accurate and context-aware responses in Arabic.

### System Design Choices
-   **Offline First:** Designed to function without an internet connection, storing all data in `localStorage`.
-   **Modularity:** Codebase structured with utilities and types separated for better maintainability and performance using code splitting, `React.memo`, `useMemo`, and `useCallback`.
-   **Role-Based Permissions System:** Comprehensive 6-tier role system with pre-defined permissions and optional custom permissions:
    -   **🛡️ الأدمن (Admin):** Full system access including admin page. Only one admin account exists (الأدمن الرئيسي).
    -   **👔 السوبر فايزر (Supervisor):** Full access to all modules except admin page.
    -   **📊 المدير العام (General Manager):** View-only access to all modules except settings.
    -   **📦 أمين المخزن (Warehouse Keeper):** Full access to inventory, entry, and withdrawal modules. View-only by default.
    -   **💼 المحاسب (Accountant):** View access to all modules + approve inventory entries and pending expenses.
    -   **💰 الكاشير (Cashier):** Approve inventory withdrawals (which adds to pending expenses), manage suspended payments, limited inventory entry access.
    -   **Security:** Cannot create new admin accounts. Cannot modify or delete the main admin account. Role change triggers automatic permission update.

## External Dependencies
-   **Frontend:**
    -   React: UI library.
    -   Tailwind CSS: For styling.
    -   Lucide React: For icons.
    -   xlsx: Excel file processing library for import/export functionality.
    -   LocalStorage: For local data storage.
-   **Backend:**
    -   Express.js: Web server.
    -   TypeScript: Programming language.
    -   OpenAI GPT-5 (via Replit AI Integrations): For the intelligent assistant "Alaa" (accessible via `/api/chat` REST API endpoint).