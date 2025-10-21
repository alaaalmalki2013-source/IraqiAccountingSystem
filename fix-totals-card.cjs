const fs = require('fs');

console.log('🔧 إصلاح بطاقة المجموع...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// إصلاح bg-teal-50 text-teal-800 في بطاقة المجموع
content = content.replace(
    'bg-teal-50 text-teal-800 flex flex-col items-center justify-center shadow-md border-t-4 border-teal-600',
    'bg-teal-50 dark:bg-teal-900/30 text-teal-800 dark:text-teal-200 flex flex-col items-center justify-center shadow-md border-t-4 border-teal-600 dark:border-teal-400'
);

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('✓ تم إصلاح بطاقة المجموع المفلتر');
console.log('\n✅ تم الإصلاح بنجاح!\n');
