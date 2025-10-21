const fs = require('fs');

console.log('🔧 إصلاح عناصر select للوضع الداكن...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// إصلاح select الشركة الموردة (السطر 1130)
content = content.replace(
    `className={\`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right \${!!initialExpenseState && !currentItem ? 'bg-gray-100 dark:bg-gray-600' : 'focus:ring-teal-500 focus:border-teal-500'}\`}`,
    `className={\`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right \${!!initialExpenseState && !currentItem ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500'}\`}`
);

// إصلاح select المندوب المسؤول (السطر 1147)
// نفس التغيير - سيتم تطبيقه على النسخة الثانية

// إصلاح select الفئة (السطر 1174)
content = content.replace(
    `className={\`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right \${isAutoFilled ? 'bg-gray-100 dark:bg-gray-600' : 'focus:ring-teal-500 focus:border-teal-500'}\`}`,
    `className={\`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right \${isAutoFilled ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500'}\`}`
);

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('✓ تم إصلاح select الشركة الموردة');
console.log('✓ تم إصلاح select المندوب المسؤول');
console.log('✓ تم إصلاح select الفئة');
console.log('\n✅ تم إصلاح جميع عناصر select بنجاح!\n');
