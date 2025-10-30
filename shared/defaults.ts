export const USER_ROLES = {
  ADMIN: "admin",
  SUPERVISOR: "supervisor",
  GENERAL_MANAGER: "general_manager",
  WAREHOUSE_KEEPER: "warehouse_keeper",
  ACCOUNTANT: "accountant",
  CASHIER: "cashier",
} as const;

type RoleKey = keyof typeof USER_ROLES;

type RolePermissionDetail = {
  view: boolean;
  add?: boolean;
  edit?: boolean;
  delete?: boolean;
  approve?: boolean;
  cancel?: boolean;
  credit?: boolean;
  pay?: boolean;
  [key: string]: boolean | undefined;
};

type RolePermissionsConfig = Record<string, RolePermissionDetail | undefined>;

type RolePermissionsMap = Record<(typeof USER_ROLES)[RoleKey], RolePermissionsConfig>;

export const ROLE_LABELS: Record<(typeof USER_ROLES)[RoleKey], string> = {
  [USER_ROLES.ADMIN]: "الأدمن",
  [USER_ROLES.SUPERVISOR]: "السوبر فايزر",
  [USER_ROLES.GENERAL_MANAGER]: "المدير العام",
  [USER_ROLES.WAREHOUSE_KEEPER]: "أمين المخزن",
  [USER_ROLES.ACCOUNTANT]: "المحاسب",
  [USER_ROLES.CASHIER]: "الكاشير",
};

export const ROLE_DESCRIPTIONS: Record<(typeof USER_ROLES)[RoleKey], string> = {
  [USER_ROLES.ADMIN]: "صلاحيات كاملة على جميع أجزاء النظام بما في ذلك صفحة الإدارة",
  [USER_ROLES.SUPERVISOR]: "صلاحيات كاملة على جميع أجزاء النظام ما عدا صفحة الإدارة",
  [USER_ROLES.GENERAL_MANAGER]: "مشاهدة فقط لجميع أجزاء النظام ما عدا صفحة الإعدادات",
  [USER_ROLES.WAREHOUSE_KEEPER]: "إدارة المخزون والإدخال والاستخراج المخزني فقط",
  [USER_ROLES.ACCOUNTANT]: "مشاهدة النظام + المصادقة على الإدخال المخزني والصرفيات المعلقة",
  [USER_ROLES.CASHIER]: "المصادقة على الاستخراج المخزني وإدارة الصرفيات المعلقة",
};

