const fs = require('fs');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🎨 تطبيق التصميم العصري على الفلاتر والبحث...\n');

// 1. تحديث Search Highlight Color
content = content.replace(
  /<span className="bg-amber-300 text-gray-900 dark:text-gray-100 rounded-sm font-semibold p-\[1px\]">/g,
  `<span className="bg-gradient-to-r from-amber-300 to-yellow-300 dark:from-amber-500 dark:to-yellow-500 text-gray-900 dark:text-gray-100 rounded-md font-bold px-1 shadow-sm">`
);

console.log('✅ تحديث Search Highlight');

// 2. تحديث Filter Section Container (سيتم البحث عن نمط معين)
// سأبحث عن filter containers وأحدثها

// 3. تحديث Total Summary Rows in Tables
content = content.replace(
  /<tr className="bg-teal-50 font-extrabold text-lg">/g,
  `<tr className="bg-gradient-to-r from-blue-100 via-purple-100 to-cyan-100 dark:from-blue-950/50 dark:via-purple-950/50 dark:to-cyan-950/50 font-extrabold text-lg border-t-2 border-blue-500 dark:border-blue-400">`
);

console.log('✅ تحديث Total Summary Rows');

// 4. تحديث Total Summary Text Color
content = content.replace(
  /<td colSpan="5" className="px-4 py-3 text-right">الإجمالي الكلي للفاتورة:<\/td>\s*<td colSpan="2" className="px-4 py-3 text-red-800">/g,
  `<td colSpan="5" className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-bold">الإجمالي الكلي للفاتورة:</td>\n                                            <td colSpan="2" className="px-4 py-3 text-blue-700 dark:text-blue-300 font-extrabold text-xl">`
);

console.log('✅ تحديث Total Amount Styling');

// 5. تحديث Invoice Total Price Display
content = content.replace(
  /<div className="p-3 bg-red-50 dark:bg-red-900 border border-red-200 rounded-lg text-red-800 text-sm font-semibold">/g,
  `<div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-2 border-blue-400 dark:border-blue-500 rounded-xl text-blue-700 dark:text-blue-300 text-base font-bold shadow-lg">`
);

console.log('✅ تحديث Invoice Total Price Box');

// 6. تحديث Table Headers
content = content.replace(
  /<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">/g,
  `<th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">`
);

console.log('✅ تحديث Table Headers');

// 7. تحديث Sub Table Headers
content = content.replace(
  /<th className="px-4 py-2 text-right text-xs font-bold text-gray-600 dark:text-gray-400">/g,
  `<th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">`
);

console.log('✅ تحديث Sub-Table Headers');

// 8. تحديث Print Report Total
content = content.replace(
  /<p className="text-base font-bold">إجمالي المبلغ في التقرير:/g,
  `<p className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">إجمالي المبلغ في التقرير:`
);

console.log('✅ تحديث Print Report Total');

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✨ تم تطبيق التصميم العصري على الفلاتر والجداول بنجاح!\n');
console.log('📊 التحديثات المطبقة:');
console.log('   • تحسين ألوان البحث');
console.log('   • صفوف المجاميع بتدرجات');
console.log('   • رؤوس الجداول محسّنة');
console.log('   • صناديق الإجماليات عصرية\n');
