const fs = require('fs');

console.log('🔄 تحديث الاستيرادات في AccountingApp.tsx...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. إضافة استيرادات الدوال المساعدة والثوابت في البداية
const newImports = `
// استيراد الثوابت والأنواع
import {
    STORAGE_KEY,
    CUSTOM_CATEGORY_COLORS,
    BASE_PERMISSIONS,
    defaultSettings,
    defaultDataStructure
} from '../types/accounting';

// استيراد الدوال المساعدة
import {
    generateInvoiceNumber,
    generateBarcode,
    convertArabicToEnglish,
    normalizeTextForSearch,
    formatCurrencyDisplay,
    getDefaultDateTime,
    highlightText,
    exportToCsv,
    getCurrentMonthRange
} from '../utils/accounting';
`;

// 2. إزالة التعريفات القديمة للثوابت والدوال (من السطر 56 إلى 306)
const lines = content.split('\n');

// البحث عن نهاية الاستيرادات
let importEndIndex = 0;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('from \'lucide-react\';')) {
        importEndIndex = i + 1;
        break;
    }
}

// البحث عن بداية المكونات (بعد الثوابت والدوال)
let componentsStartIndex = 0;
for (let i = importEndIndex; i < lines.length; i++) {
    if (lines[i].includes('// =================================================================') && 
        lines[i+1] && lines[i+1].includes('// 2. المكونات الأساسية')) {
        componentsStartIndex = i;
        break;
    }
}

if (importEndIndex > 0 && componentsStartIndex > 0) {
    // إنشاء المحتوى الجديد
    const before = lines.slice(0, importEndIndex).join('\n');
    const after = lines.slice(componentsStartIndex).join('\n');
    
    content = before + '\n' + newImports + '\n' + after;
    
    fs.writeFileSync(filePath, content, 'utf8');
    
    console.log('✅ تم تحديث الاستيرادات بنجاح!');
    console.log(`   • تم إزالة ${componentsStartIndex - importEndIndex} سطر من الثوابت والدوال`);
    console.log('   • تم إضافة استيرادات من types/accounting و utils/accounting');
    console.log(`   • الحجم الجديد: ${lines.length - (componentsStartIndex - importEndIndex)} سطر\n`);
} else {
    console.log('❌ لم يتم العثور على نقاط التحديث المطلوبة');
}
