const fs = require('fs');

console.log('🔧 إصلاح خلفية div سجل عمليات الصرف...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// إصلاح bg-gray-50 في div سجل الصرف
content = content.replace(
    'p-6 space-y-4 rounded-xl shadow-lg border-l-4 border-indigo-500 bg-gray-50',
    'p-6 space-y-4 rounded-xl shadow-lg border-l-4 border-indigo-500 bg-gray-50 dark:bg-gray-800'
);

// إصلاح text-indigo-800 في العنوان
content = content.replace(
    'text-2xl font-bold text-indigo-800 flex items-center border-b pb-2',
    'text-2xl font-bold text-indigo-800 dark:text-indigo-200 flex items-center border-b dark:border-gray-600 pb-2'
);

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('✓ تم إصلاح خلفية div سجل عمليات الصرف');
console.log('✓ تم إصلاح لون العنوان');
console.log('\n✅ تم الإصلاح بنجاح!\n');
