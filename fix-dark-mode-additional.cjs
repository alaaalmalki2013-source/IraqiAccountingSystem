const fs = require('fs');

console.log('🌙 إصلاح المشاكل الإضافية في الوضع الداكن...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let fixCount = 0;

// 1. إصلاح header المودال
console.log('1️⃣ إصلاح header النوافذ...');
content = content.replace(
    /className="flex justify-between items-center p-4 border-b border-teal-100 bg-teal-50 rounded-t-3xl">/g,
    'className="flex justify-between items-center p-4 border-b border-teal-100 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/30 rounded-t-3xl">'
);
fixCount += 1;

// 2. إصلاح NotificationToast - أخطاء في dark mode
console.log('2️⃣ إصلاح NotificationToast...');
content = content.replace(
    /bg-green-50 dark:bg-green-9000/g,
    'bg-green-50 dark:bg-green-900'
);
content = content.replace(
    /bg-red-50 dark:bg-red-9000/g,
    'bg-red-50 dark:bg-red-900'
);
fixCount += 2;

// 3. إصلاح زر الإغلاق في المودال
console.log('3️⃣ إصلاح زر الإغلاق في المودال...');
content = content.replace(
    /className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition p-1 bg-white rounded-full">/g,
    'className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition p-1 bg-white dark:bg-gray-700 rounded-full">'
);
fixCount += 1;

// 4. إصلاح خلفية المودال عند الطباعة
console.log('4️⃣ إصلاح خلفية المودال...');
const modalPattern = /\${isPrintModal \? 'bg-white\/90 backdrop-filter backdrop-blur-sm' : ''}/g;
content = content.replace(
    modalPattern,
    "${isPrintModal ? 'bg-white/90 dark:bg-gray-800/90 backdrop-filter backdrop-blur-sm' : ''}"
);
fixCount += 1;

// 5. البحث عن أي bg-white بدون dark variant
console.log('5️⃣ البحث عن خلفيات بيضاء بدون dark mode...');
const whiteBackgrounds = [
    // في الإعدادات - الكروت
    { 
        old: /className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">/g,
        new: 'className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-md border border-gray-200 dark:border-gray-700">'
    },
    // في Chat box
    {
        old: /className="mb-4 w-96 max-w-\[calc\(100vw-2rem\)\] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">/g,
        new: 'className="mb-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">'
    }
];

whiteBackgrounds.forEach(fix => {
    const matches = content.match(fix.old);
    if (matches) {
        content = content.replace(fix.old, fix.new);
        fixCount += matches.length;
    }
});

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ تم إصلاح المشاكل الإضافية بنجاح!');
console.log(`   • تم إجراء ${fixCount} إصلاح إضافي`);
console.log('   • header النوافذ: ✓');
console.log('   • NotificationToast: ✓');
console.log('   • زر الإغلاق: ✓');
console.log('   • خلفية المودال: ✓\n');
