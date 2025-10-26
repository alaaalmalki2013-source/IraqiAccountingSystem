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

// الأدوار المتاحة في النظام
export const USER_ROLES = {
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    GENERAL_MANAGER: 'general_manager',
    WAREHOUSE_KEEPER: 'warehouse_keeper',
    WAREHOUSE_KEEPER_2: 'warehouse_keeper_2',
    ACCOUNTANT: 'accountant',
    CASHIER: 'cashier',
    EDITOR: 'editor'
};

// أسماء الأدوار بالعربية
export const ROLE_LABELS = {
    [USER_ROLES.ADMIN]: 'الأدمن',
    [USER_ROLES.SUPERVISOR]: 'السوبر فايزر',
    [USER_ROLES.GENERAL_MANAGER]: 'المدير العام',
    [USER_ROLES.WAREHOUSE_KEEPER]: 'أمين المخزن',
    [USER_ROLES.WAREHOUSE_KEEPER_2]: 'أمين المخزن 2',
    [USER_ROLES.ACCOUNTANT]: 'المحاسب',
    [USER_ROLES.CASHIER]: 'الكاشير',
    [USER_ROLES.EDITOR]: 'المحرر'
};

// أوصاف الأدوار
export const ROLE_DESCRIPTIONS = {
    [USER_ROLES.ADMIN]: 'صلاحيات كاملة على جميع أجزاء النظام بما في ذلك صفحة الإدارة',
    [USER_ROLES.SUPERVISOR]: 'صلاحيات كاملة على جميع أجزاء النظام ما عدا صفحة الإدارة',
    [USER_ROLES.GENERAL_MANAGER]: 'مشاهدة فقط لجميع أجزاء النظام ما عدا صفحة الإعدادات',
    [USER_ROLES.WAREHOUSE_KEEPER]: 'إدارة المخزون والإدخال والاستخراج المخزني فقط',
    [USER_ROLES.WAREHOUSE_KEEPER_2]: 'إدارة المخزون والإدخال والاستخراج المخزني فقط',
    [USER_ROLES.ACCOUNTANT]: 'مشاهدة النظام + المصادقة على الإدخال المخزني والصرفيات المعلقة',
    [USER_ROLES.CASHIER]: 'المصادقة على الاستخراج المخزني وإدارة الصرفيات المعلقة',
    [USER_ROLES.EDITOR]: 'تعديل وحذف جميع البيانات ما عدا الإعدادات وصفحة الإدارة'
};

