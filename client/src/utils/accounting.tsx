// @ts-nocheck
import React from 'react';

// توليد رقم فاتورة عشوائي
export const generateInvoiceNumber = () => Math.floor(100000000 + Math.random() * 900000000).toString();

// توليد باركود عشوائي
export const generateBarcode = () => Math.floor(100000000000 + Math.random() * 9000000000000).toString();

/**
 * تحويل الأرقام العربية إلى إنجليزية وتوحيد الفاصل العشري
 */
export const convertArabicToEnglish = (input: any): any => {
    if (typeof input !== 'string') return input;
    
    let cleanedInput = input.replace(/,/g, '');
    cleanedInput = cleanedInput.replace(/٫/g, '.');

    let normalizedArabic = cleanedInput
        .replace(/أ|إ|آ/g, 'ا')
        .replace(/ى/g, 'ي')
        .replace(/ة/g, 'ت')
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
    
    const englishNumbers = normalizedArabic.replace(/[^0-9ا-ي. ]/g, ''); 
    
    const parts = englishNumbers.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return englishNumbers;
};

/**
 * دالة فلترة قوية تعتمد على تحويل النص للمقارنة الدقيقة
 */
export const normalizeTextForSearch = (text: any, isNumeric = false): string => {
    if (!text) return '';
    const normalized = convertArabicToEnglish(text);

    if (isNumeric) {
        return normalized.replace(/[^0-9.]/g, '').toLowerCase();
    }
    return normalized.toLowerCase();
};

// تنسيق عرض العملة
export const formatCurrencyDisplay = (amount: any): string => 
    (parseFloat(amount) || 0).toLocaleString('en-US', { 
        minimumFractionDigits: 0, 
        maximumFractionDigits: 0 
    }) + ' د.ع.';

/**
 * تنسيق التاريخ بصيغة dd/mm/yyyy
 */
export const formatDateDDMMYYYY = (dateString: any): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
};

/**
 * تنسيق التاريخ والوقت بصيغة dd/mm/yyyy HH:MM
 */
export const formatDateTimeDDMMYYYY = (dateString: any): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

// دالة مساعدة لتاريخ ووقت افتراضي
export const getDefaultDateTime = (): string => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISO = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISO;
};

/**
 * دالة لتمييز النص في الجدول
 */
export const highlightText = (text: any, search: any) => {
    if (!search || !text) return text;
    
    const textStr = text.toString();
    const searchStr = search.toString();
    
    const searchLower = normalizeTextForSearch(searchStr, false);
    const textLower = normalizeTextForSearch(textStr, false);
    
    const normalizedSearch = searchLower.trim();
    
    if (textLower.includes(normalizedSearch) && normalizedSearch.length > 0) {
        const regexPattern = normalizedSearch.split('').map(char => {
            if (/[0-9.]/.test(char)) return char;
            if (char === 'ا') return '[أإآا]';
            if (char === 'ي') return '[ىي]';
            if (char === 'ت') return '[تة]'; 
            return char;
        }).join('.*?');
        
        const safeRegex = new RegExp(regexPattern, 'gi');
        
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = safeRegex.exec(textStr)) !== null) {
            if (match.index > lastIndex) {
                parts.push(textStr.substring(lastIndex, match.index));
            }
            parts.push(
                <span key={match.index} className="bg-amber-300 text-gray-900 dark:text-gray-100 rounded-sm font-semibold p-[1px]">
                    {match[0]}
                </span>
            );
            lastIndex = safeRegex.lastIndex;
        }
        
        if (lastIndex < textStr.length) {
            parts.push(textStr.substring(lastIndex));
        }
        
        return <span>{parts}</span>;
    }
    
    const numericSearchLower = normalizeTextForSearch(searchStr, true);
    if (numericSearchLower.length > 0 && normalizeTextForSearch(textStr, true).includes(numericSearchLower)) {
        return (
            <span>
                {textStr.split(searchStr).map((part, index) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < textStr.split(searchStr).length - 1 && (
                            <span className="bg-gradient-to-r from-amber-300 to-yellow-300 dark:from-amber-500 dark:to-yellow-500 text-gray-900 dark:text-gray-100 rounded-md font-bold px-1 shadow-sm">{searchStr}</span>
                        )}
                    </React.Fragment>
                ))}
            </span>
        );
    }

    return text;
};

// دالة التصدير إلى CSV
export const exportToCsv = (reportData: any[], filename: string) => {
    if (reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    
    const csvContent = [
        headers.join(';'),
        ...reportData.map(row => 
            headers.map(header => {
                let value = row[header] || '';
                value = String(value).replace(/;/g, '').replace(/\n/g, ' '); 
                return `"${value}"`; 
            }).join(';')
        )
    ].join('\n');

    const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([BOM, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// للحصول على تاريخ بداية ونهاية الشهر الحالي
export const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const formatDate = (date) => date.toISOString().slice(0, 10);
    
    return {
        start: formatDate(start),
        end: formatDate(end)
    };
};
