const fs = require('fs');

// قراءة الملف
const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🎨 بدء تطبيق التصميم العصري...\n');

// 1. تحديث Dashboard Primary Cards
content = content.replace(
  /const primaryCards = \[\s*{[^}]*title: 'رصيد الصندوق الحالي'[^}]*},\s*{[^}]*title: 'الإيرادات الإجمالية'[^}]*},\s*{[^}]*title: 'الصرفيات الإجمالية'[^}]*},\s*\];/s,
  `const primaryCards = [
        { 
            title: 'رصيد الصندوق الحالي', 
            value: formatCurrencyDisplay(summaryData.totalCashFund), 
            icon: DollarSign, 
            color: summaryData.totalCashFund >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400', 
            bg: 'bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50',
            iconBg: 'bg-blue-500/20 dark:bg-blue-500/30',
            gradient: true
        },
        { 
            title: 'الإيرادات الإجمالية', 
            value: formatCurrencyDisplay(summaryData.totalRevenues), 
            icon: TrendingUp, 
            color: 'text-emerald-600 dark:text-emerald-400', 
            bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/50',
            iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
            gradient: true
        },
        { 
            title: 'الصرفيات الإجمالية', 
            value: formatCurrencyDisplay(summaryData.totalExpenses), 
            icon: TrendingDown, 
            color: 'text-rose-600 dark:text-rose-400', 
            bg: 'bg-gradient-to-br from-rose-100 to-rose-200 dark:from-rose-950/50 dark:to-rose-900/50',
            iconBg: 'bg-rose-500/20 dark:bg-rose-500/30',
            gradient: true
        },
    ];`
);

console.log('✅ تم تحديث Primary Cards');

// 2. تحديث Dashboard Secondary Cards
content = content.replace(
  /const secondaryCards = \[\s*{[^}]*title: 'مجموع السلف'[^}]*},\s*{[^}]*title: 'مجموع المبالغ المعلقة'[^}]*},\s*{[^}]*title: 'إجمالي رواتب الموظفين'[^}]*},\s*\];/s,
  `const secondaryCards = [
        { 
            title: 'مجموع السلف', 
            value: formatCurrencyDisplay(summaryData.totalAdvances), 
            icon: Coins, 
            color: 'text-violet-600 dark:text-violet-400', 
            bg: 'bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-950/50 dark:to-violet-900/50',
            iconBg: 'bg-violet-500/20 dark:bg-violet-500/30',
            gradient: true
        },
        { 
            title: 'مجموع المبالغ المعلقة', 
            value: formatCurrencyDisplay(summaryData.totalSuspended), 
            icon: RotateCcw, 
            color: 'text-amber-600 dark:text-amber-400', 
            bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/50 dark:to-amber-900/50',
            iconBg: 'bg-amber-500/20 dark:bg-amber-500/30',
            gradient: true
        },
        { 
            title: 'إجمالي رواتب الموظفين', 
            value: formatCurrencyDisplay(summaryData.totalSalaries), 
            icon: Users, 
            color: 'text-purple-600 dark:text-purple-400', 
            bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/50 dark:to-purple-900/50',
            iconBg: 'bg-purple-500/20 dark:bg-purple-500/30',
            gradient: true
        },
    ];`
);

console.log('✅ تم تحديث Secondary Cards');

// 3. تحديث Dashboard Card Styling
content = content.replace(
  /<div key={index} className="p-6 rounded-2xl shadow-lg transition transform hover:scale-\[1\.03\] border-l-4 border-teal-500 dark:border-teal-400 bg-gray-50 dark:bg-gray-700">/g,
  `<div key={index} className={\`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border dark:border-gray-200/10 \${card.bg}\`}>`
);

console.log('✅ تم تحديث Card Container Styling');

// 4. تحديث Icon Background
content = content.replace(
  /<div className={\`p-4 rounded-full \${card\.bg}\`}>/g,
  `<div className={\`p-4 rounded-2xl shadow-lg \${card.iconBg}\`}>`
);

console.log('✅ تم تحديث Icon Background');

// 5. تحديث Dashboard Container
content = content.replace(
  /<div className="space-y-8 p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">/,
  `<div className="space-y-8 p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">`
);

console.log('✅ تم تحديث Dashboard Container');

// 6. تحديث Page Header
content = content.replace(
  /<h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-teal-500 pb-3">الرئيسية <\/h2>/,
  `<h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent border-b-2 border-blue-500 dark:border-blue-400 pb-3">الرئيسية</h2>`
);

console.log('✅ تم تحديث Page Header');

// 7. تحديث Section Headers
content = content.replace(
  /<h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600 pb-2">/g,
  `<h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-gradient-to-r from-blue-500 to-purple-500 pb-2">`
);

console.log('✅ تم تحديث Section Headers');

// 8. تحديث Birthday Alert Box
content = content.replace(
  /<div className="bg-pink-100 dark:bg-pink-900 border-l-4 border-pink-500 dark:border-pink-400 p-4 rounded-xl shadow-md">/,
  `<div className="bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-950/50 dark:to-rose-950/50 border-l-4 border-pink-500 dark:border-pink-400 p-6 rounded-2xl shadow-xl">`
);

console.log('✅ تم تحديث Birthday Alert Box');

// 9. تحديث Category Stats Cards (Revenue)
content = content.replace(
  /<div className="p-4 rounded-2xl shadow-lg bg-green-50 dark:bg-green-900 border-l-4 border-green-600 dark:border-green-400">/,
  `<div className="p-6 rounded-2xl shadow-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-900/50 border-l-4 border-emerald-500 dark:border-emerald-400">`
);

console.log('✅ تم تحديث Revenue Category Card');

// 10. تحديث Category Stats Cards (Expense)
content = content.replace(
  /<div className="p-4 rounded-2xl shadow-lg bg-red-50 dark:bg-red-900 border-l-4 border-red-600 dark:border-red-400">/,
  `<div className="p-6 rounded-2xl shadow-xl bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950/50 dark:to-red-900/50 border-l-4 border-rose-500 dark:border-rose-400">`
);

console.log('✅ تم تحديث Expense Category Card');

// 11. تحديث Category Title Icons
content = content.replace(
  /<h4 className="text-xl font-bold text-green-800 dark:text-green-200 mb-3 flex items-center">/,
  `<h4 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-4 flex items-center">`
);

content = content.replace(
  /<h4 className="text-xl font-bold text-red-800 dark:text-red-200 mb-3 flex items-center">/,
  `<h4 className="text-xl font-bold text-rose-700 dark:text-rose-300 mb-4 flex items-center">`
);

console.log('✅ تم تحديث Category Titles');

// 12. تحديث Category List Items
content = content.replace(
  /<li key={category} className="flex justify-between items-center p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">/g,
  `<li key={category} className="flex justify-between items-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm">`
);

console.log('✅ تم تحديث Category List Items');

// كتابة الملف المحدّث
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✨ تم تطبيق التصميم العصري بنجاح!\n');
console.log('📊 التحديثات المطبقة:');
console.log('   • Dashboard Cards مع تدرجات لونية');
console.log('   • أيقونات بخلفيات عصرية');
console.log('   • عناوين بتدرجات نصية');
console.log('   • صناديق التنبيهات محسّنة');
console.log('   • قوائم الفئات بتأثيرات hover');
console.log('   • جميع الألوان متوافقة مع Dark Mode\n');
