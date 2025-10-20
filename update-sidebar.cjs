const fs = require('fs');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

console.log('🎨 تطبيق التصميم العصري على Sidebar...\n');

// 1. تحديث Sidebar Background
content = content.replace(
  /className={`app-sidebar \${isSidebarCollapsed \? 'w-16' : 'w-64'} bg-blue-900 text-white flex flex-col shadow-2xl/,
  `className={\`app-sidebar \${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white flex flex-col shadow-2xl border-l border-blue-700 dark:border-gray-700`
);

console.log('✅ تحديث Sidebar Background');

// 2. تحديث Sidebar Header Border
content = content.replace(
  /className={`\${isSidebarCollapsed \? 'p-2' : 'p-6'} text-center border-b border-blue-800 transition-all duration-300`}/,
  `className={\`\${isSidebarCollapsed ? 'p-2' : 'p-6'} text-center border-b-2 border-blue-600 dark:border-gray-700 transition-all duration-300 bg-blue-950/30 dark:bg-gray-950/30\`}`
);

console.log('✅ تحديث Sidebar Header');

// 3. تحديث Navigation Buttons (Active State)
content = content.replace(
  /currentPage === item\.key \? 'bg-blue-700 shadow-lg font-bold' : 'hover:bg-blue-800'/,
  `currentPage === item.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 shadow-xl font-bold scale-105' : 'hover:bg-blue-800/50 dark:hover:bg-gray-700/50 hover:scale-102'`
);

console.log('✅ تحديث Navigation Buttons');

// 4. تحديث About Button Border
content = content.replace(
  /rounded-xl transition duration-200 hover:bg-blue-800 mt-4 border-t border-blue-800 pt-4/,
  `rounded-xl transition-all duration-200 hover:bg-blue-800/50 dark:hover:bg-gray-700/50 mt-4 border-t-2 border-blue-600 dark:border-gray-700 pt-4 hover:scale-102`
);

console.log('✅ تحديث About Button');

// 5. تحديث Theme Toggle Button
content = content.replace(
  /className="w-full flex items-center justify-center p-2 rounded-xl transition duration-200 hover:bg-blue-800"/,
  `className="w-full flex items-center justify-center p-2 rounded-xl transition-all duration-200 hover:bg-blue-800/50 dark:hover:bg-gray-700/50 hover:scale-105"`
);

console.log('✅ تحديث Theme Toggle Button');

// 6. تحديث App Background
content = content.replace(
  /<div className="min-h-screen flex bg-gray-100 dark:bg-gray-600 dark:bg-gray-900 antialiased text-right" dir="rtl">/,
  `<div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 antialiased text-right" dir="rtl">`
);

console.log('✅ تحديث App Background');

// 7. تحديث Mobile Header
content = content.replace(
  /<header className="app-header flex justify-between items-center bg-white dark:bg-gray-800 p-4 mb-4 rounded-xl shadow-md lg:hidden">/,
  `<header className="app-header flex justify-between items-center bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 mb-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 lg:hidden">`
);

console.log('✅ تحديث Mobile Header');

// 8. تحديث Mobile Menu Button
content = content.replace(
  /<button onClick={() => setIsSidebarOpen\(true\)} className="text-blue-600 dark:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-700 transition">/,
  `<button onClick={() => setIsSidebarOpen(true)} className="text-blue-600 dark:text-blue-400 p-2 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-110">`
);

console.log('✅ تحديث Mobile Menu Button');

// 9. تحديث Mobile Theme Toggle
content = content.replace(
  /<button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-700 transition text-gray-700 dark:text-gray-300 dark:text-gray-200">/,
  `<button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 text-gray-700 dark:text-gray-200">`
);

console.log('✅ تحديث Mobile Theme Toggle');

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✨ تم تطبيق التصميم العصري على Sidebar بنجاح!\n');
console.log('📊 التحديثات المطبقة:');
console.log('   • Sidebar بتدرج لوني عصري');
console.log('   • أزرار نشطة بتدرجات زرقاء-بنفسجية');
console.log('   • تأثيرات hover محسّنة');
console.log('   • خلفية التطبيق بتدرج ناعم');
console.log('   • Mobile Header محدّث\n');
