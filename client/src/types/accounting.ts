// أنواع وثوابت نظام المحاسبة العراقي

export const STORAGE_KEY = 'IRAQI_ACCOUNTING_DATA_V3_LOCAL';

export const CUSTOM_CATEGORY_COLORS = {
    // المصروفات
    'الإيجارات': { bg: 'bg-yellow-100 dark:bg-yellow-900', text: 'text-yellow-800 dark:text-yellow-200', border: 'border-yellow-600' },
    'مواد أولية': { bg: 'bg-red-100 dark:bg-red-900', text: 'text-red-800 dark:text-red-200', border: 'border-red-600' },
    'صيانة': { bg: 'bg-purple-100 dark:bg-purple-900', text: 'text-purple-800 dark:text-purple-200', border: 'border-purple-600' },
    // الإيرادات
    'الصالون': { bg: 'bg-teal-100 dark:bg-teal-900', text: 'text-teal-800 dark:text-teal-200', border: 'border-teal-600' },
};

export const BASE_PERMISSIONS = {
    dashboard: { view: true },
    revenues: { view: true, add: true, edit: true, delete: true },
    expenses: { view: true, add: true, edit: true, delete: true },
    advances: { view: true, add: true, edit: true, delete: true },
    suspended: { view: true, add: true, edit: true, delete: true },
    employees: { view: true, add: true, edit: true, delete: true },
    payroll: { view: true, add: true, edit: true, delete: true, pay: true },
    inventoryEntry: { view: true, approve: true, credit: true, cancel: true },
    inventory: { view: true, add: true, edit: true, delete: true },
    inventoryDispatch: { view: true, add: true, delete: true },
    settings: { view: true }
};

export const defaultSettings = {
    revenueCategories: ['الصالون'],
    expenseCategories: ['الإيجارات', 'مواد أولية', 'صيانة'],
    advanceCategories: ['سلفة شخصية', 'سلفة طارئة', 'سلفة علاجية', 'سلفة عائلية', 'أخرى'],
    departments: ['الإدارة', 'المبيعات', 'المحاسبة'],
    jobTitles: ['مدير الادراة والحسابات', 'موظف مبيعات'],
    vendors: ['السامر', 'الجودة'],
    representatives: [{ name: 'عبد الله', vendor: 'السامر' }],
    companyName: 'نظام الحسابات',
    companyLogoUrl: 'https://placehold.co/100x40/0d9488/ffffff?text=LOGO',
    users: [
        { 
            id: 'admin_1', 
            username: 'المدير العام', 
            email: 'admin@system.com',
            password: 'password', 
            permissions: BASE_PERMISSIONS,
            darkMode: false,
            sidebarCollapsed: false
        }
    ]
};

export const defaultDataStructure = {
    revenues: [],
    expenses: [],
    employees: [],
    advances: [],
    suspended: [],
    inventory: [],
    payroll: [],
    pendingInvoices: [], 
    inventoryDispatches: [],
    settings: defaultSettings
};
