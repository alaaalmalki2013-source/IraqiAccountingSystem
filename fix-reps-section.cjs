const fs = require('fs');

console.log('🔧 إصلاح قسم المندوبين...\n');

const filePath = 'client/src/pages/AccountingApp.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. إصلاح div إدارة المندوبين
const before1 = 'border-blue-500 bg-gray-50">';
const after1 = 'border-blue-500 bg-gray-50 dark:bg-gray-800">';
content = content.replace(before1, after1);
console.log('✓ إصلاح خلفية div المندوبين');

// 2. إصلاح form إضافة مندوب
const before2 = 'className="space-y-3 p-3 border rounded-xl bg-white">';
const after2 = 'className="space-y-3 p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">';
content = content.replace(before2, after2);
console.log('✓ إصلاح خلفية form إضافة مندوب');

// كتابة الملف
fs.writeFileSync(filePath, content, 'utf8');

console.log('\n✅ تم إصلاح قسم المندوبين بنجاح!\n');
