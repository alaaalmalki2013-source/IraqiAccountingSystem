# نظام المحاسبة العراقي - Iraqi Accounting System

### Overview
This project is a comprehensive Iraqi accounting system designed to manage revenues, expenses, inventory, employees, and payroll. It features a full Arabic RTL interface with a professional design, dark/light mode support, and aims to be a complete solution for financial management tailored for the Iraqi market. The system operates offline, storing data locally, and provides an intelligent AI assistant named "Alaa" specialized in guiding users through the system's functionalities.

### User Preferences
I prefer simple, clear language in explanations. I appreciate an iterative development approach. Please ask before making any major architectural changes or introducing new external dependencies. When implementing features, prioritize a modern, professional aesthetic with full RTL support and responsive design. Ensure the system remains functional offline. I prefer detailed explanations of new features and changes, especially regarding performance and code structure.

### System Architecture
The system is built as a single-page application with a modern and professional UI/UX, supporting full RTL and responsive design.

**UI/UX Decisions:**
- **Dark/Light Mode:** Seamless switching with user preference saved.
- **Color Scheme:** Utilizes a modern color palette with primary (vibrant blue), secondary (purple), and accent (turquoise) colors, along with functional colors for revenues (green), expenses (red), and warnings (amber).
- **Gradients:** Modern gradients are used for dashboard cards, sidebar, and active buttons.
- **Typography & Icons:** Clear, colored icons and legible Arabic typography.
- **Layout:** Collapsible sidebar with state saving.
- **Accessibility:** Designed with a 4.5:1 contrast ratio for enhanced accessibility, adhering to Material Design 3 principles.

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