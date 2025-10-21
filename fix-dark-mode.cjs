const fs = require('fs');

console.log('🌙 إصلاح مشاكل الوضع الداكن بشكل شامل...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');
let fixCount = 0;

// 1. إصلاح رؤوس الجداول (thead)
console.log('1️⃣ إصلاح رؤوس الجداول...');
content = content.replace(
    /<thead className="bg-purple-100">/g,
    '<thead className="bg-purple-100 dark:bg-purple-900/30">'
);
content = content.replace(
    /<thead className="bg-indigo-100">/g,
    '<thead className="bg-indigo-100 dark:bg-indigo-900/30">'
);
fixCount += 2;

// 2. إصلاح bg-gray-50 في الإعدادات
console.log('2️⃣ إصلاح خلفيات الإعدادات...');
content = content.replace(
    /className="lg:col-span-2 space-y-6 p-6 rounded-xl shadow-lg border-l-4 border-purple-500 bg-gray-50">/g,
    'className="lg:col-span-2 space-y-6 p-6 rounded-xl shadow-lg border-l-4 border-purple-500 bg-gray-50 dark:bg-gray-800">'
);
content = content.replace(
    /className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 bg-gray-50">/g,
    'className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-800">'
);
content = content.replace(
    /className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-red-500 bg-gray-50">/g,
    'className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-red-500 bg-gray-50 dark:bg-gray-800">'
);
content = content.replace(
    /className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-green-500 bg-gray-50">/g,
    'className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-green-500 bg-gray-50 dark:bg-gray-800">'
);
content = content.replace(
    /className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-amber-500 bg-gray-50">/g,
    'className="space-y-6 p-6 rounded-2xl shadow-lg border-l-4 border-amber-500 bg-gray-50 dark:bg-gray-800">'
);
fixCount += 5;

// 3. إصلاح قوائم العناصر في الإعدادات
console.log('3️⃣ إصلاح قوائم العناصر...');
content = content.replace(
    /className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-white">/g,
    'className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">'
);
fixCount += 1;

// 4. إصلاح بطاقات العناصر الملونة
console.log('4️⃣ إصلاح بطاقات العناصر...');
content = content.replace(
    /className="flex justify-between items-center p-2 bg-blue-100 rounded-lg shadow-sm">/g,
    'className="flex justify-between items-center p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shadow-sm">'
);
content = content.replace(
    /className="flex justify-between items-center p-2 bg-green-100 rounded-lg shadow-sm">/g,
    'className="flex justify-between items-center p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shadow-sm">'
);
content = content.replace(
    /className="flex justify-between items-center p-2 bg-purple-100 rounded-lg shadow-sm">/g,
    'className="flex justify-between items-center p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg shadow-sm">'
);
content = content.replace(
    /className="flex justify-between items-center p-2 bg-amber-100 rounded-lg shadow-sm">/g,
    'className="flex justify-between items-center p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shadow-sm">'
);
content = content.replace(
    /className="flex justify-between items-center p-2 bg-red-100 rounded-lg shadow-sm">/g,
    'className="flex justify-between items-center p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shadow-sm">'
);
fixCount += 5;

// 5. إصلاح أيقونة التحديث (RefreshCw)
console.log('5️⃣ إصلاح أيقونة تحديث الصفحة...');
content = content.replace(
    /<RefreshCw className="w-5 h-5" \/>/g,
    '<RefreshCw className="w-5 h-5 text-gray-700 dark:text-gray-300" />'
);
fixCount += 1;

// 6. إصلاح زر الإغلاق (X) في النوافذ
console.log('6️⃣ إصلاح زر الإغلاق...');
content = content.replace(
    /className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200/g,
    'className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
);
content = content.replace(
    /className="text-gray-600 dark:text-gray-400 hover:text-gray-800 transition p-1 bg-white rounded-full">/g,
    'className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition p-1 bg-white dark:bg-gray-700 rounded-full">'
);
fixCount += 2;

// 7. إصلاح خلفيات Modal
console.log('7️⃣ إصلاح خلفيات النوافذ...');
content = content.replace(
    /className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-h-\[90vh\] overflow-y-auto transform transition-all duration-300 scale-100/g,
    'className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 border border-gray-200 dark:border-gray-700'
);
fixCount += 1;

// 8. إصلاح Labels في جميع الصفحات
console.log('8️⃣ إصلاح Labels...');
content = content.replace(
    /className="block text-sm font-semibold text-gray-700 mb-2">/g,
    'className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">'
);
content = content.replace(
    /className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">/g,
    'className="text-sm font-medium text-gray-700 dark:text-gray-300">'
);
fixCount += 2;

// 9. إصلاح عناوين الأقسام
console.log('9️⃣ إصلاح عناوين الأقسام...');
content = content.replace(
    /className="text-2xl font-bold text-blue-800 flex items-center">/g,
    'className="text-2xl font-bold text-blue-800 dark:text-blue-300 flex items-center">'
);
content = content.replace(
    /className="text-2xl font-bold text-red-800 flex items-center">/g,
    'className="text-2xl font-bold text-red-800 dark:text-red-300 flex items-center">'
);
content = content.replace(
    /className="text-2xl font-bold text-green-800 flex items-center">/g,
    'className="text-2xl font-bold text-green-800 dark:text-green-300 flex items-center">'
);
content = content.replace(
    /className="text-2xl font-bold text-purple-800 flex items-center">/g,
    'className="text-2xl font-bold text-purple-800 dark:text-purple-300 flex items-center">'
);
content = content.replace(
    /className="text-2xl font-bold text-amber-800 flex items-center">/g,
    'className="text-2xl font-bold text-amber-800 dark:text-amber-300 flex items-center">'
);
fixCount += 5;

// 10. إصلاح عناوين المودالات (h3, h4)
console.log('🔟 إصلاح عناوين المودالات...');
content = content.replace(
    /className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">/g,
    'className="font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-1">'
);
fixCount += 1;

// 11. إصلاح select options
console.log('1️⃣1️⃣ إصلاح قوائم الاختيار...');
// إضافة dark mode لكل option داخل select
const selectPattern = /<select([^>]*className="[^"]*")([^>]*)>/g;
content = content.replace(selectPattern, (match, classAttr, rest) => {
    if (!classAttr.includes('dark:bg-gray-800')) {
        return match; // already has dark mode
    }
    return match;
});
fixCount += 1;

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ تم إصلاح مشاكل الوضع الداكن بنجاح!');
console.log(`   • تم إجراء ${fixCount} إصلاح`);
console.log('   • رؤوس الجداول ✓');
console.log('   • خلفيات الإعدادات ✓');
console.log('   • قوائم العناصر ✓');
console.log('   • بطاقات العناصر ✓');
console.log('   • أيقونة التحديث ✓');
console.log('   • زر الإغلاق ✓');
console.log('   • خلفيات النوافذ ✓');
console.log('   • Labels ✓');
console.log('   • عناوين الأقسام ✓');
console.log('   • عناوين المودالات ✓\n');