export const ROLE_PERMISSIONS: RolePermissionsMap = {
  [USER_ROLES.ADMIN]: {
    dashboard: { view: true },
    revenues: { view: true, add: true, edit: true, delete: true },
    expenses: { view: true, add: true, edit: true, delete: true },
    advances: { view: true, add: true, edit: true, delete: true },
    suspended: { view: true, add: true, edit: true, delete: true },
    debts: { view: true, add: true, edit: true, delete: true, pay: true },
    pendingExpenses: { view: true, add: true, edit: true, delete: true, approve: true, cancel: true },
    employees: { view: true, add: true, edit: true, delete: true },
    payroll: { view: true, add: true, edit: true, delete: true, pay: true },
    inventoryEntry: { view: true, add: true, edit: true, delete: true, approve: true, credit: true, cancel: true },
    inventoryWithdrawal: { view: true, add: true, edit: true, delete: true },
    inventory: { view: true, add: true, edit: true, delete: true },
    settings: { view: true, manageCategories: true, manageVendors: true, manageRepresentatives: true },
    admin: { view: true },
  },
  [USER_ROLES.SUPERVISOR]: {
    dashboard: { view: true },
    revenues: { view: true, add: true, edit: true, delete: true },
    expenses: { view: true, add: true, edit: true, delete: true },
    advances: { view: true, add: true, edit: true, delete: true },
    suspended: { view: true, add: true, edit: true, delete: true },
    debts: { view: true, add: true, edit: true, delete: true, pay: true },
    pendingExpenses: { view: true, add: true, edit: true, delete: true, approve: true, cancel: true },
    employees: { view: true, add: true, edit: true, delete: true },
    payroll: { view: true, add: true, edit: true, delete: true, pay: true },
    inventoryEntry: { view: true, add: true, edit: true, delete: true, approve: true, credit: true, cancel: true },
    inventoryWithdrawal: { view: true, add: true, edit: true, delete: true },
    inventory: { view: true, add: true, edit: true, delete: true },
    settings: { view: true, manageCategories: true, manageVendors: true, manageRepresentatives: true },
    admin: { view: false },
  },
  [USER_ROLES.GENERAL_MANAGER]: {
    dashboard: { view: true },
    revenues: { view: true },
    expenses: { view: true },
    advances: { view: true },
    suspended: { view: true },
    debts: { view: true, pay: false },
    pendingExpenses: { view: true },
    employees: { view: true },
    payroll: { view: true },
    inventoryEntry: { view: true },
    inventoryWithdrawal: { view: true },
    inventory: { view: true },
    settings: { view: false },
    admin: { view: false },
  },
  [USER_ROLES.WAREHOUSE_KEEPER]: {
    dashboard: { view: false },
    revenues: { view: false },
    expenses: { view: false },
    advances: { view: false },
    suspended: { view: false },
    debts: { view: false },
    pendingExpenses: { view: false },
    employees: { view: false },
    payroll: { view: false },
    inventoryEntry: { view: true },
    inventoryWithdrawal: { view: true },
    inventory: { view: true },
    settings: { view: false },
    admin: { view: false },
  },
  [USER_ROLES.ACCOUNTANT]: {
    dashboard: { view: true },
    revenues: { view: true },
    expenses: { view: true },
    advances: { view: true },
    suspended: { view: true },
    debts: { view: true, pay: true },
    pendingExpenses: { view: true, add: true, approve: true },
    employees: { view: true },
    payroll: { view: true },
    inventoryEntry: { view: true, add: true, approve: true, credit: true },
    inventoryWithdrawal: { view: true },
    inventory: { view: true },
    settings: { view: false },
    admin: { view: false },
  },
  [USER_ROLES.CASHIER]: {
    dashboard: { view: false },
    revenues: { view: false },
    expenses: { view: false },
    advances: { view: false },
    suspended: { view: true, add: true, edit: true, delete: true },
    debts: { view: true, pay: true },
    pendingExpenses: { view: true, add: true, edit: true, delete: true },
    employees: { view: false },
    payroll: { view: false },
    inventoryEntry: { view: true },
    inventoryWithdrawal: { view: true },
    inventory: { view: false },
    settings: { view: false },
    admin: { view: false },
  },
};

export const BASE_PERMISSIONS = ROLE_PERMISSIONS[USER_ROLES.ADMIN];

export const defaultSettings = {
  revenueCategories: ["الصالون"],
  expenseCategories: ["الإيجارات", "مواد أولية", "صيانة"],
  advanceCategories: ["سلفة شخصية", "سلفة طارئة", "سلفة علاجية", "سلفة عائلية", "أخرى"],
  departments: ["الإدارة", "المبيعات", "المحاسبة"],
  jobTitles: ["مدير الادراة والحسابات", "موظف مبيعات"],
  vendors: ["السامر", "الجودة"],
  representatives: [{ name: "عبد الله", vendor: "السامر" }],
  companyName: "نظام الحسابات",
  companyLogoUrl: "https://placehold.co/100x40/0d9488/ffffff?text=LOGO",
  systemExpiryDate: null,
  masterKey: "8809912@..Alaa",
  users: [
    {
      id: "admin_1",
      username: "admin",
      email: "admin@system.com",
      password: "admin123",
      role: USER_ROLES.ADMIN,
      permissions: JSON.parse(JSON.stringify(BASE_PERMISSIONS)),
      customPermissions: {},
      darkMode: false,
      sidebarCollapsed: false,
    },
  ],
};

export const defaultDataStructure = {
  revenues: [],
  expenses: [],
  debts: [],
  employees: [],
  advances: [],
  suspended: [],
  pendingExpenses: [],
  inventory: [],
  payroll: [],
  pendingInvoices: [],
  inventoryWithdrawals: [],
  inventoryDispatches: [],
  activityLog: [],
  settings: defaultSettings,
};

export type DefaultDataStructure = typeof defaultDataStructure;
