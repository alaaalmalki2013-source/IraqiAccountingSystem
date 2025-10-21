const fs = require('fs');

console.log('🔧 إصلاح خلفية div الفلاتر...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// إصلاح bg-gray-50 في div الفلاتر الرئيسي
content = content.replace(
    'lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 shadow-inner',
    'lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-inner'
);

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('✓ تم إصلاح خلفية div الفلاتر');
console.log('\n✅ تم الإصلاح بنجاح!\n');
