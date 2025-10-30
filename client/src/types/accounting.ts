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

export { USER_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, ROLE_PERMISSIONS, BASE_PERMISSIONS, defaultSettings, defaultDataStructure } from '@shared/defaults';