// صلاحيات افتراضية لكل دور
export const ROLE_PERMISSIONS = {
    // الأدمن - كل شيء
    [USER_ROLES.ADMIN]: {
        dashboard: { view: true },
        revenues: { view: true, add: true, edit: true, delete: true },
        expenses: { view: true, add: true, edit: true, delete: true },
        advances: { view: true, add: true, edit: true, delete: true },
        suspended: { view: true, add: true, edit: true, delete: true },
        pendingExpenses: { view: true, add: true, edit: true, delete: true, approve: true, cancel: true },
        employees: { view: true, add: true, edit: true, delete: true },
        payroll: { view: true, add: true, edit: true, delete: true, pay: true },
        inventoryEntry: { view: true, add: true, edit: true, delete: true, approve: true, credit: true, cancel: true },
        inventoryWithdrawal: { view: true, add: true, edit: true, delete: true },
        inventory: { view: true, add: true, edit: true, delete: true },
        settings: { view: true },
        admin: { view: true }
    },
    
    // السوبر فايزر - كل شيء ما عدا صفحة الأدمن
    [USER_ROLES.SUPERVISOR]: {
        dashboard: { view: true },
        revenues: { view: true, add: true, edit: true, delete: true },
        expenses: { view: true, add: true, edit: true, delete: true },
        advances: { view: true, add: true, edit: true, delete: true },
        suspended: { view: true, add: true, edit: true, delete: true },
        pendingExpenses: { view: true, add: true, edit: true, delete: true, approve: true, cancel: true },
        employees: { view: true, add: true, edit: true, delete: true },
        payroll: { view: true, add: true, edit: true, delete: true, pay: true },
        inventoryEntry: { view: true, add: true, edit: true, delete: true, approve: true, credit: true, cancel: true },
        inventoryWithdrawal: { view: true, add: true, edit: true, delete: true },
        inventory: { view: true, add: true, edit: true, delete: true },
        settings: { view: true },
        admin: { view: false }
    },
    
    // المدير العام - مشاهدة فقط ما عدا الإعدادات
    [USER_ROLES.GENERAL_MANAGER]: {
        dashboard: { view: true },
        revenues: { view: true, add: false, edit: false, delete: false },
        expenses: { view: true, add: false, edit: false, delete: false },
        advances: { view: true, add: false, edit: false, delete: false },
        suspended: { view: true, add: false, edit: false, delete: false },
        pendingExpenses: { view: true, add: false, edit: false, delete: false, approve: false, cancel: false },
        employees: { view: true, add: false, edit: false, delete: false },
        payroll: { view: true, add: false, edit: false, delete: false, pay: false },
        inventoryEntry: { view: true, add: false, edit: false, delete: false, approve: false, credit: false, cancel: false },
        inventoryWithdrawal: { view: true, add: false, edit: false, delete: false },
        inventory: { view: true, add: false, edit: false, delete: false },
        settings: { view: false },
        admin: { view: false }
    },
    
    // أمين المخزن - الإدخال المخزني، الإخراج المخزني، المخزون، المواد
    [USER_ROLES.WAREHOUSE_KEEPER]: {
        dashboard: { view: false },
        revenues: { view: false, add: false, edit: false, delete: false },
        expenses: { view: false, add: false, edit: false, delete: false },
        advances: { view: false, add: false, edit: false, delete: false },
        suspended: { view: false, add: false, edit: false, delete: false },
        pendingExpenses: { view: false, add: false, edit: false, delete: false, approve: false, cancel: false },
        employees: { view: false, add: false, edit: false, delete: false },
        payroll: { view: false, add: false, edit: false, delete: false, pay: false },
        inventoryEntry: { view: true, add: true, edit: true, delete: true, approve: true, credit: true, cancel: true },
        inventoryWithdrawal: { view: true, add: true, edit: true, delete: true },
        inventory: { view: true, add: true, edit: true, delete: true },
        settings: { view: false },
        admin: { view: false }
    },
    
    // المحاسب - مشاهدة الكل + مصادقة محددة
    [USER_ROLES.ACCOUNTANT]: {
        dashboard: { view: true },
        revenues: { view: true, add: false, edit: false, delete: false },
        expenses: { view: true, add: false, edit: false, delete: false },
        advances: { view: true, add: false, edit: false, delete: false },
        suspended: { view: true, add: false, edit: false, delete: false },
        pendingExpenses: { view: true, add: true, edit: false, delete: false, approve: true, cancel: false },
        employees: { view: true, add: false, edit: false, delete: false },
        payroll: { view: true, add: false, edit: false, delete: false, pay: false },
        inventoryEntry: { view: true, add: true, edit: false, delete: false, approve: true, credit: true, cancel: false },
        inventoryWithdrawal: { view: true, add: false, edit: false, delete: false },
        inventory: { view: true, add: false, edit: false, delete: false },
        settings: { view: false },
        admin: { view: false }
    },
    
    // الكاشير - الإدخال المخزني (مع المصادقة) + الصرفيات المعلقة
    [USER_ROLES.CASHIER]: {
        dashboard: { view: false },
        revenues: { view: false, add: false, edit: false, delete: false },
        expenses: { view: false, add: false, edit: false, delete: false },
        advances: { view: false, add: false, edit: false, delete: false },
        suspended: { view: false, add: false, edit: false, delete: false },
        pendingExpenses: { view: true, add: true, edit: true, delete: true, approve: true, cancel: true },
        employees: { view: false, add: false, edit: false, delete: false },
        payroll: { view: false, add: false, edit: false, delete: false, pay: false },
        inventoryEntry: { view: true, add: true, edit: false, delete: false, approve: true, credit: true, cancel: false },
        inventoryWithdrawal: { view: false, add: false, edit: false, delete: false },
        inventory: { view: false, add: false, edit: false, delete: false },
        settings: { view: false },
        admin: { view: false }
    },
    
    // أمين المخزن 2 - نفس صلاحيات أمين المخزن
    [USER_ROLES.WAREHOUSE_KEEPER_2]: {
        dashboard: { view: false },
        revenues: { view: false, add: false, edit: false, delete: false },
        expenses: { view: false, add: false, edit: false, delete: false },
        advances: { view: false, add: false, edit: false, delete: false },
        suspended: { view: false, add: false, edit: false, delete: false },
        pendingExpenses: { view: false, add: false, edit: false, delete: false, approve: false, cancel: false },
        employees: { view: false, add: false, edit: false, delete: false },
        payroll: { view: false, add: false, edit: false, delete: false, pay: false },
        inventoryEntry: { view: true, add: true, edit: true, delete: true, approve: true, credit: true, cancel: true },
        inventoryWithdrawal: { view: true, add: true, edit: true, delete: true },
        inventory: { view: true, add: true, edit: true, delete: true },
        settings: { view: false },
        admin: { view: false }
    },
    
    // المحرر - تعديل وحذف كل شيء ما عدا الإعدادات والأدمن
    [USER_ROLES.EDITOR]: {
        dashboard: { view: true },
        revenues: { view: true, add: true, edit: true, delete: true },
        expenses: { view: true, add: true, edit: true, delete: true },
        advances: { view: true, add: true, edit: true, delete: true },
        suspended: { view: true, add: true, edit: true, delete: true },
        pendingExpenses: { view: true, add: true, edit: true, delete: true, approve: true, cancel: true },
        employees: { view: true, add: true, edit: true, delete: true },
        payroll: { view: true, add: true, edit: true, delete: true, pay: true },
        inventoryEntry: { view: true, add: true, edit: true, delete: true, approve: true, credit: true, cancel: true },
        inventoryWithdrawal: { view: true, add: true, edit: true, delete: true },
        inventory: { view: true, add: true, edit: true, delete: true },
        settings: { view: false },
        admin: { view: false }
    }
};

// للتوافق مع الكود القديم
export const BASE_PERMISSIONS = ROLE_PERMISSIONS[USER_ROLES.ADMIN];

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
    systemExpiryDate: null, // تاريخ انتهاء صلاحية النظام (null = بدون صلاحية)
    // كلمات المرور للنظام البسيط
    adminPassword: '1234569',
    supervisorPassword: '7777',
    generalManagerPassword: '9999',
    warehousePassword: '1234',
    warehouse2Password: '2580',
    cashierPassword: '0000',
    editorPassword: '3636'
};

export const defaultDataStructure = {
    revenues: [],
    expenses: [],
    employees: [],
    advances: [],
    suspended: [],
    pendingExpenses: [],
    inventory: [],
    payroll: [],
    pendingInvoices: [], 
    inventoryWithdrawals: [],
    inventoryDispatches: [],
    settings: defaultSettings
};
