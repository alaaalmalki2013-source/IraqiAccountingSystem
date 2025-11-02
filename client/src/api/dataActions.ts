// @ts-nocheck
import { convertArabicToEnglish, getDefaultDateTime, generateInvoiceNumber } from '../utils/accounting';

const collectionApiMap = {
    revenues: '/api/revenues',
    expenses: '/api/expenses',
    advances: '/api/advances',
    suspended: '/api/suspended',
    pendingExpenses: '/api/pending-expenses',
    employees: '/api/employees',
    payroll: '/api/payrolls',
    inventory: '/api/inventory-items',
    pendingInvoices: '/api/inventory-entries',
    inventoryWithdrawals: '/api/inventory-withdrawals',
    inventoryDispatches: '/api/inventory-withdrawals',
} as const;

export const collectionApiKeys = Object.keys(collectionApiMap);

export const parseAmountValue = (value) => {
    const normalized = convertArabicToEnglish((value ?? '').toString());
    const cleaned = normalized.replace(/[^0-9.]/g, '');
    const numeric = parseFloat(cleaned);
    return Number.isFinite(numeric) ? numeric : 0;
};

export const normalizeAmountForApi = (value) => {
    const numeric = parseAmountValue(value);
    return Number.isFinite(numeric) ? numeric.toString() : '0';
};

export const preparePayloadForApi = (collectionName, item, currentUser) => {
    if (!item || typeof item !== 'object') {
        return null;
    }

    const currentUserId = currentUser?.id;

    switch (collectionName) {
        case 'revenues':
            return {
                id: item.id,
                amount: normalizeAmountForApi(item.amount),
                category: item.category || '',
                description: item.description || '',
                date: item.date || getDefaultDateTime(),
                createdBy: item.createdBy || currentUserId || undefined,
            };
        case 'expenses':
            return {
                id: item.id,
                amount: normalizeAmountForApi(item.amount),
                category: item.category || '',
                description: item.description || '',
                date: item.date || getDefaultDateTime(),
                createdBy: item.createdBy || currentUserId || undefined,
            };
        case 'advances':
            return {
                id: item.id,
                employeeName: item.employeeName || '',
                amount: normalizeAmountForApi(item.amount),
                category: item.category || '',
                notes: item.notes || '',
                date: item.date || getDefaultDateTime(),
                createdBy: item.createdBy || currentUserId || undefined,
            };
        case 'suspended':
            return {
                id: item.id,
                recipientName: item.recipientName || '',
                amount: normalizeAmountForApi(item.amount),
                notes: item.notes || '',
                date: item.date || getDefaultDateTime(),
                createdBy: item.createdBy || currentUserId || undefined,
            };
        case 'pendingExpenses':
            return {
                id: item.id,
                type: item.type || 'expense',
                amount: normalizeAmountForApi(item.amount),
                category: item.category || '',
                description: item.description || '',
                employeeName: item.employeeName || '',
                date: item.date || getDefaultDateTime(),
                status: item.status || 'pending',
                createdBy: item.createdBy || currentUserId || undefined,
            };
        case 'employees':
            return {
                id: item.id,
                name: item.name || '',
                phone: item.phone || '',
                dateOfBirth: item.dateOfBirth || '',
                department: item.department || '',
                jobTitle: item.jobTitle || '',
                basicSalary: normalizeAmountForApi(item.basicSalary ?? item.salary ?? 0),
            };
        case 'payroll':
            return {
                id: item.id,
                employeeName: item.employeeName || '',
                basicSalary: normalizeAmountForApi(item.basicSalary),
                bonuses: normalizeAmountForApi(item.bonuses),
                deductions: normalizeAmountForApi(item.deductions),
                absenceDays: Number.isFinite(Number(item.absenceDays)) ? Number(item.absenceDays) : 0,
                absenceDeduction: normalizeAmountForApi(item.absenceDeduction),
                overtimeHours: Number.isFinite(Number(item.overtimeHours)) ? Number(item.overtimeHours) : 0,
                overtimeAmount: normalizeAmountForApi(item.overtimeAmount),
                netSalary: normalizeAmountForApi(item.netSalary),
                month: item.month || '',
                paid: !!item.paid,
                notes: item.notes || '',
                createdBy: item.createdBy || currentUserId || undefined,
            };
        case 'inventory':
            return {
                id: item.id,
                name: item.name || '',
                category: item.category || '',
                barcode: item.barcode || '',
                price: normalizeAmountForApi(item.price),
                count: Number.isFinite(Number(item.count)) ? Number(item.count) : 0,
                purchaseHistory: Array.isArray(item.purchaseHistory) ? item.purchaseHistory : [],
                invoiceImageUrl: item.invoiceImageUrl || '',
            };
        case 'pendingInvoices':
            return {
                id: item.id,
                invoiceNumber: item.invoiceNumber || generateInvoiceNumber(),
                vendor: item.vendor || '',
                representative: item.representative || '',
                items: Array.isArray(item.items) ? item.items : [],
                totalCost: normalizeAmountForApi(item.totalCost),
                status: item.status || 'pending',
                invoiceImageUrl: item.invoiceImageUrl || '',
                cancellationReason: item.cancellationReason || '',
                date: item.date || getDefaultDateTime(),
                createdBy: item.createdBy || currentUserId || undefined,
                approvedBy: item.approvedBy || undefined,
                approvedAt: item.approvedAt || undefined,
            };
        case 'inventoryWithdrawals':
        case 'inventoryDispatches':
            return {
                id: item.id,
                items: Array.isArray(item.items) ? item.items : [],
                notes: item.notes || '',
                date: item.date || getDefaultDateTime(),
                createdBy: item.createdBy || currentUserId || undefined,
            };
        default:
            return null;
    }
};

const parseJsonResponse = async (response) => {
    if (response.status === 204) {
        return null;
    }

    try {
        return await response.json();
    } catch (error) {
        return null;
    }
};

const request = async (url, options) => {
    const response = await fetch(url, {
        headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {}),
        },
        ...options,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Request failed with status ${response.status}`);
    }

    return parseJsonResponse(response);
};

export const createRecordViaApi = async (collectionName, item, currentUser) => {
    const endpoint = collectionApiMap[collectionName];
    if (!endpoint) {
        return null;
    }

    const payload = preparePayloadForApi(collectionName, item, currentUser);
    if (!payload) {
        return null;
    }

    return request(endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
    });
};

export const updateRecordViaApi = async (collectionName, item, currentUser) => {
    const endpoint = collectionApiMap[collectionName];
    if (!endpoint || !item?.id) {
        return null;
    }

    const payload = preparePayloadForApi(collectionName, item, currentUser);
    if (!payload) {
        return null;
    }

    const url = `${endpoint}/${encodeURIComponent(item.id)}`;
    return request(url, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
};

export const deleteRecordViaApi = async (collectionName, id) => {
    const endpoint = collectionApiMap[collectionName];
    if (!endpoint || !id) {
        return false;
    }

    const url = `${endpoint}/${encodeURIComponent(id)}`;
    await request(url, {
        method: 'DELETE',
        body: undefined,
    });
    return true;
};

export { collectionApiMap };
