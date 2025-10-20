// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Home,
    DollarSign,
    Users,
    Settings,
    Plus,
    X,
    Edit,
    Trash2,
    Briefcase,
    List,
    RotateCcw,
    TrendingUp,
    TrendingDown,
    Save,
    CalendarCheck,
    Phone,
    UserPlus,
    Coins,
    Filter,
    Calculator,
    Gift,
    ExternalLink,
    Building,
    User,
    Printer,
    Search,
    CheckCircle,
    AlertTriangle,
    Download,
    Package,
    ClipboardCheck,
    Truck,
    Menu, 
    LogOut,
    Info,
    Eye,
    EyeOff,
    Moon,
    Sun,
    ChevronRight,
    ChevronLeft,
    PanelRightClose,
    PanelRightOpen,
    MessageCircle,
    Send,
    Minimize2
} from 'lucide-react';

// =================================================================
// 1. الثوابت والدوال المساعدة (UTILITIES & CONSTANTS)
// =================================================================

const STORAGE_KEY = 'IRAQI_ACCOUNTING_DATA_V3_LOCAL';

// **تعديل:** إضافة ألوان مخصصة للفئات
const CUSTOM_CATEGORY_COLORS = {
    // المصروفات
    'الإيجارات': { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-600' },
    'مواد أولية': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-600' },
    'صيانة': { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-600' },
    // الإيرادات
    'الصالون': { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-600' },
};


// الصلاحيات الأساسية التي يمكن للمستخدم تعديلها
const BASE_PERMISSIONS = {
    dashboard: { view: true },
    revenues: { view: true, add: true, edit: true, delete: true }, // جعل الصلاحيات الافتراضية كاملة
    expenses: { view: true, add: true, edit: true, delete: true },
    advances: { view: true, add: true, edit: true, delete: true },
    suspended: { view: true, add: true, edit: true, delete: true },
    employees: { view: true, add: true, edit: true, delete: true },
    payroll: { view: true, add: true, edit: true, delete: true, pay: true },
    inventoryEntry: { view: true, approve: true, credit: true, cancel: true }, // صلاحيات خاصة للإدخال المخزني
    inventory: { view: true, add: true, edit: true, delete: true },
    settings: { view: true }
};

const defaultSettings = {
    revenueCategories: ['الصالون'],
    expenseCategories: ['الإيجارات', 'مواد أولية', 'صيانة'],
    advanceCategories: ['سلفة شخصية', 'سلفة طارئة', 'سلفة علاجية', 'سلفة عائلية', 'أخرى'],
    departments: ['الإدارة', 'المبيعات', 'المحاسبة'],
    jobTitles: ['مدير الادراة والحسابات', 'موظف مبيعات'],
    vendors: ['السامر', 'الجودة'],
    representatives: [{ name: 'عبد الله', vendor: 'السامر' }],
    companyName: 'نظام الحسابات',
    companyLogoUrl: 'https://placehold.co/100x40/0d9488/ffffff?text=LOGO',
    // **تم إلغاء نظام المستخدمين/المصادقة مؤقتاً**
    users: [
        { 
            id: 'admin_1', 
            username: 'المدير العام', 
            email: 'admin@system.com',
            password: 'password', 
            permissions: BASE_PERMISSIONS,
            darkMode: false,
            sidebarCollapsed: false
        }
    ]
};

const defaultDataStructure = {
    revenues: [],
    expenses: [],
    employees: [],
    advances: [],
    suspended: [],
    inventory: [],
    payroll: [],
    pendingInvoices: [], 
    inventoryDispatches: [
         // سجل صرف تجريبي فارغ
    ], 
    settings: defaultSettings
};

// توليد رقم فاتورة عشوائي
const generateInvoiceNumber = () => Math.floor(100000000 + Math.random() * 900000000).toString();

// توليد باركود عشوائي
const generateBarcode = () => Math.floor(100000000000 + Math.random() * 9000000000000).toString();

/**
 * تحويل الأرقام العربية إلى إنجليزية وتوحيد الفاصل العشري
 */
const convertArabicToEnglish = (input) => {
    if (typeof input !== 'string') return input;
    
    // 1. إزالة فواصل الآلاف
    let cleanedInput = input.replace(/,/g, '');
    
    // 2. توحيد الفاصلة العشرية العربية إلى نقطة
    cleanedInput = cleanedInput.replace(/٫/g, '.');

    // 3. توحيد الأحرف العربية المتشابهة لضمان دقة البحث
    let normalizedArabic = cleanedInput
        .replace(/أ|إ|آ/g, 'ا') // توحيد الهمزات
        .replace(/ى/g, 'ي')     // توحيد الألف المقصورة
        .replace(/ة/g, 'ت')     // توحيد التاء المربوطة
        .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString()); // تحويل الأرقام
    
    // 4. إزالة أي أحرف غير الأرقام والحروف العربية المتبقية والنقطة
    const englishNumbers = normalizedArabic.replace(/[^0-9ا-ي. ]/g, ''); 
    
    // 5. ضمان وجود نقطة عشرية واحدة فقط (للاستخدام النقدي فقط)
    const parts = englishNumbers.split('.');
    if (parts.length > 2) {
        return parts[0] + '.' + parts.slice(1).join('');
    }
    
    return englishNumbers;
};

/**
 * دالة فلترة قوية تعتمد على تحويل النص للمقارنة الدقيقة (شاملة)
 */
const normalizeTextForSearch = (text, isNumeric = false) => {
    if (!text) return '';
    const normalized = convertArabicToEnglish(text);

    if (isNumeric) {
        // إذا كان البحث عن قيمة رقمية، نأخذ الأرقام والنقاط فقط
        return normalized.replace(/[^0-9.]/g, '').toLowerCase();
    }
    // للبحث النصي (الأسماء، الأوصاف)، نستخدم النص الموحد بالكامل
    return normalized.toLowerCase();
};


// تنسيق عرض العملة
const formatCurrencyDisplay = (amount) => (parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' د.ع.';

// دالة مساعدة لتاريخ ووقت افتراضي
const getDefaultDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000; // تحويل الفارق بالدقائق إلى مللي ثانية
    const localISO = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    return localISO;
};

/**
 * دالة لتمييز النص في الجدول بشكل ذكي (مُحسّن للدقة)
 */
const highlightText = (text, search) => {
    if (!search || !text) return text;
    
    const textStr = text.toString();
    const searchStr = search.toString();
    
    // استخدام normalizeTextForSearch للنصوص (غير الرقمية)
    const searchLower = normalizeTextForSearch(searchStr, false);
    const textLower = normalizeTextForSearch(textStr, false);
    
    // **تحسين البحث:** البحث عن التطابق في النص الموحد (المعالج)
    const normalizedSearch = searchLower.trim();
    
    if (textLower.includes(normalizedSearch) && normalizedSearch.length > 0) {
        // إذا وجد تطابق في النص الموحد، نستخدم بحث regex في النص الأصلي
        
        // إنشاء تعبير نمطي يتجاهل الحركات ويفضل التطابق العربي
        const regexPattern = normalizedSearch.split('').map(char => {
            if (/[0-9.]/.test(char)) return char; // الأرقام كما هي
            // توحيد الحروف المتشابهة في البحث للـ Regex
            if (char === 'ا') return '[أإآا]';
            if (char === 'ي') return '[ىي]';
            if (char === 'ت') return '[تة]'; 
            return char;
        }).join('.*?'); // السماح بأي أحرف بين كل حرفين من البحث (للتطابق الجزئي المرن)
        
        const safeRegex = new RegExp(regexPattern, 'gi');
        
        const parts = [];
        let lastIndex = 0;
        let match;
        
        while ((match = safeRegex.exec(textStr)) !== null) {
            if (match.index > lastIndex) {
                parts.push(textStr.substring(lastIndex, match.index));
            }
            parts.push(
                <span key={match.index} className="bg-amber-300 text-gray-900 dark:text-gray-100 rounded-sm font-semibold p-[1px]">
                    {match[0]}
                </span>
            );
            lastIndex = safeRegex.lastIndex;
        }
        
        if (lastIndex < textStr.length) {
            parts.push(textStr.substring(lastIndex));
        }
        
        return <span>{parts}</span>;
    }
    
    // إذا كان البحث رقمي صرف، نطبق التمييز العادي
    const numericSearchLower = normalizeTextForSearch(searchStr, true);
    if (numericSearchLower.length > 0 && normalizeTextForSearch(textStr, true).includes(numericSearchLower)) {
        return (
            <span>
                {textStr.split(searchStr).map((part, index) => (
                    <React.Fragment key={index}>
                        {part}
                        {index < textStr.split(searchStr).length - 1 && (
                            <span className="bg-gradient-to-r from-amber-300 to-yellow-300 dark:from-amber-500 dark:to-yellow-500 text-gray-900 dark:text-gray-100 rounded-md font-bold px-1 shadow-sm">{searchStr}</span>
                        )}
                    </React.Fragment>
                ))}
            </span>
        );
    }


    return text;
};

// دالة التصدير إلى CSV
const exportToCsv = (reportData, filename) => {
    if (reportData.length === 0) return;

    const headers = Object.keys(reportData[0]);
    
    const csvContent = [
        headers.join(';'),
        ...reportData.map(row => 
            headers.map(header => {
                let value = row[header] || '';
                // إزالة الفواصل والنقاط التي قد تفسد ملف CSV، لكن ترك الفاصلة العشرية إذا كانت ضرورية.
                value = String(value).replace(/;/g, '').replace(/\n/g, ' '); 
                return `"${value}"`; 
            }).join(';')
        )
    ].join('\n');

    const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([BOM, csvContent], { type: 'text/csv;charset=utf-8;' });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// للحصول على تاريخ بداية ونهاية الشهر الحالي بصيغة YYYY-MM-DD
const getCurrentMonthRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);

    const formatDate = (date) => date.toISOString().slice(0, 10);
    
    return {
        start: formatDate(start),
        end: formatDate(end)
    };
};

// =================================================================
// 2. المكونات الأساسية (UI PRIMITIVES)
// =================================================================

// مكون التنبيه المنبثق
const NotificationToast = React.memo(({ message, type, onClose }) => {
    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-50 dark:bg-green-9000' : (type === 'error' ? 'bg-red-50 dark:bg-red-9000' : 'bg-amber-500');
    const Icon = isSuccess ? CheckCircle : AlertTriangle;

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-2xl text-white flex items-center space-x-3 space-x-reverse transition-transform duration-300 transform translate-x-0 ${bgColor}`}>
            <Icon className="w-6 h-6" />
            <span className="font-semibold">{message}</span>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
});

// حقل إدخال موحد
const InputField = React.memo(({ label, type = 'text', value, onChange, placeholder, required = false, currency = false, children, inputKey = label, readOnly = false, textarea = false, onBlur, className = '' }) => ( 
    <div className="flex flex-col space-y-1 text-right">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">{label}</label>
        <div className="relative">
            {textarea ? (
                <textarea
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur} 
                    placeholder={placeholder}
                    required={required}
                    onInvalid={(e) => e.target.setCustomValidity(required ? 'هذا الحقل إجباري، يرجى ملئه.' : '')}
                    onInput={(e) => e.target.setCustomValidity('')}
                    readOnly={readOnly}
                    key={inputKey} 
                    rows="4"
                    className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 ${readOnly ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-700 focus:ring-teal-500 focus:border-teal-500 dark:text-white'} ${className}`}
                />
            ) : (
                <input
                    type={type === 'number' && !currency ? 'tel' : type} // استخدام tel للأرقام لتحسين تجربة الجوال، و التعامل مع نوع text للحقول النقدية في الأغلب
                    value={value}
                    onChange={(e) => {
                        if (currency || type === 'number') {
                            // **الحل الجذري للأرقام العربية في جميع أماكن المبالغ:**
                            let newValue = e.target.value;
                            // 1. تحويل الأرقام العربية إلى إنجليزية
                            newValue = convertArabicToEnglish(newValue);
                            // 2. إزالة أي رموز غير الأرقام والنقطة لضمان النظافة
                            newValue = newValue.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); 
                            onChange({ target: { value: newValue } });
                        } else {
                            onChange(e);
                        }
                    }}
                    onBlur={onBlur} 
                    placeholder={placeholder}
                    required={required}
                    onInvalid={(e) => e.target.setCustomValidity(required ? 'هذا الحقل إجباري، يرجى ملئه.' : '')}
                    onInput={(e) => e.target.setCustomValidity('')}
                    readOnly={readOnly}
                    key={inputKey} 
                    className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 ${currency ? 'pr-14 text-right dir-ltr' : ''} ${readOnly ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-700 focus:ring-teal-500 focus:border-teal-500 dark:text-white'} ${className}`}
                />
            )}
            
            {currency && <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 dark:text-gray-400 font-bold">د.ع.</span>}
            {children} 
        </div>
    </div>
));

// زر الإجراءات
const ActionButton = ({ onClick, children, className = 'bg-teal-600 hover:bg-teal-700', type = 'button', disabled = false }) => ( 
    <button
        onClick={onClick}
        type={type}
        disabled={disabled}
        className={`px-6 py-3 text-white rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 space-x-reverse font-semibold ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
        {children}
    </button>
);

// نافذة المودال
const Modal = ({ title, children, onClose, size = 'lg', isPrintModal = false }) => (
    <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
        <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100 
            ${size === 'lg' ? 'max-w-md md:max-w-xl' : size === 'xl' ? 'max-w-3xl' : 'max-w-4xl'} 
            ${isPrintModal ? 'bg-white/90 backdrop-filter backdrop-blur-sm' : ''}
        `} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center p-4 border-b border-teal-100 bg-teal-50 rounded-t-3xl">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex-grow text-center">{title}</h3> 
                <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition p-1 bg-white rounded-full">
                    <X className="w-6 h-6" />
                </button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    </div>
);

// مكون طباعة الفاتورة الفردية
const PrintInvoice = React.memo(({ item, onClose, companyName, companyLogoUrl, employees }) => {
    const [paperSize, setPaperSize] = useState('80mm');

    // تنسيق التاريخ ليكون رقمياً فقط
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        // تنسيق الوقت HH:MM AM/PM والتاريخ MM/DD/YYYY
        return date.toLocaleString('en-US', { 
            year: 'numeric', 
            month: 'numeric', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit', 
            hour12: true 
        });
    }
    // **تعديل:** إزالة الكسور العشرية
    const formatCurrency = (amount) => (parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' د.ع.';

    // ضمان عمل زر الطباعة (HandlePrint)
    const handlePrint = () => {
        const printContent = document.getElementById('print-invoice-content');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            
            const printStyle = document.createElement('style');
            if (paperSize === '80mm') {
                printStyle.innerHTML = `
                    @page { size: 80mm auto; margin: 0; } 
                    body { width: 80mm; font-family: 'Arial', sans-serif; }
                    .invoice-container { padding: 5px; }
                    .invoice-details td, .invoice-details th { padding: 3px; font-size: 10px; }
                    .description-cell { white-space: normal !important; word-break: break-word; }
                `;
            } else { // A4
                printStyle.innerHTML = `
                    @page { size: A4; margin: 15mm; }
                    body { font-family: 'Arial', sans-serif; }
                    .invoice-container { padding: 20px; }
                    .invoice-details td, .invoice-details th { border: 1px solid #ddd; padding: 10px; }
                    .header-a4 { border-bottom: 2px solid #333; }
                    .description-cell { white-space: normal !important; word-break: break-word; }
                    .print-date-right { text-align: left !important; } 
                    .print-date-center { text-align: center !important; } 
                    .no-print-footer { display: none !important; } 
                `;
            }
            document.head.appendChild(printStyle);
            
            window.print();
            
            // استعادة المحتوى الأصلي بعد الطباعة
            setTimeout(() => {
                document.head.removeChild(printStyle);
                document.body.innerHTML = originalContents; 
                onClose(); // إغلاق المودال
            }, 100); 
        }
    };
    
    const isExpense = item.collectionName === 'expenses';
    const isAdvance = item.collectionName === 'advances';

    const employee = isAdvance ? employees.find(e => e.id === item.employeeId) : null;

    const invoiceStyle = paperSize === '80mm' ? { maxWidth: '80mm', margin: '0 auto', fontSize: '11px', lineHeight: '1.4' } : { maxWidth: '100%', fontSize: '12pt', lineHeight: '1.5' };

    return (
        <Modal title="معاينة سند الصرف" onClose={onClose} size={paperSize === 'A4' ? 'xl' : 'sm'} isPrintModal={true}>
            <div className="flex justify-between items-center mb-4 print:hidden">
                <div className="flex items-center space-x-2 space-x-reverse">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">قياس الورق:</label>
                    <select
                        value={paperSize}
                        onChange={(e) => setPaperSize(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition"
                    >
                        <option value="80mm">80 ملم (طابعة حرارية)</option>
                        <option value="A4">A4 (ورق عادي)</option>
                    </select>
                </div>
                <ActionButton onClick={handlePrint} className="bg-green-600 hover:bg-green-700">
                    <Printer className="w-5 h-5 ml-2" />
                    إرسال أمر الطباعة
                </ActionButton>
            </div>
            
            <div id="print-invoice-content" className="p-4 print:p-0 print:block" style={invoiceStyle}>
                <div className="invoice-container">
                    {/* رأس السند (العنوان، الشعار، التاريخ/الفاتورة) */}
                    <div style={{ paddingBottom: '10px', marginBottom: '15px', borderBottom: paperSize === 'A4' ? '2px solid #1f2937' : '1px dashed #333' }}>
                        
                        {/* المنطقة العلوية (الشعار والعنوان) */}
                        <div style={{ textAlign: 'center' }}>
                            {companyLogoUrl && <img src={companyLogoUrl} alt="Logo" style={{ maxHeight: paperSize === 'A4' ? '60px' : '40px', margin: '0 auto' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                            <h4 style={{ margin: '3px 0', fontSize: paperSize === 'A4' ? '24px' : '15px', fontWeight: 'bold', color: '#1f2937' }}>{companyName}</h4>
                            <p style={{ fontSize: paperSize === 'A4' ? '14px' : '10px', margin: '0' }}>{isExpense ? 'سند صرف نقدي' : 'سند سلفة'}</p>
                        </div>
                        
                        {/* التاريخ والفاتورة (متغير حسب A4 أو 80mm) */}
                        <div style={{ 
                            marginTop: '10px',
                            textAlign: paperSize === '80mm' ? 'center' : 'right', // A4 لليمين
                            direction: 'ltr' // تنسيق التاريخ ليكون من اليسار لليمين 
                        }} className={paperSize === 'A4' ? 'print-date-right' : 'print-date-center'}>
                            <p style={{ fontSize: paperSize === 'A4' ? '12px' : '10px', margin: '0' }}>
                                رقم الفاتورة: <span style={{ fontWeight: 'bold' }}>{item.invoiceNumber}</span>
                            </p>
                            <p style={{ fontSize: paperSize === 'A4' ? '12px' : '10px', margin: '0' }}>
                                التاريخ والوقت: <span style={{ fontWeight: 'bold' }}>{formatDate(item.date)}</span>
                            </p>
                        </div>
                    </div>
                    
                    {/* تفاصيل الصرف/السلفة (الجهة المعنية) */}
                    <table className="invoice-details" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '15px' }}>
                        <tbody>
                            {isExpense && <tr><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>فئة الصرف</td><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>{item.category}</td></tr>}
                            {isExpense && <tr><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>المورد</td><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>{item.vendor || 'N/A'}</td></tr>}
                            {isExpense && <tr><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>المندوب</td><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>{item.representative || 'N/A'}</td></tr>}
                            {(isAdvance || isExpense) && employee && <tr><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>الموظف المعني</td><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>{employee.name}</td></tr>}
                            {isAdvance && <tr><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>الجهة المستلمة</td><td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right' }}>{employee ? employee.name : item.employeeName}</td></tr>}
                        </tbody>
                    </table>

                    {/* حقل الوصف (تم تعديل العنوان) */}
                    <div style={{ marginBottom: '15px', border: '1px solid #ccc', borderRadius: '8px', padding: '10px' }}>
                        {/* التعديل 3: تغيير "الوصف المفصل" إلى "وذلك عن" */}
                        <p style={{ margin: '0', fontWeight: 'bold', fontSize: paperSize === 'A4' ? '14px' : '11px', color: '#333' }}>وذلك عن:</p>
                        {/* **إصلاح الخطأ:** تغيير خاصية CSS من hyphenated (word-break) إلى CamelCase (wordBreak) */}
                        <p className="description-cell" style={{ margin: '5px 0 0 0', fontSize: paperSize === 'A4' ? '14px' : '10px', whiteSpace: 'normal', wordBreak: 'break-word' }}>
                            {item.description || item.notes || 'لا يوجد وصف/ملاحظات.'}
                        </p>
                    </div>

                    {/* التعديل 2: القيمة الإجمالية في النهاية */}
                    <table className="invoice-details" style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '30px' }}>
                        <tbody>
                            <tr style={{ backgroundColor: paperSize === 'A4' ? '#f3f4f6' : 'transparent', fontWeight: 'bold' }}>
                                <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', width: '35%', color: '#1f2937' }}>القيمة الإجمالية</td>
                                <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', fontSize: '18px', color: '#B45309' }}>{formatCurrency(item.amount)}</td>
                            </tr>
                        </tbody>
                    </table>
                    
                    {/* التوقيعات */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: paperSize === 'A4' ? '80px' : '30px' }}>
                        <div style={{ textAlign: 'center', fontSize: '12px', width: '45%', borderTop: paperSize === 'A4' ? '1px solid #ccc' : 'none', paddingTop: paperSize === 'A4' ? '10px' : '0' }}>
                            <div style={{ height: paperSize === 'A4' ? '30px' : '20px', borderBottom: '1px solid #000', margin: '5px 0' }}></div>
                            توقيع المستلم
                        </div>
                        <div style={{ textAlign: 'center', fontSize: '12px', width: '45%', borderTop: paperSize === 'A4' ? '1px solid #ccc' : 'none', paddingTop: paperSize === 'A4' ? '10px' : '0' }}>
                            <div style={{ height: paperSize === 'A4' ? '30px' : '20px', borderBottom: '1px solid #000', margin: '5px 0' }}></div>
                            توقيع المحاسب/المدير
                        </div>
                    </div>

                    {/* التعديل 5: إزالة الرسالة السفلية من A4 */}
                </div>
            </div>
            
            <div className="print:hidden space-y-4">
            </div>
        </Modal>
    );
});

// مكون طباعة التقرير الجماعي
const PrintReportModal = React.memo(({ reportData, title, onClose, companyName, companyLogoUrl }) => {
    
    // **تعديل:** إزالة الكسور العشرية
    const formatCurrency = (amount) => (parseFloat(amount) || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' د.ع.';
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US');
    
    const handlePrint = () => {
        const printContent = document.getElementById('print-report-content');
        if (printContent) {
            const originalContents = document.body.innerHTML;
            
            // إنشاء نافذة طباعة جديدة
            const printWindow = window.open('', '', 'height=600,width=800');
            if (printWindow) {
                // إعداد محتوى الطباعة
                printWindow.document.write('<html><head><title>Print Report</title>');
                printWindow.document.write('<style>');
                printWindow.document.write(`
                    body { font-family: 'Cairo', sans-serif; margin: 0; padding: 0; direction: rtl; }
                    @page { size: A4 landscape; margin: 15mm; }
                    .report-table { width: 100%; border-collapse: collapse; }
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 6px; font-size: 8pt; text-align: right; }
                    .report-table th { background-color: #f2f2f2; }
                    .report-header { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; text-align: center; }
                `);
                printWindow.document.write('</style></head><body>');
                printWindow.document.write(printContent.innerHTML);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                
                printWindow.print();
                printWindow.close();
            } else {
                 // لا نستخدم alert()
            }
        }
        onClose(); // إغلاق المودال الأصلي بعد إرسال أمر الطباعة
    };
    
    const totalAmount = reportData.reduce((sum, item) => {
        const amountString = item['المبلغ (د.ع.)'] ? item['المبلغ (د.ع.)'].replace(' د.ع.', '').replace(/,/g, '') : '0';
        return sum + parseFloat(convertArabicToEnglish(amountString) || 0);
    }, 0);

    const headers = reportData.length > 0 ? Object.keys(reportData[0]) : [];

    return (
        <Modal title={`معاينة تقرير ${title}`} onClose={onClose} size="xl" isPrintModal={true}>
            <div className="space-y-4 print:hidden">
                <div className="flex justify-center">
                    <ActionButton onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700">
                        <Printer className="w-5 h-5 ml-2" />
                        طباعة التقرير (A4 أفقي)
                    </ActionButton>
                </div>
            </div>
            
            {/* تم نقل المحتوى ليتم عرضه مباشرة في المودال وليس فقط للطباعة */}
            <div id="print-report-content" className="p-0 max-w-full mx-auto" style={{ fontSize: '10pt', fontFamily: 'sans-serif' }}>
                
                {/* تم تعديل الـ CSS ليتناسب مع العرض داخل المودال */}
                <style>{`
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 6px; font-size: 10pt; }
                    .report-table th { background-color: #f2f2f2; }
                `}</style>
                
                <div className="report-header text-center mb-5">
                    {companyLogoUrl && <img src={companyLogoUrl} alt="Logo" style={{ maxHeight: '60px', margin: '0 auto 10px' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                    <h1 className="text-2xl font-bold">{companyName}</h1>
                    <h2 className="text-xl font-semibold mt-1">تقرير {title} المفصل</h2>
                    <p className="text-sm">تاريخ التقرير: {formatDate(new Date())}</p>
                </div>

                <div className="mb-4">
                    <p className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">إجمالي المبلغ في التقرير: {formatCurrency(totalAmount)}</p>
                    <p className="text-sm">عدد السجلات: {reportData.length}</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="report-table w-full border-collapse">
                        <thead>
                            <tr>
                                {headers.map((header, index) => (
                                    <th key={index} className="text-right" style={{ width: header.includes('الوصف') ? '20%' : 'auto' }}>{header}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((row, rowIndex) => (
                                <tr key={rowIndex}>
                                    {headers.map((header, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 text-right whitespace-normal" style={{ fontSize: '9pt' }}>
                                            {row[header]}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <p className="text-center text-xs mt-10">--- نهاية التقرير ---</p>
            </div>
        </Modal>
    );
});

/**
 * 3.1. Dashboard Component
 */
const DashboardComponent = React.memo(({ data, upcomingBirthdays }) => {
    const { revenues, expenses, suspended, advances, employees } = data;

    // استخدام useMemo لضمان عدم إعادة الحساب إلا عند الضرورة
    const summaryData = useMemo(() => {
        const totalRevenues = revenues.reduce((sum, item) => sum + item.amount, 0);
        const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
        const totalAdvances = advances.reduce((sum, item) => sum + item.amount, 0);
        const totalSuspended = suspended.reduce((sum, item) => sum + item.amount, 0);
        const totalSalaries = employees.reduce((sum, emp) => sum + parseFloat(emp.salary || 0), 0);
        
        // حساب الصندوق: الإيرادات - (المصروفات + السلف + المعلقة)
        const totalCashFund = totalRevenues - (totalExpenses + totalAdvances + totalSuspended);

        // تجميع الإيرادات حسب الفئة
        const revenueByCategory = revenues.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});
        
        // تجميع الصرفيات حسب الفئة
        const expenseByCategory = expenses.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + item.amount;
            return acc;
        }, {});


        return {
            totalRevenues,
            totalExpenses,
            totalAdvances,
            totalSuspended,
            totalSalaries,
            totalCashFund,
            revenueByCategory,
            expenseByCategory
        };
    }, [revenues, expenses, suspended, advances, employees]);

    const primaryCards = [
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
    ];
    
    const secondaryCards = [
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
    ];


    return (
        <div className="space-y-8 p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent border-b-2 border-blue-500 dark:border-blue-400 pb-3">الرئيسية</h2>

            {upcomingBirthdays.length > 0 && (
                <div className="bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-950/50 dark:to-rose-950/50 border-l-4 border-pink-500 dark:border-pink-400 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold text-pink-800 dark:text-pink-200 flex items-center mb-2">
                        <Gift className="w-6 h-6 ml-2" />
                        تذكير أعياد الميلاد القادمة!
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {upcomingBirthdays.map((b, index) => (
                            <li key={index} className="font-semibold">
                                الموظف **{b.name}** عيد ميلاده في **{b.date}**.
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-gradient-to-r from-blue-500 to-purple-500 pb-2">الملخص المالي الرئيسي</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {primaryCards.map((card, index) => (
                    <div key={index} className={`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border dark:border-gray-200/10 ${card.bg}`}>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">{card.title}</p>
                                <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
                            </div>
                            <div className={`p-4 rounded-2xl shadow-lg ${card.iconBg}`}>
                                <card.icon className={`w-8 h-8 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {secondaryCards.map((card, index) => (
                    <div key={index} className={`p-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] border dark:border-gray-200/10 ${card.bg}`}>
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-lg font-semibold text-gray-600 dark:text-gray-400">{card.title}</p>
                                <p className={`text-3xl font-extrabold ${card.color}`}>{card.value}</p>
                            </div>
                            <div className={`p-4 rounded-2xl shadow-lg ${card.iconBg}`}>
                                <card.icon className={`w-8 h-8 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600 pb-2 pt-4">إحصائيات حسب الفئة</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* كروت الإيرادات حسب الفئة */}
                <div className="p-6 rounded-2xl shadow-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-900/50 border-l-4 border-emerald-500 dark:border-emerald-400">
                    <h4 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 ml-2" />
                        إجمالي الإيرادات لكل فئة
                    </h4>
                    <ul className="space-y-2">
                        {Object.keys(summaryData.revenueByCategory).map(category => (
                            <li key={category} className="flex justify-between items-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{category}</span>
                                <span className="font-bold text-green-600 dark:text-green-400">{formatCurrencyDisplay(summaryData.revenueByCategory[category])}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* كروت الصرفيات حسب الفئة */}
                <div className="p-6 rounded-2xl shadow-xl bg-gradient-to-br from-rose-50 to-red-100 dark:from-rose-950/50 dark:to-red-900/50 border-l-4 border-rose-500 dark:border-rose-400">
                    <h4 className="text-xl font-bold text-rose-700 dark:text-rose-300 mb-4 flex items-center">
                        <TrendingDown className="w-5 h-5 ml-2" />
                        إجمالي الصرفيات لكل فئة
                    </h4>
                    <ul className="space-y-2">
                        {Object.keys(summaryData.expenseByCategory).map(category => (
                            <li key={category} className="flex justify-between items-center p-3 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 backdrop-blur-sm">
                                <span className="text-gray-700 dark:text-gray-300 font-medium">{category}</span>
                                <span className="font-bold text-red-600 dark:text-red-400">{formatCurrencyDisplay(summaryData.expenseByCategory[category])}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
});


/**
 * 3.2. DataPage Component (لإدارة الإيرادات، الصرفيات، السلف، المعلقة)
 */
const DataPageComponent = React.memo(({ 
    type, title, collectionName, fields, categories, data, 
    handleDataAction, handleDelete, setPrintItem, setPrintReportData, 
    setIsReportModalOpen, showToast, initialExpenseState, handleRefresh // <--- Added handleRefresh
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    
    const initialRange = useMemo(() => getCurrentMonthRange(), []);
    const [filterDateFrom, setFilterDateFrom] = useState(initialRange.start);
    const [filterDateTo, setFilterDateTo] = useState(initialRange.end);
    const [filterCategory, setFilterCategory] = useState('الكل');
    const [globalSearch, setGlobalSearch] = useState('');
    
    // دالة تهيئة النماذج لتبسيط useEffect
    const getInitialFormState = useCallback((item = null, initialDispatch = null) => {
        const defaultForm = fields.reduce((acc, field) => ({ ...acc, [field.key]: field.defaultValue || '' }), {});
        
        let baseState = item ? item : {
            ...defaultForm,
            date: getDefaultDateTime(),
            employeeId: collectionName === 'advances' ? data.employees[0]?.id || '' : ''
        };

        if (initialDispatch && collectionName === 'expenses' && !item) {
            baseState = {
                ...baseState,
                amount: initialDispatch.amount.toString(),
                category: initialDispatch.category, 
                description: initialDispatch.description,
                vendor: initialDispatch.vendor,
                representative: initialDispatch.representative,
                invoiceImageUrl: initialDispatch.invoiceImageUrl,
                inventoryItems: initialDispatch.inventoryItems, 
            };
        }

        return baseState;
    }, [fields, collectionName, data.employees]);

    const [formState, setFormState] = useState(() => getInitialFormState(currentItem, initialExpenseState));
    const [selectedVendor, setSelectedVendor] = useState(collectionName === 'expenses' && formState.vendor ? formState.vendor : '');

    // إعادة تهيئة FormState عند تغيير currentItem أو initialExpenseState
    useEffect(() => {
        setFormState(getInitialFormState(currentItem, initialExpenseState));
        if (collectionName === 'expenses') {
            setSelectedVendor(currentItem?.vendor || initialExpenseState?.vendor || '');
        }
    }, [currentItem, initialExpenseState, getInitialFormState, collectionName]);

    // 2. Auto-open modal only for dispatched expenses
    useEffect(() => {
        if (initialExpenseState && collectionName === 'expenses' && !currentItem) {
             // تأخير طفيف لضمان تحديث حالة formState
             setTimeout(() => openModal(null), 50); 
        }
    }, [initialExpenseState]); // Added initialExpenseState to dependency array
    
    // **جديد:** كروت الفئات
    const categoryTotals = useMemo(() => {
        const totals = data[collectionName].reduce((acc, item) => {
            const category = item.category || 'غير مصنف';
            acc[category] = (acc[category] || 0) + item.amount;
            return acc;
        }, {});
        // تحويل الكائن إلى مصفوفة لسهولة العرض
        return Object.keys(totals).map(category => ({
            category,
            total: totals[category],
            // تحديد اللون بناءً على نوع الصفحة
            color: type === 'revenue' ? 'green' : 'red'
        }));
    }, [data, collectionName, type]);
    
    const [activeCategories, setActiveCategories] = useState([]);
    
    const handleCategoryCardClick = (category) => {
        setActiveCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    };
    
    // دالة مساعدة لتحديد حالة الفلتر النشطة
    const isFilterActive = (category) => {
        return activeCategories.includes(category);
    };


    // فلترة البيانات
    const filteredList = useMemo(() => {
        let list = data[collectionName].slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (collectionName !== 'suspended') {
            if (filterDateFrom) list = list.filter(item => item.date.slice(0, 10) >= filterDateFrom);
            if (filterDateTo) list = list.filter(item => item.date.slice(0, 10) <= filterDateTo);
            
            // فلترة القوائم حسب الفئة المحددة (إذا لم يتم استخدام كروت الفلترة)
            if (activeCategories.length > 0) {
                 list = list.filter(item => activeCategories.includes(item.category || 'غير مصنف'));
            } else if (filterCategory && filterCategory !== 'الكل') {
                list = list.filter(item => item.category === filterCategory);
            }
        }
        
        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch); 
            const searchNumeric = normalizeTextForSearch(globalSearch, true); 
            
            list = list.filter(item => {
                // البحث النصي
                const matchesInvoice = item.invoiceNumber && normalizeTextForSearch(item.invoiceNumber).includes(searchLower);
                const matchesCategory = item.category && normalizeTextForSearch(item.category).includes(searchLower);
                const matchesDescription = item.description && normalizeTextForSearch(item.description).includes(searchLower);
                const matchesNotes = item.notes && normalizeTextForSearch(item.notes).includes(searchLower);
                const matchesRecipient = item.recipientName && normalizeTextForSearch(item.recipientName).includes(searchLower);
                const matchesVendor = item.vendor && normalizeTextForSearch(item.vendor).includes(searchLower);
                const matchesRep = item.representative && normalizeTextForSearch(item.representative).includes(searchLower);
                const matchesEmployee = item.employeeId && data.employees.find(e => e.id === item.employeeId)?.name && normalizeTextForSearch(data.employees.find(e => e.id === item.employeeId).name).includes(searchLower);
                
                // البحث الرقمي (للمبالغ)
                const matchesAmount = item.amount && normalizeTextForSearch(item.amount.toString(), true).includes(searchNumeric);


                return matchesInvoice || matchesCategory || matchesDescription || matchesRecipient || matchesAmount || matchesVendor || matchesRep || matchesNotes || matchesEmployee;
            });
        }
        return list;
    }, [data, collectionName, filterDateFrom, filterDateTo, filterCategory, globalSearch, activeCategories]);

    const totalFilteredAmount = useMemo(() => {
        return filteredList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    }, [filteredList]);


    const handleSubmit = (e) => {
        e.preventDefault();
        
        let itemToSave = collectionName === 'expenses' ? {
            ...formState,
            vendor: selectedVendor,
            // Pass inventory items only if present (i.e., this came from dispatch flow)
            inventoryItems: formState.inventoryItems || [],
        } : formState;
        
        // تحقق إضافي لحقول المصروفات
        if (collectionName === 'expenses' && (!itemToSave.vendor || !itemToSave.representative)) {
            showToast('يجب اختيار المورد والمندوب للمصروف.', 'error');
            return;
        }

        handleDataAction(collectionName, itemToSave, !currentItem);
        setIsModalOpen(false);
        setCurrentItem(null);
    };

    const openModal = (item = null) => {
        setCurrentItem(item); // Triggers re-run of useEffect above to set formState
        setIsModalOpen(true);
    };
    
    const handlePrint = (item) => {
        setPrintItem({ 
            ...item, 
            collectionName, 
            employeeName: item.employeeId ? data.employees.find(e => e.id === item.employeeId)?.name : null
        });
    };
    
    const handlePrintAll = () => {
        if (filteredList.length === 0) {
             showToast('لا توجد بيانات لطباعة التقرير.', "error");
             return;
        }
        const exportContent = filteredList.map(item => {
            const baseItem = {
                'التاريخ والوقت': new Date(item.date).toLocaleString('en-US'),
                'رقم الفاتورة': item.invoiceNumber || 'N/A',
                'المبلغ (د.ع.)': formatCurrencyDisplay(item.amount || 0),
                'الجهة المعنية': item.category || (item.employeeId ? data.employees.find(e => e.id === item.employeeId)?.name : item.recipientName) || 'N/A',
                'الوصف/ملاحظات': item.description || item.notes || 'N/A',
            };
            if (collectionName === 'expenses') {
                return {
                    ...baseItem,
                    'المورد والمندوب': `${item.vendor || 'N/A'} (${item.representative || 'N/A'})`,
                };
            }
            return baseItem;
        });
        
        setPrintReportData(exportContent);
        setIsReportModalOpen(true);
    };

    const handleExportAll = () => {
        if (filteredList.length === 0) {
             showToast('لا توجد بيانات للتصدير.', "error");
             return;
        }
        
        const exportContent = filteredList.map(item => {
            const baseItem = {
                'التاريخ والوقت': new Date(item.date).toLocaleString('en-US'),
                'رقم الفاتورة': item.invoiceNumber || 'N/A',
                'المبلغ (د.ع.)': parseFloat(item.amount || 0), // يتم التصدير كرقم ليسهل الحساب
                'الجهة المعنية': item.category || (item.employeeId ? data.employees.find(e => e.id === item.employeeId)?.name : item.recipientName) || 'N/A',
                'الوصف/ملاحظات': item.description || item.notes || 'N/A',
            };

            if (collectionName === 'expenses') {
                return {
                    ...baseItem,
                    'المورد': item.vendor || 'N/A',
                    'المندوب': item.representative || 'N/A',
                };
            } else {
                 return baseItem;
            }
        });

        exportToCsv(exportContent, `${title}_تقرير`);
        showToast('تم تصدير البيانات إلى Excel بنجاح!', "success");
    };

    const filteredReps = data.settings.representatives.filter(rep => rep.vendor === selectedVendor);


    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl app-main-content">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-teal-500 pb-3">{title}</h2>

            <div className="flex justify-between items-center">
                 <ActionButton onClick={() => openModal()} className="bg-green-600 hover:bg-green-700" disabled={!!initialExpenseState && collectionName === 'expenses' && isModalOpen}>
                    <Plus className="w-5 h-5 ml-2" />
                    {type === 'suspended' ? 'إضافة مبلغ معلق' : type === 'revenue' ? 'إضافة إيراد' : type === 'expense' ? 'إضافة مصروف' : 'إضافة سلفة'}
                    {!!initialExpenseState && collectionName === 'expenses' && ' (معلومات من المخزن)'}
                </ActionButton>
                
                <button onClick={handleRefresh} className="p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-gray-200 shadow-lg transition duration-200">
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>
            
            {/* **جديد:** كروت الفئات (Multiple Select) */}
            {categoryTotals.length > 0 && (
                <div className="p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700">
                    <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                        <Filter className="w-5 h-5 ml-2" />
                        فلترة حسب فئة {type === 'revenue' ? 'الإيراد' : 'الصرف'}
                    </h3>
                    <div className="flex flex-wrap gap-3">
                        {categoryTotals.map(cat => {
                            const customColor = CUSTOM_CATEGORY_COLORS[cat.category] || (cat.color === 'green' ? { bg: 'bg-green-50 dark:bg-green-900', text: 'text-green-800', border: 'border-green-500' } : { bg: 'bg-red-50 dark:bg-red-900', text: 'text-red-800', border: 'border-red-500' });
                            return (
                                <div 
                                    key={cat.category}
                                    onClick={() => handleCategoryCardClick(cat.category)}
                                    className={`p-3 rounded-xl shadow-md border-t-4 cursor-pointer transition transform hover:scale-[1.03] min-w-[120px] text-center
                                        ${isFilterActive(cat.category) 
                                            ? `${customColor.bg.replace('-50', '-200').replace('-100', '-200')} ${customColor.border.replace('border-', 'ring-4 ring-opacity-60 ring-')} ${customColor.text.replace('-800', '-900')}`
                                            : `${customColor.bg} ${customColor.text} ${customColor.border}`
                                        }
                                    `}
                                    style={{ 
                                        '--ring-current': customColor.border.replace('border-', '') // لتحديد لون الـ ring
                                    }}
                                >
                                    <p className="text-sm font-semibold">{cat.category}</p>
                                    <p className="text-xl font-extrabold">{formatCurrencyDisplay(cat.total)}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}


            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg border border-teal-100 dark:border-teal-700">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                    <div className="col-span-1 text-xl font-bold p-4 rounded-xl bg-teal-50 text-teal-800 flex flex-col items-center justify-center shadow-md border-t-4 border-teal-600">
                        <Calculator className="w-6 h-6 mb-1" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">المجموع المفلتر:</span>
                        <span className="font-extrabold text-2xl mt-1">
                            {formatCurrencyDisplay(totalFilteredAmount)}
                        </span>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 shadow-inner">
                        <h3 className="md:col-span-3 w-full text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center border-b pb-2 mb-2"><Filter className="w-5 h-5 ml-2" /> فلاتر الجدول</h3>
                        
                        {(type === 'expense' || type === 'suspended' || type === 'revenue' || type === 'advance') && (
                            <div className="md:col-span-3 flex flex-col space-y-1 relative">
                                <label className="text-sm font-medium text-gray-600 dark:text-gray-400">البحث الشامل</label>
                                <input
                                    type="text"
                                    value={globalSearch}
                                    onChange={(e) => setGlobalSearch(e.target.value)}
                                    placeholder="اكتب كلمة أو مبلغ للبحث السلس..."
                                    className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-amber-500 focus:border-amber-500"
                                />
                                <Search className="w-5 h-5 absolute right-3 top-1/2 transform translate-y-1/2 text-gray-400 mt-2" />
                            </div>
                        )}

                        {collectionName !== 'suspended' && (
                            <>
                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">التاريخ من</label>
                                    <input
                                        type="date"
                                        value={filterDateFrom}
                                        onChange={(e) => setFilterDateFrom(e.target.value)}
                                        className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>

                                <div className="flex flex-col space-y-1">
                                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">التاريخ إلى</label>
                                    <input
                                        type="date"
                                        value={filterDateTo}
                                        onChange={(e) => setFilterDateTo(e.target.value)}
                                        className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>

                                {/* تم إخفاء قائمة الفئة التقليدية لتشجيع استخدام الكروت */
                                 categories && categories.length > 0 && collectionName !== 'advances' && (
                                    <div className="flex flex-col space-y-1 hidden"> 
                                        <label className="text-sm font-medium text-gray-600 dark:text-gray-400">الفئة</label>
                                        <select
                                            value={filterCategory}
                                            onChange={(e) => setFilterCategory(e.target.value)}
                                            className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500"
                                        >
                                            <option value="الكل">الكل</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
            
             <div className="flex space-x-2 space-x-reverse">
                 <button onClick={handlePrintAll} className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                     <Printer className="w-6 h-6" />
                 </button>
                 <button onClick={handleExportAll} className="p-3 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition duration-200">
                     <Download className="w-6 h-6" />
                 </button>
             </div>


            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 rounded-t-xl">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">التاريخ والوقت</th>
                            {fields.map(field => (
                                <th key={field.key} className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{field.label}</th>
                            ))}
                            {collectionName === 'expenses' && <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">المورد والمندوب</th>}
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">رقم الفاتورة</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredList.length === 0 ? (
                            <tr><td colSpan={fields.length + (collectionName === 'expenses' ? 4 : 3)} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا توجد سجلات متاحة تتوافق مع الفلاتر.</td></tr>
                        ) : (
                            filteredList.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{new Date(item.date).toLocaleString('en-US')}</td>
                                    {fields.map(field => {
                                        const itemValue = item[field.key] || '';

                                        if (field.key === 'employeeName' && item.employeeId) {
                                            const employee = data.employees.find(e => e.id === item.employeeId);
                                            return (
                                                <td key={field.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                    {highlightText(employee?.name || 'موظف محذوف', globalSearch)}
                                                </td>
                                            );
                                        }
                                        
                                        if (field.key === 'amount') {
                                            return (
                                                <td key={field.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                    <span className="font-semibold text-gray-700 dark:text-gray-300">{highlightText(formatCurrencyDisplay(itemValue), globalSearch)}</span>
                                                </td>
                                            );
                                        }

                                        return (
                                            <td key={field.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                                {highlightText(itemValue, globalSearch)}
                                            </td>
                                        );
                                    })}
                                    
                                    {collectionName === 'expenses' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {item.vendor && <span className="font-semibold">{highlightText(item.vendor, globalSearch)}</span>}
                                            {item.vendor && item.representative && <span className="text-gray-400 dark:text-gray-500"> (</span>}
                                            {item.representative && <span className="text-sm italic">{highlightText(item.representative, globalSearch)}</span>}
                                            {item.vendor && item.representative && <span className="text-gray-400 dark:text-gray-500">)</span>}
                                            {!item.vendor && <span className="text-gray-400 dark:text-gray-500">N/A</span>}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">{highlightText(item.invoiceNumber || 'N/A', globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3 space-x-reverse">
                                            {(type === 'expense' || type === 'advance') && (
                                                <button onClick={() => handlePrint(item)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100">
                                                    <Printer className="w-5 h-5" />
                                                </button>
                                            )}
                                            <button onClick={() => openModal(item)} className="text-indigo-600 hover:text-indigo-900">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete(collectionName, item.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={currentItem ? 'تعديل السجل' : 'إضافة سجل جديد'} onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField
                            label="تاريخ ووقت العملية"
                            type="datetime-local"
                            value={formState.date || getDefaultDateTime()}
                            onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                            required
                            readOnly={!!initialExpenseState && collectionName === 'expenses' && !currentItem}
                        />
                        
                        {collectionName === 'expenses' && (
                            <>
                                <div className="flex flex-col space-y-1 text-right">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">الشركة الموردة</label>
                                    <select
                                        value={selectedVendor}
                                        onChange={(e) => {
                                            const newVendor = e.target.value;
                                            setSelectedVendor(newVendor);
                                            // إعادة تعيين المندوب عند تغيير الشركة
                                            const defaultRep = data.settings.representatives.find(r => r.vendor === newVendor)?.name || '';
                                            setFormState(prev => ({ ...prev, representative: defaultRep })); 
                                        }}
                                        required
                                        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right ${!!initialExpenseState && !currentItem ? 'bg-gray-100 dark:bg-gray-600' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                        disabled={!!initialExpenseState && !currentItem}
                                    >
                                        <option value="" disabled>-- اختر الشركة --</option>
                                        {data.settings.vendors.map(vendor => (
                                            <option key={vendor} value={vendor}>{vendor}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex flex-col space-y-1 text-right">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">المندوب المسؤول</label>
                                    <select
                                        value={formState.representative || ''}
                                        onChange={(e) => setFormState({ ...formState, representative: e.target.value })}
                                        required
                                        disabled={!selectedVendor || (!!initialExpenseState && !currentItem)}
                                        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right ${!!initialExpenseState && !currentItem ? 'bg-gray-100 dark:bg-gray-600' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                    >
                                        <option value="" disabled>-- اختر المندوب --</option>
                                        {filteredReps.map(rep => (
                                            <option key={rep.name} value={rep.name}>{rep.name}</option>
                                        ))}
                                    </select>
                                    {!selectedVendor && <p className="text-xs text-red-500 mt-1">يجب اختيار الشركة أولاً.</p>}
                                </div>
                            </>
                        )}
                        
                        {fields.map(field => {
                            const isAutoFilled = collectionName === 'expenses' && initialExpenseState && !currentItem &&
                                (field.key === 'amount' || field.key === 'description' || field.key === 'category');
                            
                            // Check if field is category selection for expense/revenue
                            if (field.type === 'select' && categories && field.key !== 'employeeName') {
                                return (
                                    <div key={field.key} className="flex flex-col space-y-1 text-right">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">{field.label}</label>
                                        <select
                                            value={formState[field.key] || ''}
                                            onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                                            required={field.required}
                                            onInvalid={(e) => e.target.setCustomValidity(field.required ? 'هذا الحقل إجباري، يرجى اختياره.' : '')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right ${isAutoFilled ? 'bg-gray-100 dark:bg-gray-600' : 'focus:ring-teal-500 focus:border-teal-500'}`}
                                            disabled={isAutoFilled}
                                        >
                                            <option value="" disabled>اختر فئة</option>
                                            {categories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            }
                            if (field.key === 'employeeName') {
                                return (
                                    <div key={field.key} className="flex flex-col space-y-1 text-right">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">{field.label}</label>
                                        <select
                                            value={formState.employeeId || ''} 
                                            onChange={(e) => {
                                                setFormState({
                                                    ...formState,
                                                    employeeId: e.target.value,
                                                });
                                            }}
                                            required
                                            onInvalid={(e) => e.target.setCustomValidity('هذا الحقل إجباري، يرجى اختيار موظف.')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                                        >
                                            <option value="" disabled>اختر الموظف</option>
                                            {data.employees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            }

                            return (
                                <InputField
                                    key={field.key}
                                    label={field.label}
                                    type={field.type}
                                    value={formState[field.key] || ''}
                                    onChange={(e) => {
                                        let newValue = e.target.value;
                                        // Auto-conversion for number/currency fields
                                        if (field.currency || field.type === 'number') {
                                            newValue = convertArabicToEnglish(newValue);
                                            newValue = newValue.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                        }
                                        setFormState({ ...formState, [field.key]: newValue });
                                    }}
                                    required={field.required || (type === 'expense' && field.key === 'description')}
                                    currency={field.currency}
                                    textarea={field.type === 'textarea'}
                                    readOnly={isAutoFilled}
                                />
                            );
                        })}
                        
                        {initialExpenseState && collectionName === 'expenses' && !currentItem && (
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900 border border-indigo-200 rounded-xl text-indigo-800 font-semibold text-center">
                                تم تعبئة جميع الحقول تلقائياً من فاتورة الإدخال. يرجى الضغط على **إضافة** للتأكيد وإتمام الصرف.
                            </div>
                        )}

                        <ActionButton type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                            <Save className="w-5 h-5 ml-2" />
                            {currentItem ? 'حفظ التعديلات' : 'إضافة'}
                        </ActionButton>
                    </form>
                </Modal>
            )}
        </div>
    );
});


/**
 * 3.3. EmployeePage Component
 */
const EmployeePageComponent = React.memo(({ data, handleDataAction, handleDelete, setPrintReportData, setIsReportModalOpen, showToast, handleRefresh }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formState, setFormState] = useState({});
    const [globalSearch, setGlobalSearch] = useState(''); 

    
    const formatDOB = (dateString) => {
        if (!dateString) return 'غير محدد';
        return new Date(dateString).toLocaleDateString('ar-IQ');
    };

    const filteredList = useMemo(() => {
        let list = data.employees.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        
        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch); 
            const searchNumeric = normalizeTextForSearch(globalSearch, true); 
            
            list = list.filter(item => {
                const matchesName = item.name && normalizeTextForSearch(item.name).includes(searchLower);
                const matchesSalary = item.salary && normalizeTextForSearch(item.salary.toString(), true).includes(searchNumeric);
                const matchesDept = item.department && normalizeTextForSearch(item.department).includes(searchLower);
                const matchesJob = item.jobTitle && normalizeTextForSearch(item.jobTitle).includes(searchLower);
                
                return matchesName || matchesSalary || matchesDept || matchesJob;
            });
        }
        return list;
    }, [data.employees, globalSearch]);

    useEffect(() => {
        if (currentEmployee) {
            setFormState(currentEmployee);
        } else {
            setFormState({ 
                name: '', phone: '', salary: '', 
                department: data.settings.departments[0] || '', 
                jobTitle: data.settings.jobTitles[0] || '', 
                docUrl: '', dateOfBirth: '', id: null 
            });
        }
    }, [currentEmployee, data.settings.departments, data.settings.jobTitles]);

    const openModal = (employee = null) => {
        setCurrentEmployee(employee);
        setIsModalOpen(true);
    };

    const openDetailsModal = (employee) => {
        setCurrentEmployee(employee);
        setIsDetailsModalOpen(true);
        setFormState(employee); 
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        const processedSalary = convertArabicToEnglish(formState.salary);
        
        handleDataAction('employees', { 
            ...formState, 
            salary: parseFloat(processedSalary || 0),
        }, !currentEmployee);
        setIsModalOpen(false);
        setCurrentEmployee(null); 
    };

    const handlePrintAll = () => {
             if (filteredList.length === 0) {
                 showToast('لا توجد بيانات لطباعة التقرير.', "error");
                 return;
             }
            
        const reportContent = filteredList.map(item => ({
            'الاسم': item.name,
            'تاريخ الميلاد': formatDOB(item.dateOfBirth),
            'القسم': item.department,
            'المنصب': item.jobTitle,
            'الراتب الأساسي (د.ع.)': formatCurrencyDisplay(item.salary),
            'رقم الهاتف': item.phone || 'N/A',
        }));
        
        setPrintReportData(reportContent);
        setIsReportModalOpen(true);
    };
    
    const handleExportAll = () => {
        if (filteredList.length === 0) {
             showToast('لا توجد بيانات للتصدير.', "error");
             return;
           }
            
        const exportContent = filteredList.map(item => ({
            'الاسم': item.name,
            'تاريخ الميلاد': formatDOB(item.dateOfBirth),
            'القسم': item.department,
            'المنصب': item.jobTitle,
            'الراتب': parseFloat(item.salary || 0),
            'رقم الهاتف': item.phone || 'N/A',
            'رابط المستندات': item.docUrl || 'N/A',
        }));

        exportToCsv(exportContent, `تقرير_الموظفين`);
        showToast('تم تصدير البيانات إلى Excel بنجاح!', "success");
    };


    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-teal-500 pb-3">إدارة الموظفين </h2>
            
            <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-lg border border-teal-100 dark:border-teal-700 relative">
                 <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">البحث الشامل</label>
                <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="ابحث بالاسم، المنصب، الراتب..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-amber-500 focus:border-amber-500"
                />
                <Search className="w-5 h-5 absolute right-3 top-1/2 transform translate-y-1/2 text-gray-400 mt-2" />
            </div>


            <div className="flex justify-between items-center">
                <ActionButton onClick={() => openModal()} className="bg-green-600 hover:bg-green-700">
                    <UserPlus className="w-5 h-5 ml-2" />
                    إضافة موظف جديد
                </ActionButton>
                   <div className="flex space-x-2 space-x-reverse">
                       <button onClick={handlePrintAll} className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                           <Printer className="w-6 h-6" />
                       </button>
                       <button onClick={handleExportAll} className="p-3 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition duration-200">
                           <Download className="w-6 h-6" />
                       </button>
                       <button onClick={handleRefresh} className="p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-gray-200 shadow-lg transition duration-200">
                            <RotateCcw className="w-6 h-6" />
                        </button>
                   </div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">اسم الموظف</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">تاريخ الميلاد</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">القسم</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">الراتب الأساسي (د.ع.)</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredList.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا يوجد موظفين مسجلين.</td></tr>
                        ) : (
                            filteredList.map(emp => (
                                <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 cursor-pointer" onClick={() => openDetailsModal(emp)}>{highlightText(emp.name, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{highlightText(formatDOB(emp.dateOfBirth), globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{highlightText(emp.department, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{highlightText(formatCurrencyDisplay(emp.salary), globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3 space-x-reverse">
                                            <button onClick={() => openModal(emp)} className="text-indigo-600 hover:text-indigo-900">
                                                <Edit className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleDelete('employees', emp.id)} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <Modal title={currentEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف'} onClose={() => setIsModalOpen(false)}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField label="اسم الموظف" value={formState.name || ''} onChange={(e) => setFormState({ ...formState, name: e.target.value })} required />
                        
                        <InputField 
                            label="تاريخ الميلاد" 
                            type="date" 
                            value={formState.dateOfBirth || ''} 
                            onChange={(e) => setFormState({ ...formState, dateOfBirth: e.target.value })} 
                            required
                        />
                        
                        <div className="flex flex-col space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">القسم</label>
                            <select
                                value={formState.department || ''}
                                onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                                required
                                onInvalid={(e) => e.target.setCustomValidity('هذا الحقل إجباري، يرجى اختياره.')}
                                onInput={(e) => e.target.setCustomValidity('')}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                            >
                                <option value="" disabled>اختر قسم</option>
                                {data.settings.departments.map(dept => (
                                    <option key={dept} value={dept}>{dept}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex flex-col space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">المنصب/العمل</label>
                            <select
                                value={formState.jobTitle || ''}
                                onChange={(e) => setFormState({ ...formState, jobTitle: e.target.value })}
                                required
                                onInvalid={(e) => e.target.setCustomValidity('هذا الحقل إجباري، يرجى اختياره.')}
                                onInput={(e) => e.target.setCustomValidity('')}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                            >
                                <option value="" disabled>اختر منصب</option>
                                {data.settings.jobTitles.map(title => (
                                    <option key={title} value={title}>{title}</option>
                                ))}
                            </select>
                        </div>

                        <InputField label="رقم الهاتف" type="tel" value={formState.phone || ''} onChange={(e) => setFormState({ ...formState, phone: e.target.value })} />
                        
                        <InputField 
                            label="الراتب الشهري" 
                            type="number" 
                            value={formState.salary || ''} 
                            onChange={(e) => {
                                const newValue = convertArabicToEnglish(e.target.value);
                                setFormState({ ...formState, salary: newValue });
                            }} 
                            required 
                            currency 
                        />
                        
                        <InputField 
                            label="رابط المستندات الشخصية (صورة/PDF)" 
                            type="url" 
                            placeholder="http://example.com/file.pdf"
                            value={formState.docUrl || ''} 
                            onChange={(e) => setFormState({ ...formState, docUrl: e.target.value })} 
                        />
                        
                        <ActionButton type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                            <Save className="w-5 h-5 ml-2" />
                            {currentEmployee ? 'حفظ التعديلات' : 'إضافة موظف'}
                        </ActionButton>
                    </form>
                </Modal>
            )}

            {isDetailsModalOpen && currentEmployee && (
                <Modal title={`تفاصيل الموظف: ${currentEmployee.name}`} onClose={() => setIsDetailsModalOpen(false)} size="sm">
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">معلومات أساسية</h4>
                        <p className="flex items-center text-lg dark:text-gray-200"><CalendarCheck className="w-5 h-5 ml-2 text-indigo-500" /> **تاريخ الميلاد:** {formatDOB(currentEmployee.dateOfBirth)}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><Briefcase className="w-5 h-5 ml-2 text-indigo-500" /> **القسم:** {currentEmployee.department}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><List className="w-5 h-5 ml-2 text-indigo-500" /> **المنصب:** {currentEmployee.jobTitle}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><Phone className="w-5 h-5 ml-2 text-indigo-500" /> **الهاتف:** {currentEmployee.phone || 'غير متوفر'}</p>
                        
                        {currentEmployee.docUrl && (
                            <a href={currentEmployee.docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center p-3 text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition space-x-2 space-x-reverse font-semibold mt-4">
                                <ExternalLink className="w-5 h-5 ml-2" />
                                عرض المستندات الشخصية
                            </a>
                        )}

                        
                    </div>
                </Modal>
            )}
        </div>
    );
});

/**
 * 3.3.5. PayrollPage Component - صفحة الرواتب الكاملة
 */
const PayrollPageComponent = React.memo(({ data, handleDataAction, showToast, handleRefresh }) => {
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [isAddAdjustmentOpen, setIsAddAdjustmentOpen] = useState(false);
    const [adjustmentForm, setAdjustmentForm] = useState({ type: 'bonus', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
    const [globalSearch, setGlobalSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('الكل');

    const monthNames = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

    // دالة حساب راتب الموظف
    const calculateEmployeeSalary = useCallback((employee, month, year) => {
        const baseSalary = parseFloat(employee.salary) || 0;
        
        // التعديلات من payroll
        const payrollRecord = data.payroll.find(p => 
            p.employeeId === employee.id && 
            p.month === month && 
            p.year === year
        );
        
        let bonuses = 0;
        let deductions = 0;
        let absenceAmount = 0;
        let overtimeAmount = 0;
        
        if (payrollRecord && payrollRecord.adjustments) {
            payrollRecord.adjustments.forEach(adj => {
                const amount = parseFloat(adj.amount) || 0;
                if (adj.type === 'bonus') bonuses += amount;
                if (adj.type === 'deduction') deductions += amount;
                if (adj.type === 'absence') absenceAmount += amount;
                if (adj.type === 'overtime') overtimeAmount += amount;
            });
        }
        
        // السلف من data.advances
        const advances = data.advances.filter(adv => {
            const advDate = new Date(adv.date);
            return adv.employeeId === employee.id && 
                   advDate.getMonth() + 1 === month && 
                   advDate.getFullYear() === year;
        }).reduce((sum, adv) => sum + (parseFloat(adv.amount) || 0), 0);
        
        const netSalary = baseSalary + bonuses + overtimeAmount - deductions - absenceAmount - advances;
        
        return {
            baseSalary,
            bonuses,
            deductions,
            absenceAmount,
            overtimeAmount,
            advances,
            netSalary,
            isPaid: payrollRecord?.isPaid || false,
            paidDate: payrollRecord?.paidDate || null
        };
    }, [data.payroll, data.advances]);

    // فلترة الموظفين
    const filteredEmployees = useMemo(() => {
        let list = data.employees.slice();
        
        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch);
            list = list.filter(emp => 
                emp.name && normalizeTextForSearch(emp.name).includes(searchLower)
            );
        }

        if (statusFilter !== 'الكل') {
            list = list.filter(emp => {
                const salaryData = calculateEmployeeSalary(emp, selectedMonth, selectedYear);
                if (statusFilter === 'مدفوعة') return salaryData.isPaid;
                if (statusFilter === 'غير مدفوعة') return !salaryData.isPaid;
                return true;
            });
        }

        return list.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }, [data.employees, globalSearch, statusFilter, selectedMonth, selectedYear, calculateEmployeeSalary]);

    // دالة إضافة تعديل
    const handleAddAdjustment = (e) => {
        e.preventDefault();
        
        if (!currentEmployee) return;

        const newAdjustment = {
            id: Date.now().toString(),
            type: adjustmentForm.type,
            amount: parseFloat(convertArabicToEnglish(adjustmentForm.amount)) || 0,
            description: adjustmentForm.description,
            date: adjustmentForm.date
        };

        let payrollRecord = data.payroll.find(p => 
            p.employeeId === currentEmployee.id && 
            p.month === selectedMonth && 
            p.year === selectedYear
        );

        if (payrollRecord) {
            payrollRecord.adjustments = [...(payrollRecord.adjustments || []), newAdjustment];
            handleDataAction('payroll', payrollRecord, false);
        } else {
            payrollRecord = {
                id: Date.now().toString(),
                employeeId: currentEmployee.id,
                month: selectedMonth,
                year: selectedYear,
                adjustments: [newAdjustment],
                isPaid: false,
                paidDate: null
            };
            handleDataAction('payroll', payrollRecord, true);
        }

        setAdjustmentForm({ type: 'bonus', amount: '', description: '', date: new Date().toISOString().slice(0, 10) });
        setIsAddAdjustmentOpen(false);
        showToast('تم إضافة التعديل بنجاح!', 'success');
    };

    // دالة دفع الراتب
    const handlePaySalary = (employeeId) => {
        const employee = data.employees.find(e => e.id === employeeId);
        if (!employee) return;

        const salaryData = calculateEmployeeSalary(employee, selectedMonth, selectedYear);
        
        if (salaryData.isPaid) {
            showToast('تم دفع هذا الراتب مسبقاً!', 'warning');
            return;
        }

        if (!window.confirm(`هل أنت متأكد من دفع راتب ${employee.name} بمبلغ ${formatCurrencyDisplay(salaryData.netSalary)}؟`)) {
            return;
        }

        let payrollRecord = data.payroll.find(p => 
            p.employeeId === employeeId && 
            p.month === selectedMonth && 
            p.year === selectedYear
        );

        if (payrollRecord) {
            payrollRecord.isPaid = true;
            payrollRecord.paidDate = new Date().toISOString();
            handleDataAction('payroll', payrollRecord, false);
        } else {
            payrollRecord = {
                id: Date.now().toString(),
                employeeId: employeeId,
                month: selectedMonth,
                year: selectedYear,
                adjustments: [],
                isPaid: true,
                paidDate: new Date().toISOString()
            };
            handleDataAction('payroll', payrollRecord, true);
        }

        showToast(`تم دفع راتب ${employee.name} بنجاح!`, 'success');
    };

    // دالة طباعة كشف الراتب
    const handlePrintPayslip = (employee, salaryData) => {
        const printContent = `
            <html dir="rtl">
            <head>
                <style>
                    @page { size: 80mm auto; margin: 5mm; }
                    body { font-family: 'Cairo', Arial; font-size: 12px; text-align: right; }
                    h2 { text-align: center; margin: 10px 0; }
                    table { width: 100%; border-collapse: collapse; }
                    td { padding: 5px; border-bottom: 1px dashed #ccc; }
                    .total { font-weight: bold; font-size: 14px; }
                </style>
            </head>
            <body>
                <h2>${data.settings.companyName}</h2>
                <h3 style="text-align: center;">كشف راتب</h3>
                <p><strong>الموظف:</strong> ${employee.name}</p>
                <p><strong>الشهر:</strong> ${monthNames[selectedMonth - 1]} ${selectedYear}</p>
                <hr/>
                <table>
                    <tr><td>الراتب الأساسي:</td><td>${salaryData.baseSalary.toLocaleString()} د.ع.</td></tr>
                    ${salaryData.bonuses > 0 ? `<tr><td>المكافآت:</td><td>+${salaryData.bonuses.toLocaleString()} د.ع.</td></tr>` : ''}
                    ${salaryData.overtimeAmount > 0 ? `<tr><td>الأوفرتايم:</td><td>+${salaryData.overtimeAmount.toLocaleString()} د.ع.</td></tr>` : ''}
                    ${salaryData.deductions > 0 ? `<tr><td>الخصومات:</td><td>-${salaryData.deductions.toLocaleString()} د.ع.</td></tr>` : ''}
                    ${salaryData.absenceAmount > 0 ? `<tr><td>خصم الغياب:</td><td>-${salaryData.absenceAmount.toLocaleString()} د.ع.</td></tr>` : ''}
                    ${salaryData.advances > 0 ? `<tr><td>السلف:</td><td>-${salaryData.advances.toLocaleString()} د.ع.</td></tr>` : ''}
                    <tr class="total"><td>الراتب الصافي:</td><td>${salaryData.netSalary.toLocaleString()} د.ع.</td></tr>
                </table>
                <p style="text-align: center; margin-top: 20px;">التاريخ: ${new Date().toLocaleDateString('ar-IQ')}</p>
            </body>
            </html>
        `;
        
        const printWindow = window.open('', '', 'width=300');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-purple-500 pb-3">إدارة الرواتب</h2>
            
            {/* اختيار الشهر والسنة */}
            <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-xl shadow-lg border border-purple-200">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">الشهر</label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                            data-testid="select-month"
                        >
                            {monthNames.map((name, index) => (
                                <option key={index + 1} value={index + 1}>{name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">السنة</label>
                        <input
                            type="number"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value) || new Date().getFullYear())}
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                            data-testid="input-year"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={handleRefresh}
                            className="w-full px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition shadow-lg font-semibold"
                            data-testid="button-refresh-payroll"
                        >
                            <RotateCcw className="w-5 h-5 inline ml-2" />
                            تحديث
                        </button>
                    </div>
                </div>
            </div>

            {/* فلتر الحالة */}
            <div className="flex flex-wrap gap-3">
                {['الكل', 'مدفوعة', 'غير مدفوعة'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-6 py-2 rounded-xl font-semibold transition ${
                            statusFilter === status
                                ? 'bg-purple-600 text-white shadow-lg'
                                : 'bg-gray-200 text-gray-700 dark:text-gray-300 hover:bg-gray-300'
                        }`}
                        data-testid={`filter-${status}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* البحث */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-lg border border-purple-100 dark:border-purple-700 relative">
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">البحث عن موظف</label>
                <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="ابحث باسم الموظف..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-purple-500 focus:border-purple-500"
                    data-testid="input-search-payroll"
                />
                <Search className="w-5 h-5 absolute right-3 top-1/2 transform translate-y-1/2 text-gray-400 mt-2" />
            </div>

            {/* جدول الرواتب */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الموظف</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الراتب الأساسي</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">المكافآت</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الخصومات</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الغياب</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الأوفرتايم</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">السلف</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الراتب الصافي</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الحالة</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredEmployees.length === 0 ? (
                            <tr><td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا يوجد موظفين.</td></tr>
                        ) : (
                            filteredEmployees.map(emp => {
                                const salaryData = calculateEmployeeSalary(emp, selectedMonth, selectedYear);
                                return (
                                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                        <td className="px-4 py-4 text-sm font-medium text-blue-600">{highlightText(emp.name, globalSearch)}</td>
                                        <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">{formatCurrencyDisplay(salaryData.baseSalary)}</td>
                                        <td className="px-4 py-4 text-sm text-green-600">+{formatCurrencyDisplay(salaryData.bonuses)}</td>
                                        <td className="px-4 py-4 text-sm text-red-600">-{formatCurrencyDisplay(salaryData.deductions)}</td>
                                        <td className="px-4 py-4 text-sm text-red-600">-{formatCurrencyDisplay(salaryData.absenceAmount)}</td>
                                        <td className="px-4 py-4 text-sm text-green-600">+{formatCurrencyDisplay(salaryData.overtimeAmount)}</td>
                                        <td className="px-4 py-4 text-sm text-red-600">-{formatCurrencyDisplay(salaryData.advances)}</td>
                                        <td className="px-4 py-4 text-sm font-bold text-purple-600">{formatCurrencyDisplay(salaryData.netSalary)}</td>
                                        <td className="px-4 py-4 text-sm">
                                            {salaryData.isPaid ? (
                                                <span className="text-green-600 font-bold" data-testid={`status-paid-${emp.id}`}>✓ مستلم</span>
                                            ) : (
                                                <span className="text-red-600 font-bold" data-testid={`status-unpaid-${emp.id}`}>✗ غير مستلم</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-4 text-sm">
                                            <div className="flex space-x-2 space-x-reverse">
                                                <button
                                                    onClick={() => { setCurrentEmployee(emp); setIsDetailsModalOpen(true); }}
                                                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                    data-testid={`button-details-${emp.id}`}
                                                >
                                                    <Eye className="w-4 h-4 inline" />
                                                </button>
                                                <button
                                                    onClick={() => handlePrintPayslip(emp, salaryData)}
                                                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                    data-testid={`button-print-${emp.id}`}
                                                >
                                                    <Printer className="w-4 h-4 inline" />
                                                </button>
                                                <button
                                                    onClick={() => handlePaySalary(emp.id)}
                                                    disabled={salaryData.isPaid}
                                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                    data-testid={`button-pay-salary-${emp.id}`}
                                                >
                                                    {salaryData.isPaid ? 'تم الدفع ✓' : 'دفع'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* مودال التفاصيل */}
            {isDetailsModalOpen && currentEmployee && (
                <Modal title={`تفاصيل راتب: ${currentEmployee.name}`} onClose={() => setIsDetailsModalOpen(false)} size="xl">
                    <div className="space-y-6">
                        <div className="bg-purple-50 dark:bg-purple-900 p-4 rounded-xl">
                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">الشهر: {monthNames[selectedMonth - 1]} {selectedYear}</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <p><strong>الراتب الأساسي:</strong> {formatCurrencyDisplay(calculateEmployeeSalary(currentEmployee, selectedMonth, selectedYear).baseSalary)}</p>
                                <p><strong>الراتب الصافي:</strong> {formatCurrencyDisplay(calculateEmployeeSalary(currentEmployee, selectedMonth, selectedYear).netSalary)}</p>
                            </div>
                        </div>

                        {/* التعديلات */}
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200">التعديلات</h4>
                                <button
                                    onClick={() => setIsAddAdjustmentOpen(true)}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    data-testid="button-add-adjustment"
                                >
                                    <Plus className="w-4 h-4 inline ml-1" />
                                    إضافة تعديل
                                </button>
                            </div>
                            <div className="space-y-2">
                                {(() => {
                                    const payrollRecord = data.payroll.find(p => 
                                        p.employeeId === currentEmployee.id && 
                                        p.month === selectedMonth && 
                                        p.year === selectedYear
                                    );
                                    const adjustments = payrollRecord?.adjustments || [];
                                    
                                    return adjustments.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد تعديلات</p>
                                    ) : (
                                        adjustments.map(adj => (
                                            <div key={adj.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">
                                                        {adj.type === 'bonus' && '🎁 مكافأة'}
                                                        {adj.type === 'deduction' && '⚠️ خصم'}
                                                        {adj.type === 'absence' && '❌ غياب'}
                                                        {adj.type === 'overtime' && '⏰ أوفرتايم'}
                                                    </p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{adj.description}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(adj.date).toLocaleDateString('ar-IQ')}</p>
                                                </div>
                                                <p className={`font-bold ${adj.type === 'bonus' || adj.type === 'overtime' ? 'text-green-600' : 'text-red-600'}`}>
                                                    {adj.type === 'bonus' || adj.type === 'overtime' ? '+' : '-'}{formatCurrencyDisplay(adj.amount)}
                                                </p>
                                            </div>
                                        ))
                                    );
                                })()}
                            </div>
                        </div>

                        {/* السلف */}
                        <div>
                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-3">السلف المستحقة</h4>
                            <div className="space-y-2">
                                {(() => {
                                    const advances = data.advances.filter(adv => {
                                        const advDate = new Date(adv.date);
                                        return adv.employeeId === currentEmployee.id && 
                                               advDate.getMonth() + 1 === selectedMonth && 
                                               advDate.getFullYear() === selectedYear;
                                    });
                                    
                                    return advances.length === 0 ? (
                                        <p className="text-gray-500 dark:text-gray-400 text-center py-4">لا توجد سلف</p>
                                    ) : (
                                        advances.map(adv => (
                                            <div key={adv.id} className="p-3 bg-gray-50 rounded-lg flex justify-between items-center">
                                                <div>
                                                    <p className="font-semibold">{adv.category}</p>
                                                    <p className="text-sm text-gray-600 dark:text-gray-400">{adv.notes}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{new Date(adv.date).toLocaleDateString('ar-IQ')}</p>
                                                </div>
                                                <p className="font-bold text-red-600">-{formatCurrencyDisplay(adv.amount)}</p>
                                            </div>
                                        ))
                                    );
                                })()}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {/* مودال إضافة تعديل */}
            {isAddAdjustmentOpen && (
                <Modal title="إضافة تعديل" onClose={() => setIsAddAdjustmentOpen(false)}>
                    <form onSubmit={handleAddAdjustment} className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">نوع التعديل</label>
                            <select
                                value={adjustmentForm.type}
                                onChange={(e) => setAdjustmentForm({ ...adjustmentForm, type: e.target.value })}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-purple-500 focus:border-purple-500"
                                data-testid="select-adjustment-type"
                            >
                                <option value="bonus">مكافأة</option>
                                <option value="deduction">خصم</option>
                                <option value="absence">غياب</option>
                                <option value="overtime">أوفرتايم</option>
                            </select>
                        </div>
                        <InputField
                            label="المبلغ"
                            type="number"
                            value={adjustmentForm.amount}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, amount: e.target.value })}
                            required
                            currency
                        />
                        <InputField
                            label="الوصف"
                            type="text"
                            value={adjustmentForm.description}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, description: e.target.value })}
                            required
                        />
                        <InputField
                            label="التاريخ"
                            type="date"
                            value={adjustmentForm.date}
                            onChange={(e) => setAdjustmentForm({ ...adjustmentForm, date: e.target.value })}
                            required
                        />
                        <ActionButton type="submit" className="w-full bg-purple-600 hover:bg-purple-700">
                            <Save className="w-5 h-5 ml-2" />
                            حفظ التعديل
                        </ActionButton>
                    </form>
                </Modal>
            )}
        </div>
    );
});



/**
 * 3.4. InventoryPage Component (عرض المخزون مع إمكانية الإضافة المباشرة)
 */
const InventoryPageComponent = React.memo(({ data, showToast, handleRefresh, handleDataAction }) => {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [globalSearch, setGlobalSearch] = useState('');
    
    // نموذج المادة الجديدة
    const [newItemForm, setNewItemForm] = useState({
        name: '',
        barcode: '',
        price: '',
        count: '',
        category: data.settings.expenseCategories.find(c => c.includes('مواد')) || data.settings.expenseCategories[0] || ''
    });
    
    // دالة إعادة تعيين النموذج
    const resetForm = () => {
        setNewItemForm({
            name: '',
            barcode: '',
            price: '',
            count: '',
            category: data.settings.expenseCategories.find(c => c.includes('مواد')) || data.settings.expenseCategories[0] || ''
        });
    };
    
    // دالة إضافة مادة جديدة
    const handleAddInventoryItem = (e) => {
        e.preventDefault();
        
        if (!newItemForm.name || !newItemForm.price || !newItemForm.count || !newItemForm.category) {
            showToast('الرجاء ملء جميع الحقول المطلوبة.', 'error');
            return;
        }
        
        // التحقق من عدم وجود مادة بنفس الاسم
        const existingItem = data.inventory.find(item => item.name.trim().toLowerCase() === newItemForm.name.trim().toLowerCase());
        if (existingItem) {
            showToast('توجد مادة بهذا الاسم في المخزون بالفعل. يرجى استخدام اسم مختلف أو تحديث المادة الموجودة من خلال فاتورة مشتريات.', 'error');
            return;
        }
        
        const newItem = {
            id: crypto.randomUUID(),
            name: newItemForm.name.trim(),
            barcode: newItemForm.barcode.trim() || generateBarcode(),
            price: parseFloat(newItemForm.price),
            count: parseInt(newItemForm.count),
            category: newItemForm.category,
            purchaseHistory: [], // لا يوجد سجل شراء لأنها مادة يدوية
            invoiceImageUrl: '',
        };
        
        handleDataAction('inventory', newItem, true);
        showToast(`تم إضافة المادة "${newItem.name}" إلى المخزون بنجاح!`, 'success');
        resetForm();
        setIsAddModalOpen(false);
    };

    const filteredList = useMemo(() => {
        let list = data.inventory.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar'));
        
        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch); 
            const searchNumeric = normalizeTextForSearch(globalSearch, true);
            
            list = list.filter(item => {
                const matchesName = item.name && normalizeTextForSearch(item.name).includes(searchLower);
                const matchesBarcode = item.barcode && normalizeTextForSearch(item.barcode).includes(searchLower);
                const matchesCategory = item.category && normalizeTextForSearch(item.category).includes(searchLower);
                const matchesPrice = item.price && normalizeTextForSearch(item.price.toString(), true).includes(searchNumeric);

                
                return matchesName || matchesBarcode || matchesCategory || matchesPrice;
            });
        }
        return list;
    }, [data.inventory, globalSearch]);

    const openDetailsModal = (item) => {
        setCurrentItem(item);
        setIsDetailsModalOpen(true);
    };

    const formatPurchaseHistory = (history) => (
        <div className="space-y-3 max-h-48 overflow-y-auto mt-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
            {history.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 italic">لا يوجد سجل مشتريات لهذه المادة.</p>
            ) : (
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="bg-gray-100 dark:bg-gray-600">
                            <th className="px-2 py-1 text-right font-bold text-gray-700 dark:text-gray-300">تاريخ الشراء</th>
                            <th className="px-2 py-1 text-right font-bold text-gray-700 dark:text-gray-300">السعر</th>
                            <th className="px-2 py-1 text-right font-bold text-gray-700 dark:text-gray-300">الكمية</th>
                            <th className="px-2 py-1 text-right font-bold text-gray-700 dark:text-gray-300">المورد</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.sort((a, b) => new Date(b.date) - new Date(a.date)).map((record, index) => (
                            <tr key={index} className="border-t hover:bg-indigo-50 dark:bg-indigo-900">
                                <td className="px-2 py-1">{new Date(record.date).toLocaleString('en-US', {dateStyle: 'short', timeStyle: 'short'})}</td>
                                <td className="px-2 py-1 font-semibold">{formatCurrencyDisplay(record.price)}</td>
                                <td className="px-2 py-1">{record.count}</td>
                                <td className="px-2 py-1">{record.vendor}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
    
    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-teal-500 pb-3">المخزن (المواد المتوفرة) </h2>

            {/* البحث الشامل */}
            <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-lg border border-teal-100 dark:border-teal-700 relative">
                 <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">البحث الشامل</label>
                <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="ابحث باسم المادة، الباركود، الفئة..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-amber-500 focus:border-amber-500"
                    data-testid="input-inventory-search"
                />
                <Search className="w-5 h-5 absolute right-3 top-1/2 transform translate-y-1/2 text-gray-400 mt-2" />
            </div>
            
            <div className="flex justify-between items-center">
                <ActionButton onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700" data-testid="button-add-inventory-item">
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة مادة جديدة
                </ActionButton>
                
                <button onClick={handleRefresh} className="p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200" data-testid="button-refresh-inventory">
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>
            
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">اسم المادة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الفئة</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الباركود</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">سعر القطعة (د.ع.)</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">العدد في المخزن</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredList.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا توجد مواد مضافة في المخزن.</td></tr>
                        ) : (
                            filteredList.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150" data-testid={`row-inventory-${item.id}`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer" onClick={() => openDetailsModal(item)}>{highlightText(item.name, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{highlightText(item.category, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{highlightText(item.barcode || 'N/A', globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrencyDisplay(item.price)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-bold">{item.count}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-3 space-x-reverse">
                                            <button onClick={() => openDetailsModal(item)} className="text-teal-600 dark:text-teal-400 hover:text-teal-900 dark:hover:text-teal-300" data-testid={`button-details-${item.id}`}>
                                                <List className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            
            {/* Modal إضافة مادة جديدة */}
            {isAddModalOpen && (
                <Modal title="إضافة مادة جديدة للمخزون" onClose={() => { setIsAddModalOpen(false); resetForm(); }} size="lg">
                    <form onSubmit={handleAddInventoryItem} className="space-y-4">
                        <InputField
                            label="اسم المادة *"
                            type="text"
                            value={newItemForm.name}
                            onChange={(e) => setNewItemForm({ ...newItemForm, name: e.target.value })}
                            placeholder="أدخل اسم المادة"
                            required
                            data-testid="input-new-item-name"
                        />
                        
                        <InputField
                            label="الباركود (اختياري - سيتم توليده تلقائياً إذا ترك فارغاً)"
                            type="text"
                            value={newItemForm.barcode}
                            onChange={(e) => setNewItemForm({ ...newItemForm, barcode: e.target.value })}
                            placeholder="أدخل الباركود"
                            data-testid="input-new-item-barcode"
                        />
                        
                        <InputField
                            label="السعر (د.ع.) *"
                            type="number"
                            step="0.01"
                            value={newItemForm.price}
                            onChange={(e) => setNewItemForm({ ...newItemForm, price: e.target.value })}
                            placeholder="أدخل السعر"
                            required
                            data-testid="input-new-item-price"
                        />
                        
                        <InputField
                            label="الكمية *"
                            type="number"
                            value={newItemForm.count}
                            onChange={(e) => setNewItemForm({ ...newItemForm, count: e.target.value })}
                            placeholder="أدخل الكمية"
                            required
                            data-testid="input-new-item-count"
                        />
                        
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">الفئة *</label>
                            <select
                                value={newItemForm.category}
                                onChange={(e) => setNewItemForm({ ...newItemForm, category: e.target.value })}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 dark:bg-gray-700 dark:text-gray-200 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                required
                                data-testid="select-new-item-category"
                            >
                                {data.settings.expenseCategories.map((cat, idx) => (
                                    <option key={idx} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex space-x-3 space-x-reverse pt-4">
                            <ActionButton type="submit" className="flex-1 bg-green-600 hover:bg-green-700" data-testid="button-save-inventory-item">
                                <Save className="w-5 h-5 ml-2" />
                                حفظ المادة
                            </ActionButton>
                            <ActionButton type="button" onClick={() => { setIsAddModalOpen(false); resetForm(); }} className="flex-1 bg-gray-500 hover:bg-gray-600" data-testid="button-cancel-add-item">
                                <X className="w-5 h-5 ml-2" />
                                إلغاء
                            </ActionButton>
                        </div>
                    </form>
                </Modal>
            )}
            
            {/* Modal تفاصيل المادة */}
            {isDetailsModalOpen && currentItem && (
                <Modal title={`تفاصيل المادة: ${currentItem.name}`} onClose={() => setIsDetailsModalOpen(false)} size="xl">
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">معلومات المادة</h4>
                        
                        {currentItem.invoiceImageUrl && (
                            <div className="text-center mb-4">
                                <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-1">صورة الفاتورة/المستند:</h5>
                                <img src={currentItem.invoiceImageUrl} alt="Invoice Document" className="w-full h-auto object-contain rounded-lg shadow-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x200/cccccc/333333?text=No+Image+Available"; }}/>
                            </div>
                        )}

                        <p className="flex items-center text-lg dark:text-gray-200"><List className="w-5 h-5 ml-2 text-indigo-500" /> **الفئة:** {currentItem.category}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><List className="w-5 h-5 ml-2 text-indigo-500" /> **الباركود:** {currentItem.barcode || 'N/A'}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><Coins className="w-5 h-5 ml-2 text-indigo-500" /> **سعر الوحدة الحالي:** {formatCurrencyDisplay(currentItem.price)}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><Package className="w-5 h-5 ml-2 text-indigo-500" /> **الكمية في المخزن:** <span className="font-bold text-teal-600 dark:text-teal-400">{currentItem.count}</span></p>
                        
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 pt-4 mb-2 flex items-center"><CalendarCheck className="w-5 h-5 ml-2 text-teal-600" /> سجل الشراء (تاريخ وسعر التكلفة)</h4>
                        {formatPurchaseHistory(currentItem.purchaseHistory || [])}

                    </div>
                </Modal>
            )}
        </div>
    );
});


/**
 * 3.5. InventoryEntryComponent (الادخال المخزني)
 */
const InventoryEntryComponent = React.memo(({ data, handleDataAction, handleDelete, setCurrentPage, showToast, setInitialExpenseState, handleRefresh }) => {
    const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false); 
    const [cancellationReason, setCancellationReason] = useState(''); 
    const [currentInvoice, setCurrentInvoice] = useState(null);
    const [globalSearch, setGlobalSearch] = useState(''); 
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false); 
    
    // **جديد:** حالة فلترة الجدول حسب حالة الفاتورة (مصفوفة الآن لدعم الاختيار المتعدد)
    const [statusFilter, setStatusFilter] = useState([]); 
    
    // حالة الـ autocomplete للمواد
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null); // لتتبع المادة قيد التعديل

    // دالة للحصول على حالة نموذج الفاتورة الافتراضية
    const getDefaultInvoiceForm = useCallback(() => ({
        vendor: data.settings.vendors[0] || '',
        representative: data.settings.representatives.find(r => r.vendor === (data.settings.vendors[0] || ''))?.name || '',
        invoiceNumber: '', // رقم فاتورة المورد
        invoiceImageUrl: '',
        expenseCategory: data.settings.expenseCategories.find(c => c.includes('مواد')) || data.settings.expenseCategories[0] || '',
        items: [], // المواد المضافة للفاتورة
        status: 'Pending', 
        totalAmount: 0,
        date: getDefaultDateTime(),
        id: null
    }), [data.settings.vendors, data.settings.representatives, data.settings.expenseCategories]);
    
    // دالة للحصول على حالة نموذج المادة الافتراضية
    const getDefaultItemForm = useCallback(() => ({ 
        name: '', 
        barcode: '', 
        price: '', 
        count: 1, 
        category: data.settings.expenseCategories.find(c => c.includes('مواد')) || data.settings.expenseCategories[0] || '' 
    }), [data.settings.expenseCategories]);

    const [invoiceForm, setInvoiceForm] = useState(getDefaultInvoiceForm);
    const [itemForm, setItemForm] = useState(getDefaultItemForm);
    
    
    // فلترة المندوبين حسب الشركة المختارة
    const filteredReps = useMemo(() => {
        return data.settings.representatives.filter(rep => rep.vendor === invoiceForm.vendor);
    }, [data.settings.representatives, invoiceForm.vendor]);
    
    // حساب الإجمالي
    const calculateTotal = useCallback(() => {
        return invoiceForm.items.reduce((sum, item) => sum + (parseFloat(item.price || 0) * parseInt(item.count || 0)), 0);
    }, [invoiceForm.items]);

    useEffect(() => {
        setInvoiceForm(prev => ({ ...prev, totalAmount: calculateTotal() }));
    }, [calculateTotal]);

    const handleItemFormChange = useCallback((key, value) => {
        const inventory = data.inventory;
        const normalizedValue = value.toLowerCase().trim();

        setItemForm(prev => {
            let newState = { ...prev, [key]: value };

            if (key === 'name') {
                const foundItem = inventory.find(i => i.name.toLowerCase().trim() === normalizedValue);
                if (foundItem) {
                    newState.barcode = foundItem.barcode || ''; // لا تولد تلقائيا
                    newState.category = foundItem.category; 
                } else {
                    newState.barcode = ''; // لا تولد تلقائيا
                }
            } else if (key === 'barcode') {
                 const foundItem = inventory.find(i => i.barcode === value);
                 if (foundItem) {
                    newState.name = foundItem.name;
                    newState.category = foundItem.category;
                 }
            }
            // يجب أن يتم تصفية الأرقام
            if (key === 'price' || key === 'count') {
                let cleanValue = convertArabicToEnglish(value);
                // **الإصلاح 4:** تحديث طريقة التحويل
                cleanValue = cleanValue.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1'); 
                newState[key] = cleanValue;
            }
            
            return newState;
        });
    }, [data.inventory]);

    // دالة البحث الذكي في المخزون عند الكتابة في حقل الاسم
    const handleItemNameChange = useCallback((value) => {
        setItemForm(prev => ({ ...prev, name: value }));
        
        if (value.length >= 2) {
            const searchNormalized = normalizeTextForSearch(value);
            
            // البحث في المخزون عن تطابقات
            const filtered = data.inventory.filter(item => {
                const itemNameNorm = normalizeTextForSearch(item.name);
                const itemBarcodeNorm = item.barcode ? normalizeTextForSearch(item.barcode) : '';
                return itemNameNorm.includes(searchNormalized) || itemBarcodeNorm.includes(searchNormalized);
            }).slice(0, 5); // عرض أول 5 نتائج فقط
            
            setSuggestions(filtered);
            setShowSuggestions(true);
        } else {
            setShowSuggestions(false);
            setSuggestions([]);
        }
    }, [data.inventory]);

    // دالة اختيار اقتراح من القائمة
    const selectSuggestion = useCallback((item) => {
        const lastPurchase = item.purchaseHistory && item.purchaseHistory.length > 0 
            ? item.purchaseHistory[0] 
            : null;
        
        setItemForm(prev => ({
            ...prev,
            name: item.name,
            barcode: item.barcode || '',
            price: lastPurchase ? lastPurchase.price.toString() : item.price.toString(),
            category: item.category
        }));
        setShowSuggestions(false);
        setSuggestions([]);
    }, []);

    // دالة فتح المودال لتعديل مادة موجودة
    const handleEditItem = useCallback((item) => {
        setItemForm({
            name: item.name,
            barcode: item.barcode,
            price: item.price.toString(),
            count: item.count,
            category: item.category
        });
        setEditingItemId(item.id);
        setIsAddItemModalOpen(true);
    }, []);



    const handleAddItemToInvoice = (e) => {
        e.preventDefault();
        
        if (!itemForm.name || !itemForm.price || !itemForm.count || itemForm.count <= 0 || !itemForm.category) {
            showToast('الرجاء ملء جميع حقول المادة بشكل صحيح (الاسم، السعر، الكمية، الفئة).', 'error');
            return;
        }

        // التحقق من وجود مادة قيد التعديل
        if (editingItemId) {
            // تحديث المادة الموجودة
            const updatedItem = {
                ...itemForm,
                id: editingItemId,
                price: parseFloat(itemForm.price),
                count: parseInt(itemForm.count),
            };
            
            setInvoiceForm(prev => ({
                ...prev,
                items: prev.items.map(item => item.id === editingItemId ? updatedItem : item)
            }));
            
            showToast(`تم تعديل المادة "${updatedItem.name}" بنجاح.`, 'success');
        } else {
            // إضافة مادة جديدة
            const newItem = {
                ...itemForm,
                id: crypto.randomUUID(),
                price: parseFloat(itemForm.price),
                count: parseInt(itemForm.count),
            };

            setInvoiceForm(prev => ({
                ...prev,
                items: [...prev.items, newItem]
            }));
            
            showToast(`تمت إضافة المادة "${newItem.name}" بنجاح.`, 'success');
        }
        
        // إعادة تهيئة نموذج المادة، مع الاحتفاظ بالفئة لتسهيل الإضافة المتعددة
        setItemForm(prev => ({ ...getDefaultItemForm(), category: prev.category }));
        setEditingItemId(null);
        setIsAddItemModalOpen(false); 
    };

    const handleRemoveItemFromInvoice = (id) => {
        setInvoiceForm(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
        showToast('تم حذف المادة بنجاح.', 'warning');
    };

    // حفظ الفاتورة كمسودة/معلقة
    const handleCreateInvoice = (e) => {
        e.preventDefault();
        
        if (invoiceForm.items.length === 0) {
            showToast('يجب إضافة مواد إلى الفاتورة أولاً.', 'error');
            return;
        }
        if (!invoiceForm.vendor || !invoiceForm.representative || !invoiceForm.invoiceNumber) {
            showToast('الرجاء ملء تفاصيل الفاتورة (المورد، المندوب، رقم فاتورة المورد).', 'error');
            return;
        }

        const invoiceToSave = {
            ...invoiceForm,
            id: invoiceForm.id || crypto.randomUUID(),
            date: getDefaultDateTime(),
            totalAmount: calculateTotal(),
            status: 'Pending',
        };

        handleDataAction('pendingInvoices', invoiceToSave, !invoiceForm.id);
        
        // إعادة تعيين النموذج بعد الحفظ
        setInvoiceForm(getDefaultInvoiceForm());
        setIsNewInvoiceModalOpen(false);
        showToast(`تم حفظ الفاتورة #${invoiceToSave.invoiceNumber} ليتم مراجعتها بنجاح.`, 'success'); // **تعديل نص الرسالة**
    };
    
    // فتح نموذج التفاصيل
    const openDetailsModal = (invoice) => {
        setCurrentInvoice(invoice);
        setIsDetailsModalOpen(true);
    };
    
    // فلترة الفواتير المعلقة (شاملة فلتر الحالة)
    const filteredInvoices = useMemo(() => {
        let list = data.pendingInvoices.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // الفلترة حسب البحث الشامل
        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch); 
            const searchNumeric = normalizeTextForSearch(globalSearch, true); 
            
            list = list.filter(inv => {
                const matchesInvoiceNum = inv.invoiceNumber && normalizeTextForSearch(inv.invoiceNumber).includes(searchLower);
                const matchesVendor = inv.vendor && normalizeTextForSearch(inv.vendor).includes(searchLower);
                const matchesRep = inv.representative && normalizeTextForSearch(inv.representative).includes(searchLower);
                const matchesItem = inv.items.some(item => normalizeTextForSearch(item.name).includes(searchLower));
                
                // البحث الرقمي عن المبلغ
                const matchesAmount = inv.totalAmount && normalizeTextForSearch(inv.totalAmount.toString(), true).includes(searchNumeric);
                
                return matchesInvoiceNum || matchesVendor || matchesRep || matchesItem || matchesAmount;
            });
        }
        
        // الفلترة حسب حالة الكارت المختار (دعم الاختيار المتعدد)
        if (statusFilter.length > 0) {
             list = list.filter(inv => statusFilter.includes(inv.status));
        }
        
        return list;
    }, [data.pendingInvoices, globalSearch, statusFilter]); // الاعتماد على statusFilter

    // الإجراء النهائي: الموافقة على الفاتورة (تسجيلها كمصروف وتحديث المخزون)
    const handleApproveInvoice = (invoice, isCreditApproval = false) => {
        // 1. تحديث المخزون
        let updatedInventory = [...data.inventory];

        invoice.items.forEach(item => {
            const existingItemIndex = updatedInventory.findIndex(i => i.name === item.name);
            
            // بيانات سجل الشراء الجديد
            const purchaseRecord = {
                date: invoice.date,
                price: item.price,
                count: item.count,
                vendor: invoice.vendor
            };

            if (existingItemIndex !== -1) {
                // تحديث كمية وسجل الشراء لمادة موجودة
                updatedInventory[existingItemIndex] = {
                    ...updatedInventory[existingItemIndex],
                    count: updatedInventory[existingItemIndex].count + item.count,
                    price: item.price, // تحديث السعر الحالي للمادة
                    purchaseHistory: [purchaseRecord, ...updatedInventory[existingItemIndex].purchaseHistory],
                };
            } else {
                // إضافة مادة جديدة للمخزون
                updatedInventory.push({
                    id: crypto.randomUUID(),
                    name: item.name,
                    barcode: item.barcode || generateBarcode(),
                    price: item.price,
                    count: item.count,
                    category: item.category,
                    purchaseHistory: [purchaseRecord],
                    invoiceImageUrl: invoice.invoiceImageUrl,
                });
            }
        });
        
        // 2. تحديث حالة الفاتورة
        let updatedInvoice;
        if (isCreditApproval) {
            // اعتماد آجل (تحديث المخزون فقط، تغيير الحالة لـ CreditApproved)
            updatedInvoice = { ...invoice, status: 'CreditApproved' };
            handleDataAction('pendingInvoices', updatedInvoice, false); 
            handleDataAction('inventory', updatedInventory, true, true);
            setIsDetailsModalOpen(false);
            setStatusFilter(prev => Array.isArray(prev) ? [...prev.filter(s => s !== 'Pending'), 'CreditApproved'] : ['CreditApproved']); // تحديث الفلتر فورا
            showToast(`تم اعتماد الفاتورة #${invoice.invoiceNumber} كـ **آجل** وإضافة المواد للمخزون.`, 'success');
            return;
        }
        
        // 3. تسجيلها كمصروف وتغيير حالتها إلى "مصروفة" (كاش أو صرف الآجل)
        const expenseRecord = {
            id: crypto.randomUUID(),
            date: invoice.date,
            invoiceNumber: invoice.invoiceNumber, // رقم فاتورة المورد
            amount: invoice.totalAmount,
            category: invoice.expenseCategory,
            description: `فاتورة شراء مواد من ${invoice.vendor} (المواد: ${invoice.items.map(i => i.name).join(', ')})`,
            vendor: invoice.vendor,
            representative: invoice.representative,
            notes: invoice.notes || '',
            invoiceImageUrl: invoice.invoiceImageUrl || '',
            inventoryItems: invoice.items,
        };
        
        // 4. إرسال بيانات المصروف إلى صفحة المصروفات وفتح المودال هناك
        setInitialExpenseState(expenseRecord);
        setCurrentPage('expenses'); // توجيه المستخدم لصفحة المصروفات

        // 5. تغيير حالة الفاتورة في pendingInvoices إلى "مصروفة"
        updatedInvoice = { ...invoice, status: 'Dispatched' };
        handleDataAction('pendingInvoices', updatedInvoice, false); 
        
        // إذا كان الصرف آجل (لم يحدث المخزون بعد)، نحدث المخزون الآن.
        if (invoice.status === 'Pending' || invoice.status === 'CreditApproved') {
            // إذا كانت pending، يتم تحديث المخزون هنا. إذا كانت CreditApproved فالمخزون محدث مسبقًا.
            if (invoice.status === 'Pending') {
                 handleDataAction('inventory', updatedInventory, true, true);
            }
        }

        setIsDetailsModalOpen(false);
        setStatusFilter(prev => Array.isArray(prev) ? [...prev.filter(s => s !== 'Pending' && s !== 'CreditApproved'), 'Dispatched'] : ['Dispatched']); // تحديث الفلتر فورا
        showToast(`تم تحويل الفاتورة #${invoice.invoiceNumber} إلى **مصروف (كاش)** بنجاح. سيتم فتح صفحة المصروفات لتأكيد الصرف.`, 'success');
    };
    
    // إلغاء الفاتورة المعلقة
    const handleCancelInvoice = (invoice) => {
        if (!cancellationReason.trim()) {
            showToast('الرجاء كتابة سبب إلغاء الفاتورة.', 'error');
            return;
        }
        
        // تغيير حالة الفاتورة في pendingInvoices إلى "ملغاة" (بدلاً من الحذف الكامل)
        const cancelledInvoice = {
             ...invoice,
             status: 'Cancelled',
             cancellationDate: getDefaultDateTime(),
             cancellationReason: cancellationReason,
        };
        
        // إذا كانت الفاتورة معتمدة آجل، يجب خصم المواد من المخزون
        if (invoice.status === 'CreditApproved') {
            let updatedInventory = [...data.inventory];
            invoice.items.forEach(item => {
                 const existingItemIndex = updatedInventory.findIndex(i => i.name === item.name);
                 if (existingItemIndex !== -1) {
                    updatedInventory[existingItemIndex] = {
                        ...updatedInventory[existingItemIndex],
                        count: updatedInventory[existingItemIndex].count - item.count,
                    };
                }
            });
            handleDataAction('inventory', updatedInventory, true, true);
        }

        handleDataAction('pendingInvoices', cancelledInvoice, false); // تعديل السجل بدلاً من حذفه
        setIsCancelModalOpen(false);
        setCurrentInvoice(null); 
        setCancellationReason('');
        
        // **الإصلاح الجذري 1:** تحديث الفلتر مباشرة بعد الإلغاء
        setStatusFilter(prev => Array.isArray(prev) ? [...prev.filter(s => s !== invoice.status), 'Cancelled'] : ['Cancelled']);
        setGlobalSearch(''); 
        
        showToast(`تم إلغاء الفاتورة #${invoice.invoiceNumber}. السبب: ${cancellationReason}. ${invoice.status === 'CreditApproved' ? 'وتم خصم المواد من المخزون.' : ''}`, 'error');
    };

    // فلترة العرض في الجدول الرئيسي لـ InventoryEntry
    const displayInvoices = useMemo(() => {
        // عرض جميع الفواتير المفلترة بغض النظر عن حالتها
        return filteredInvoices.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [data.pendingInvoices, globalSearch, statusFilter]); // الاعتماد على globalSearch لضمان تحديث الفلترة
    
    // حساب الإحصائيات الجديدة
    const allInvoices = data.pendingInvoices;
    const stats = useMemo(() => {
        const initial = { pending: 0, dispatchedCash: 0, dispatchedCredit: 0, cancelled: 0 };
        
        const counts = allInvoices.reduce((acc, invoice) => {
            if (invoice.status === 'Pending') acc.pending += invoice.totalAmount;
            else if (invoice.status === 'Dispatched') acc.dispatchedCash += invoice.totalAmount;
            else if (invoice.status === 'CreditApproved') acc.dispatchedCredit += invoice.totalAmount;
            else if (invoice.status === 'Cancelled') acc.cancelled += invoice.totalAmount;
            return acc;
        }, initial);
        
        return {
            pendingCount: allInvoices.filter(inv => inv.status === 'Pending').length,
            cashCount: allInvoices.filter(inv => inv.status === 'Dispatched').length,
            creditCount: allInvoices.filter(inv => inv.status === 'CreditApproved').length,
            cancelledCount: allInvoices.filter(inv => inv.status === 'Cancelled').length,
            totalPending: counts.pending,
            totalCash: counts.dispatchedCash,
            totalCredit: counts.dispatchedCredit,
            totalCancelled: counts.cancelled,
        };
    }, [allInvoices]);
    
    const handleFilterClick = (status) => {
         setStatusFilter(prev => {
            if (prev.length === 0) {
                return [status]; // تفعيل الفلتر الفردي
            } else if (prev.includes(status)) {
                // إلغاء الفلتر إذا كان نشطاً
                return prev.filter(cat => cat !== status); // إلغاء الفلتر
            } else {
                // إضافة فلتر جديد
                return [...prev, status]; 
            }
        });
    };
    
    // دالة مساعدة لتحديد حالة الفلتر النشطة
    const isFilterActive = (status) => {
        return statusFilter.includes(status);
    };

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-teal-500 pb-3">إدارة الإدخال المخزني </h2>

            <div className="flex justify-between items-center flex-wrap gap-4">
                 <ActionButton onClick={() => setIsNewInvoiceModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
                    <ClipboardCheck className="w-5 h-5 ml-2" />
                    إدخال فاتورة مشتريات جديدة
                </ActionButton>
                
                <div className="flex flex-wrap gap-3">
                    {/* الإحصائيات المحدثة */}
                    <div 
                        onClick={() => handleFilterClick('Pending')}
                        className={`text-xl font-bold p-4 rounded-xl shadow-md border-t-4 cursor-pointer transition transform hover:scale-[1.03] min-w-[150px] flex flex-col items-center justify-center 
                        ${isFilterActive('Pending') ? 'bg-yellow-200 border-yellow-800 ring-4 ring-yellow-400' : 'bg-yellow-50 dark:bg-yellow-900 text-yellow-800 border-yellow-600'}`}
                    >
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">معلقة:</span>
                        <span className="font-extrabold text-2xl">{stats.pendingCount}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formatCurrencyDisplay(stats.totalPending)}</span>
                    </div>
                    <div 
                        onClick={() => handleFilterClick('Dispatched')}
                        className={`text-xl font-bold p-4 rounded-xl shadow-md border-t-4 cursor-pointer transition transform hover:scale-[1.03] min-w-[150px] flex flex-col items-center justify-center 
                         ${isFilterActive('Dispatched') ? 'bg-green-200 border-green-800 ring-4 ring-green-400' : 'bg-green-50 dark:bg-green-900 text-green-800 border-green-600'}`}
                    >
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">معتمدة كاش:</span>
                        <span className="font-extrabold text-2xl">{stats.cashCount}</span>
                         <span className="text-xs text-gray-600 dark:text-gray-400">{formatCurrencyDisplay(stats.totalCash)}</span>
                    </div>
                    <div 
                        onClick={() => handleFilterClick('CreditApproved')}
                        className={`text-xl font-bold p-4 rounded-xl shadow-md border-t-4 cursor-pointer transition transform hover:scale-[1.03] min-w-[150px] flex flex-col items-center justify-center 
                         ${isFilterActive('CreditApproved') ? 'bg-blue-200 border-blue-800 ring-4 ring-blue-400' : 'bg-blue-50 dark:bg-blue-900 text-blue-800 border-blue-600'}`}
                    >
                         <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">معتمدة آجل:</span>
                        <span className="font-extrabold text-2xl">{stats.creditCount}</span>
                         <span className="text-xs text-gray-600 dark:text-gray-400">{formatCurrencyDisplay(stats.totalCredit)}</span>
                    </div>
                    <div 
                        onClick={() => handleFilterClick('Cancelled')}
                        className={`text-xl font-bold p-4 rounded-xl shadow-md border-t-4 cursor-pointer transition transform hover:scale-[1.03] min-w-[150px] flex flex-col items-center justify-center 
                         ${isFilterActive('Cancelled') ? 'bg-red-200 border-red-800 ring-4 ring-red-400' : 'bg-red-50 dark:bg-red-900 text-red-800 border-red-600'}`}
                    >
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">ملغاة:</span>
                        <span className="font-extrabold text-2xl">{stats.cancelledCount}</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{formatCurrencyDisplay(stats.totalCancelled)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-4 rounded-xl shadow-lg border border-teal-100 dark:border-teal-700 relative">
                 <label className="text-sm font-medium text-gray-600 dark:text-gray-400 block mb-1">البحث في الفواتير المعلقة</label>
                <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="ابحث برقم الفاتورة، المورد، المندوب، أو اسم مادة..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-amber-500 focus:border-amber-500"
                />
                <Search className="w-5 h-5 absolute right-3 top-1/2 transform translate-y-1/2 text-gray-400 mt-2" />
            </div>
            
            <div className="flex justify-end">
                <button onClick={handleRefresh} className="p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-gray-200 shadow-lg transition duration-200">
                    <RotateCcw className="w-6 h-6" />
                </button>
            </div>


            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">سجل فواتير المشتريات (كل الحالات)</h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">رقم فاتورة المورد</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">تاريخ الإدخال</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">المورد والمندوب</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">عدد المواد</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">الإجمالي (د.ع.)</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">الحالة والإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا توجد فواتير مشتريات مطابقة للفلترة.</td></tr>
                        ) : (
                            filteredInvoices.map(invoice => (
                                <tr key={invoice.id} 
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 cursor-pointer ${invoice.status === 'Dispatched' ? 'bg-green-50 dark:bg-green-900' : invoice.status === 'Cancelled' ? 'bg-red-50 dark:bg-red-900' : invoice.status === 'CreditApproved' ? 'bg-blue-50 dark:bg-blue-900' : 'bg-yellow-50 dark:bg-yellow-900'}`}
                                    onClick={() => openDetailsModal(invoice)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">{highlightText(invoice.invoiceNumber, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{new Date(invoice.date).toLocaleDateString('en-US')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{highlightText(`${invoice.vendor} (${invoice.representative})`, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{invoice.items.length}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{formatCurrencyDisplay(invoice.totalAmount)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {/* عرض الحالة */}
                                        {invoice.status === 'Pending' && <span className="text-yellow-600 font-bold text-xs p-1 rounded bg-yellow-100">معلقة (مراجعة)</span>}
                                        {invoice.status === 'CreditApproved' && <span className="text-blue-600 font-bold text-xs p-1 rounded bg-blue-100">آجل (تم الإدخال)</span>}
                                        {invoice.status === 'Dispatched' && <span className="text-green-600 font-bold text-xs p-1 rounded bg-green-100">مصروفة (كاش/صرف آجل)</span>}
                                        {invoice.status === 'Cancelled' && <span className="text-red-600 font-bold text-xs p-1 rounded bg-red-100">ملغاة</span>}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* مودال إدخال فاتورة جديدة */}
            {isNewInvoiceModalOpen && (
                <Modal title="إدخال فاتورة مشتريات جديدة" onClose={() => setIsNewInvoiceModalOpen(false)} size="xl">
                    <form onSubmit={handleCreateInvoice} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 p-4 rounded-xl bg-gray-50 dark:bg-gray-700">
                            <h4 className="md:col-span-2 text-lg font-bold text-gray-700 dark:text-gray-300 border-b pb-2 mb-2">معلومات الفاتورة الأساسية</h4>
                            
                            <InputField 
                                label="تاريخ الفاتورة" 
                                type="datetime-local"
                                value={invoiceForm.date}
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, date: e.target.value })}
                                required
                            />
                            <InputField 
                                label="رقم فاتورة المورد" 
                                value={invoiceForm.invoiceNumber} 
                                onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} 
                                required 
                                placeholder="رقم الفاتورة المطبوع"
                            />
                            
                            <div className="flex flex-col space-y-1 text-right">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">المورد</label>
                                <select
                                    value={invoiceForm.vendor}
                                    onChange={(e) => {
                                        const newVendor = e.target.value;
                                        setInvoiceForm(prev => ({
                                            ...prev,
                                            vendor: newVendor,
                                            representative: data.settings.representatives.find(r => r.vendor === newVendor)?.name || ''
                                        }));
                                    }}
                                    required
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl transition duration-150 text-right focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="" disabled>-- اختر الشركة الموردة --</option>
                                    {data.settings.vendors.map(vendor => (
                                        <option key={vendor} value={vendor}>{vendor}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="flex flex-col space-y-1 text-right">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">المندوب المسؤول</label>
                                <select
                                    value={invoiceForm.representative || ''}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, representative: e.target.value })}
                                    required
                                    disabled={!invoiceForm.vendor}
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl transition duration-150 text-right focus:ring-teal-500 focus:border-teal-500"
                                >
                                    <option value="" disabled>-- اختر المندوب --</option>
                                    {filteredReps.map(rep => (
                                        <option key={rep.name} value={rep.name}>{rep.name}</option>
                                    ))}
                                </select>
                            </div>
                            
                            <div className="md:col-span-2">
                                <InputField
                                    label="رابط صورة الفاتورة (اختياري)"
                                    type="url"
                                    placeholder="http://example.com/invoice.jpg"
                                    value={invoiceForm.invoiceImageUrl}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, invoiceImageUrl: e.target.value })}
                                />
                            </div>

                             <div className="flex flex-col space-y-1 text-right md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">فئة المصروف المرتبطة (لتسجيلها كمصروف لاحقاً)</label>
                                <select
                                    value={invoiceForm.expenseCategory}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, expenseCategory: e.target.value })}
                                    required
                                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl transition duration-150 text-right focus:ring-teal-500 focus:border-teal-500"
                                >
                                    {data.settings.expenseCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 flex justify-between items-center">
                            قائمة المواد
                            <ActionButton onClick={() => setIsAddItemModalOpen(true)} className="bg-teal-500 hover:bg-teal-600 px-4 py-2 text-sm">
                                <Plus className="w-4 h-4 ml-1" />
                                إضافة مادة
                            </ActionButton>
                        </h4>
                        
                        {invoiceForm.items.length === 0 ? (
                            <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 rounded-xl text-yellow-800">الرجاء إضافة مواد إلى الفاتورة.</div>
                        ) : (
                            <div className="overflow-x-auto shadow-md rounded-xl">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-teal-100">
                                        <tr>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الاسم</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الفئة</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الباركود</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">سعر الوحدة</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الكمية</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الإجمالي</th>
                                            <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">إجراء</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                        {invoiceForm.items.map(item => (
                                            <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{item.name}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">{item.category}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">{item.barcode}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrencyDisplay(item.price)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">{item.count}</td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-red-700">{formatCurrencyDisplay(item.price * item.count)}</td>
                                                <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                                                    <button type="button" onClick={() => handleEditItem(item)} className="text-blue-500 hover:text-blue-700" title="تعديل">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleRemoveItemFromInvoice(item.id)} className="text-red-500 hover:text-red-700" title="حذف">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-gradient-to-r from-blue-100 via-purple-100 to-cyan-100 dark:from-blue-950/50 dark:via-purple-950/50 dark:to-cyan-950/50 font-extrabold text-lg border-t-2 border-blue-500 dark:border-blue-400">
                                            <td colSpan="5" className="px-4 py-3 text-right text-gray-900 dark:text-gray-100 font-bold">الإجمالي الكلي للفاتورة:</td>
                                            <td colSpan="2" className="px-4 py-3 text-blue-700 dark:text-blue-300 font-extrabold text-xl">{formatCurrencyDisplay(invoiceForm.totalAmount)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                        
                        <ActionButton type="submit" disabled={invoiceForm.items.length === 0} className="w-full bg-teal-600 hover:bg-teal-700 mt-6">
                            <Save className="w-5 h-5 ml-2" />
                            حفظ الفاتورة ليتم مراجعتها
                        </ActionButton>
                    </form>
                </Modal>
            )}

            {/* مودال إضافة/تعديل مادة في الفاتورة */}
            {isAddItemModalOpen && (
                <Modal 
                    title={editingItemId ? "تعديل مادة في الفاتورة" : "إضافة مادة للفاتورة"} 
                    onClose={() => {
                        setIsAddItemModalOpen(false);
                        setEditingItemId(null);
                        setSuggestions([]);
                        setShowSuggestions(false);
                    }} 
                    size="sm"
                >
                    <form onSubmit={handleAddItemToInvoice} className="space-y-4">
                        {/* حقل اسم المادة مع autocomplete */}
                        <div className="relative">
                            <InputField 
                                label="اسم المادة" 
                                value={itemForm.name} 
                                onChange={(e) => handleItemNameChange(e.target.value)} 
                                required 
                                placeholder="مثال: شامبو، كمبيوتر..."
                            />
                            
                            {/* قائمة الاقتراحات */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-teal-300 dark:border-teal-600 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                                    {suggestions.map((item, index) => (
                                        <div
                                            key={index}
                                            onClick={() => selectSuggestion(item)}
                                            className="p-3 hover:bg-teal-50 dark:hover:bg-teal-900 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0 transition dark:text-gray-200"
                                        >
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{item.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">الباركود: {item.barcode || 'غير محدد'}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">الفئة: {item.category}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs font-semibold text-teal-600">
                                                        {formatCurrencyDisplay(item.purchaseHistory?.[0]?.price || item.price)}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">الكمية: {item.count}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* رسالة "مادة جديدة" */}
                            {showSuggestions && suggestions.length === 0 && itemForm.name.length >= 2 && (
                                <div className="absolute z-50 w-full mt-1 bg-amber-50 border border-amber-300 rounded-xl shadow-lg p-3">
                                    <p className="text-sm font-semibold text-amber-800 flex items-center">
                                        <Info className="w-4 h-4 ml-2" />
                                        مادة جديدة - لم يتم العثور عليها في المخزون
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                             <InputField 
                                label="سعر الوحدة (د.ع.)" 
                                type="number" 
                                currency
                                value={itemForm.price} 
                                onChange={(e) => handleItemFormChange('price', e.target.value)} 
                                required 
                                placeholder="0"
                            />
                             <InputField 
                                label="الكمية" 
                                type="number" 
                                value={itemForm.count} 
                                onChange={(e) => handleItemFormChange('count', e.target.value)} 
                                required 
                                placeholder="1"
                                min="1"
                                className="text-right dir-rtl"
                            />
                        </div>
                        <div className="flex flex-col space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">فئة المادة (لتصنيف المخزون)</label>
                            <select
                                value={itemForm.category}
                                onChange={(e) => setItemForm(prev => ({ ...prev, category: e.target.value }))}
                                required
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl transition duration-150 text-right focus:ring-teal-500 focus:border-teal-500"
                            >
                                <option value="" disabled>اختر الفئة</option>
                                {data.settings.expenseCategories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <InputField 
                            label="باركود المادة" 
                            value={itemForm.barcode} 
                            onChange={(e) => handleItemFormChange('barcode', e.target.value)} 
                            placeholder="اضغط على توليد باركود أو أدخله يدوياً"
                        >
                            <button type="button" onClick={() => setItemForm(prev => ({ ...prev, barcode: generateBarcode() }))} className="absolute left-1 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs bg-gray-200 hover:bg-gray-300 rounded-lg text-gray-800 dark:text-gray-200 font-semibold">
                                توليد باركود
                            </button>
                        </InputField>
                        <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50 border-2 border-blue-400 dark:border-blue-500 rounded-xl text-blue-700 dark:text-blue-300 text-base font-bold shadow-lg">
                            إجمالي سعر المادة: {formatCurrencyDisplay((parseFloat(itemForm.price || 0) * parseInt(itemForm.count || 0)))}
                        </div>
                        <ActionButton type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                            {editingItemId ? (
                                <>
                                    <Edit className="w-5 h-5 ml-2" />
                                    تعديل المادة
                                </>
                            ) : (
                                <>
                                    <Plus className="w-5 h-5 ml-2" />
                                    إضافة المادة
                                </>
                            )}
                        </ActionButton>
                    </form>
                </Modal>
            )}

            {/* مودال تفاصيل الفاتورة المعلقة */}
            {isDetailsModalOpen && currentInvoice && (
                <Modal title={`تفاصيل الفاتورة المعلقة #${currentInvoice.invoiceNumber}`} onClose={() => setIsDetailsModalOpen(false)} size="xl">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                            <p className="font-medium text-gray-700 dark:text-gray-300">المورد: <span className="font-bold">{currentInvoice.vendor}</span></p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">المندوب: <span className="font-bold">{currentInvoice.representative}</span></p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">تاريخ الفاتورة: <span className="font-bold">{new Date(currentInvoice.date).toLocaleString('en-US')}</span></p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">فئة المصروف: <span className="font-bold">{currentInvoice.expenseCategory}</span></p>
                        </div>
                        
                        {currentInvoice.invoiceImageUrl && (
                            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-xl border border-teal-200">
                                <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">صورة الفاتورة/المستند:</h5>
                                <img src={currentInvoice.invoiceImageUrl} alt="Invoice Document" className="w-full h-auto object-contain rounded-lg shadow-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 max-h-64" onError={(e) => { e.target.onerror = null; e.target.src="https://placehold.co/400x150/cccccc/333333?text=No+Image+Available"; }}/>
                            </div>
                        )}

                        <h5 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 pt-4">المواد في الفاتورة:</h5>
                        <div className="overflow-x-auto shadow-md rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-teal-100">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">المادة</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الباركود</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">سعر الوحدة</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الكمية</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                    {currentInvoice.items.map(item => (
                                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{item.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">{item.barcode}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrencyDisplay(item.price)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{item.count}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-red-700">{formatCurrencyDisplay(item.price * item.count)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gradient-to-r from-blue-100 via-purple-100 to-cyan-100 dark:from-blue-950/50 dark:via-purple-950/50 dark:to-cyan-950/50 font-extrabold text-lg border-t-2 border-blue-500 dark:border-blue-400">
                                        <td colSpan="4" className="px-4 py-3 text-right">الإجمالي الكلي:</td>
                                        <td className="px-4 py-3 text-red-800">{formatCurrencyDisplay(currentInvoice.totalAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        
                        <div className="flex flex-col gap-4 pt-4">
                            {/* حالة معلقة - تظهر أزرار الاعتماد والإلغاء */}
                            {currentInvoice.status === 'Pending' && (
                                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                                    <ActionButton 
                                        onClick={() => handleApproveInvoice(currentInvoice, true)} 
                                        className="bg-blue-600 hover:bg-blue-700"
                                    >
                                        <Package className="w-5 h-5 ml-2" />
                                        اعتماد المخزون (آجل)
                                    </ActionButton>
                                    <ActionButton 
                                        onClick={() => handleApproveInvoice(currentInvoice, false)} 
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        <CheckCircle className="w-5 h-5 ml-2" />
                                        اعتماد المخزون (كاش)
                                    </ActionButton>
                                    <ActionButton 
                                        onClick={() => { setIsDetailsModalOpen(false); setCurrentInvoice(currentInvoice); setIsCancelModalOpen(true); }} 
                                        className="bg-red-600 hover:bg-red-700"
                                    >
                                        <X className="w-5 h-5 ml-2" />
                                        إلغاء الفاتورة
                                    </ActionButton>
                                </div>
                            )}
                            
                            {/* حالة آجل - يظهر زر الصرف */}
                            {currentInvoice.status === 'CreditApproved' && (
                                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                                    <ActionButton 
                                        onClick={() => handleApproveInvoice(currentInvoice, false)} 
                                        className="w-full bg-yellow-600 hover:bg-yellow-700"
                                    >
                                        <DollarSign className="w-5 h-5 ml-2" />
                                        صرف الفاتورة (تسجيل مصروف)
                                    </ActionButton>
                                    <ActionButton 
                                        onClick={() => { setIsDetailsModalOpen(false); setCurrentInvoice(currentInvoice); setIsCancelModalOpen(true); }} 
                                        className="w-full bg-red-600 hover:bg-red-700"
                                    >
                                        <X className="w-5 h-5 ml-2" />
                                        إلغاء الفاتورة
                                    </ActionButton>
                                </div>
                            )}
                            
                            {/* حالة مصروفة وملغاة */}
                            {currentInvoice.status === 'Dispatched' && (
                                <p className="w-full text-center p-3 rounded-xl font-bold bg-green-100 text-green-700">
                                    تم صرف الفاتورة بالكامل (مسجلة كمصروف).
                                </p>
                            )}
                            {currentInvoice.status === 'Cancelled' && (
                                <p className="w-full text-center p-3 rounded-xl font-bold bg-red-100 text-red-700">
                                    الفاتورة ملغاة. السبب: {currentInvoice.cancellationReason || 'غير محدد'}
                                </p>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
            
            {/* مودال تأكيد الإلغاء */}
            {isCancelModalOpen && currentInvoice && (
                <Modal title={`تأكيد إلغاء الفاتورة #${currentInvoice.invoiceNumber}`} onClose={() => { setIsCancelModalOpen(false); setCancellationReason(''); setCurrentInvoice(null); }} size="sm">
                    <p className="text-red-700 mb-4 font-semibold">
                        هل أنت متأكد من إلغاء هذه الفاتورة؟ لن يتم إدخال المواد إلى المخزون ولن يتم تسجيل مصروف.
                    </p>
                    <InputField
                        label="سبب الإلغاء"
                        type="textarea"
                        value={cancellationReason}
                        onChange={(e) => setCancellationReason(e.target.value)}
                        required
                        placeholder="يجب ذكر السبب للإلغاء"
                    />
                    <ActionButton onClick={() => handleCancelInvoice(currentInvoice)} disabled={!cancellationReason.trim()} className="w-full bg-red-600 hover:bg-red-700 mt-4">
                        <Trash2 className="w-5 h-5 ml-2" />
                        إلغاء الفاتورة نهائياً
                    </ActionButton>
                </Modal>
            )}
        </div>
    );
});


/**
 * 3.6. SettingsPage Component
 */
const SettingsPage = React.memo(({ data, handleSettingsUpdate, showToast, onNavigateAttempt }) => {
    const [settings, setSettings] = useState(data.settings);
    const [originalSettings, setOriginalSettings] = useState(data.settings); // لحفظ الحالة الأصلية
    const [isDirty, setIsDirty] = useState(false); // لتتبع التغييرات
    
    // حالة المودال لإدارة الخروج بدون حفظ
    const [isExitModalOpen, setIsExitModalOpen] = useState(false);
    
    const [newItem, setNewItem] = useState('');
    const [currentList, setCurrentList] = useState('expenseCategories');
    const [newRep, setNewRep] = useState({ name: '', vendor: settings.vendors[0] || '' });
    
    // حالة نموذج المستخدم الجديد/المعدل
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        id: '',
        email: '',
        password: '',
        permissions: {}
    });
    
    // قائمة الصلاحيات المتاحة
    const availablePermissions = useMemo(() => ([
        { key: 'dashboard', label: 'الرئيسية' },
        { key: 'revenues', label: 'الإيرادات' },
        { key: 'expenses', label: 'الصرفيات' },
        { key: 'advances', label: 'السلف' },
        { key: 'suspended', label: 'المبالغ المعلقة' },
        { key: 'employees', label: 'الموظفين' },
        { key: 'inventoryEntry', label: 'الإدخال المخزني' },
        { key: 'inventory', label: 'المخزن والمواد' },
        { key: 'settings', label: 'الإعدادات' },
    ]), []);
    
    // دالة تحديث الحقل العام وتتبع حالة التغيير
    const handleSettingChange = (newSettings) => {
        setSettings(newSettings);
        
        // مقارنة بسيطة لمعرفة ما إذا كانت هناك تغييرات
        const currentJSON = JSON.stringify(newSettings);
        const originalJSON = JSON.stringify(originalSettings);
        setIsDirty(currentJSON !== originalJSON);
    };


    // دالة مساعدة لحفظ جميع الإعدادات
    const saveAllSettings = (e) => {
        if (e) e.preventDefault();
        
        handleSettingsUpdate(settings);
        setOriginalSettings(settings); // تحديث الحالة الأصلية بعد الحفظ
        setIsDirty(false);
        showToast('تم حفظ الإعدادات الأساسية بنجاح.', 'success');
        setIsExitModalOpen(false); // إغلاق المودال في حالة الخروج الموجه
        
        // **الإصلاح:** إذا تم الحفظ أثناء محاولة الخروج، نقوم بالتنقل
        if (isExitModalOpen && isExitModalOpen.targetPageKey) {
            onNavigateAttempt(isExitModalOpen.targetPageKey);
        }
    };
    
    // دوال إدارة القوائم (الفئات والموردين)
    
    const handleAddItem = (e) => {
        e.preventDefault();
        const value = newItem.trim();
        if (!value) return;

        if (settings[currentList].includes(value)) {
            showToast('هذا العنصر موجود بالفعل.', 'error');
            return;
        }

        handleSettingChange(prev => ({
            ...prev,
            [currentList]: [...prev[currentList], value]
        }));
        setNewItem('');
        showToast(`تم إضافة ${value} بنجاح.`, 'success');
    };

    const handleDeleteItem = (itemToDelete) => {
        handleSettingChange(prev => ({
            ...prev,
            [currentList]: prev[currentList].filter(item => item !== itemToDelete)
        }));
        
        if (currentList === 'vendors') {
             handleSettingChange(prev => ({
                ...prev,
                representatives: prev.representatives.filter(rep => rep.vendor !== itemToDelete)
            }));
        }

        showToast(`تم حذف العنصر بنجاح.`, 'warning');
    };

    // إدارة المندوبين
    const handleAddRep = (e) => {
        e.preventDefault();
        if (!newRep.name.trim() || !newRep.vendor) return;

        if (settings.representatives.some(r => r.name === newRep.name)) {
            showToast('هذا المندوب موجود بالفعل.', 'error');
            return;
        }

        handleSettingChange(prev => ({
            ...prev,
            representatives: [...prev.representatives, newRep]
        }));
        setNewRep({ name: '', vendor: settings.vendors[0] || '' });
        showToast(`تم إضافة المندوب ${newRep.name} بنجاح.`, 'success');
    };
    
    const handleDeleteRep = (repToDelete) => {
        handleSettingChange(prev => ({
            ...prev,
            representatives: prev.representatives.filter(rep => rep.name !== repToDelete.name)
        }));
        showToast('تم حذف المندوب بنجاح.', 'warning');
    };
    
    // إدارة المستخدمين
    
    const openUserModal = (user = null) => {
        if (user) {
            setCurrentUser(user);
            setUserForm({
                username: user.username,
                id: user.id,
                email: user.email,
                password: '', // لا نعرض الباسورد المحفوظة
                permissions: user.permissions
            });
        } else {
             setCurrentUser(null);
             setUserForm({
                username: '',
                id: crypto.randomUUID(),
                email: '',
                password: '',
                permissions: BASE_PERMISSIONS
             });
        }
        setIsUserModalOpen(true);
    };

    const handleUserFormSubmit = (e) => {
        e.preventDefault();
        if (!userForm.username.trim() || !userForm.email.trim() || !userForm.password.trim()) {
            showToast('يجب إدخال الاسم والبريد وكلمة المرور.', 'error');
            return;
        }

        const userToSave = {
            ...userForm,
            // ضمان وجود صلاحية الرؤية دائما للوحة المعلومات
            permissions: {
                ...userForm.permissions,
                dashboard: { view: true },
            }
        };

        handleSettingChange(prev => {
            const newUsers = currentUser 
                ? prev.users.map(u => u.id === userToSave.id ? userToSave : u)
                : [...prev.users, userToSave];
            
            // تصحيح: يجب تحديث المستخدم الذي تم تعديله بـ userToSave
            const finalUsers = prev.users.map(u => u.id === userToSave.id ? userToSave : u);
            if (!currentUser) finalUsers.push(userToSave);

            return { ...prev, users: finalUsers };
        });
        
        setIsUserModalOpen(false);
        showToast(currentUser ? 'تم تعديل صلاحيات المستخدم بنجاح.' : 'تم إضافة مستخدم جديد بنجاح.', 'success');
    };
    
    const handleDeleteUser = (userId) => {
        handleSettingChange(prev => ({
            ...prev,
            users: prev.users.filter(u => u.id !== userId)
        }));
        showToast('تم حذف المستخدم بنجاح.', 'warning');
    };
    
    const currentItems = settings[currentList] || [];

    // التعامل مع الخروج من الصفحة دون حفظ
    const handleExitClick = (targetPageKey = null) => {
        if (isDirty) {
            setIsExitModalOpen({ targetPageKey: targetPageKey });
        } else if (targetPageKey) {
             onNavigateAttempt(targetPageKey);
        }
    };
    
    const confirmDiscardAndExit = () => {
         setSettings(originalSettings); // إعادة الحالة الأصلية
         setIsDirty(false);
         // توجيه التنقل بعد تجاهل التغييرات
         if (isExitModalOpen.targetPageKey) {
             onNavigateAttempt(isExitModalOpen.targetPageKey);
         }
         setIsExitModalOpen(false);
         showToast('تم إلغاء التغييرات والخروج.', 'warning');
    };
    
    const confirmSaveAndExit = (e) => {
        // نستخدم دالة saveAllSettings التي تتضمن منطق التنقل
        saveAllSettings(e); 
    };


    // **مهم:** تم تعديل <form> الإعدادات ليصبح زر الحفظ في الأسفل
    // نستخدم React.Fragment للتحكم في عناصر الإدخال
    const renderCompanySettings = () => (
        <React.Fragment>
            <InputField 
                label="اسم الشركة/العمل" 
                value={settings.companyName} 
                onChange={(e) => handleSettingChange({ ...settings, companyName: e.target.value })} 
                required
            />
             <InputField 
                label="رابط شعار الشركة (Logo URL)" 
                value={settings.companyLogoUrl} 
                onChange={(e) => handleSettingChange({ ...settings, companyLogoUrl: e.target.value })} 
                placeholder="https://placehold.co/100x40/0d9488/ffffff?text=LOGO"
            />
        </React.Fragment>
    );

    return (
        <div className="p-6 space-y-8 bg-white rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-teal-500 pb-3">الإعدادات {isDirty && <span className='text-red-500 text-base mr-3'>(لم يتم الحفظ)</span>}</h2>
            
            {/* **التعامل مع الخروج بدون حفظ** */}
            {isExitModalOpen && (
                <Modal title="تنبيه: لم يتم حفظ التغييرات" onClose={() => setIsExitModalOpen(false)} size="sm">
                    <p className='text-lg font-medium text-red-700 mb-4'>
                        لقد قمت بإجراء تغييرات في الإعدادات. هل تريد حفظها قبل الخروج؟
                    </p>
                    <div className='flex justify-around gap-4'>
                        <ActionButton 
                            onClick={confirmSaveAndExit} 
                            className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                            <Save className="w-5 h-5 ml-2" />
                            حفظ والخروج
                        </ActionButton>
                        <ActionButton 
                            onClick={confirmDiscardAndExit} 
                            className="bg-gray-400 hover:bg-gray-50 dark:hover:bg-gray-7000 flex-1"
                        >
                            <Trash2 className="w-5 h-5 ml-2" />
                            تجاهل التغييرات
                        </ActionButton>
                    </div>
                </Modal>
            )}

            {/* إعدادات الشركة */}
            <form className="space-y-6 p-6 rounded-xl shadow-lg border-l-4 border-indigo-500 bg-indigo-50 dark:bg-indigo-900">
                <h3 className="text-2xl font-bold text-indigo-800 flex items-center"><Building className="w-6 h-6 ml-2" /> إعدادات الشركة الأساسية</h3>
                {renderCompanySettings()}
            </form>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* إدارة القوائم (الفئات والموردين) */}
                <div className="space-y-6 p-6 rounded-xl shadow-lg border-l-4 border-teal-500 dark:border-teal-400 bg-gray-50 dark:bg-gray-700">
                    <h3 className="text-2xl font-bold text-teal-800 flex items-center"><List className="w-6 h-6 ml-2" /> إدارة الفئات والأقسام والمناصب</h3>

                    <div className="flex space-x-2 space-x-reverse overflow-x-auto pb-2">
                        {['expenseCategories', 'revenueCategories', 'advanceCategories', 'departments', 'jobTitles', 'vendors'].map(key => (
                            <button
                                key={key}
                                onClick={() => setCurrentList(key)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition whitespace-nowrap ${currentList === key ? 'bg-teal-600 text-white shadow-md' : 'bg-white border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-teal-50'}`}
                            >
                                {key === 'expenseCategories' ? 'مصروفات' : key === 'revenueCategories' ? 'إيرادات' : key === 'advanceCategories' ? 'سلف' : key === 'departments' ? 'أقسام' : key === 'jobTitles' ? 'مناصب' : 'الموردين'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleAddItem} className="space-y-3">
                        <h4 className="font-semibold text-gray-700">إضافة عنصر جديد ({currentList === 'vendors' ? 'مورد' : 'فئة'})</h4>
                        <InputField 
                            value={newItem} 
                            onChange={(e) => setNewItem(e.target.value)} 
                            placeholder="أدخل اسماً جديداً" 
                            required
                        >
                            {/* **إصلاح زر الإضافة:** جعله أيقونة بيضاء بدون نص */}
                            <button type="submit" className="absolute left-1 top-1/2 transform -translate-y-1/2 px-4 py-1 text-sm bg-white hover:bg-gray-100 dark:bg-gray-600 p-2 rounded-lg">
                                <Plus className="w-4 h-4 text-teal-600" />
                            </button>
                        </InputField>
                    </form>

                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-white">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">القائمة الحالية:</h4>
                        {currentItems.map(item => (
                            <div key={item} className="flex justify-between items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-lg shadow-sm">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{item}</span>
                                <button onClick={() => handleDeleteItem(item)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {currentItems.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 italic">لا توجد عناصر مضافة حالياً.</p>}
                    </div>
                </div>

                {/* إدارة المندوبين */}
                <div className="space-y-6 p-6 rounded-xl shadow-lg border-l-4 border-blue-500 bg-gray-50">
                    <h3 className="text-2xl font-bold text-blue-800 flex items-center"><User className="w-6 h-6 ml-2" /> إدارة المندوبين (للشركات الموردة)</h3>

                    <form onSubmit={handleAddRep} className="space-y-3 p-3 border rounded-xl bg-white">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">إضافة مندوب جديد</h4>
                        <InputField 
                            label="اسم المندوب" 
                            value={newRep.name} 
                            onChange={(e) => setNewRep({ ...newRep, name: e.target.value })} 
                            required
                        />
                        <div className="flex flex-col space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 dark:text-gray-300">تابع لشركة</label>
                            <select
                                value={newRep.vendor}
                                onChange={(e) => setNewRep({ ...newRep, vendor: e.target.value })}
                                required
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl transition duration-150 text-right focus:ring-blue-500 focus:border-blue-500"
                            >
                                {settings.vendors.map(vendor => (
                                    <option key={vendor} value={vendor}>{vendor}</option>
                                ))}
                            </select>
                            {settings.vendors.length === 0 && <p className="text-xs text-red-500 mt-1">يجب إضافة موردين أولاً.</p>}
                        </div>
                        <ActionButton type="submit" disabled={settings.vendors.length === 0} className="bg-blue-600 hover:bg-blue-700 w-full">
                            <UserPlus className="w-5 h-5 ml-2" />
                            إضافة المندوب
                        </ActionButton>
                    </form>

                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border rounded-lg bg-white">
                        <h4 className="font-semibold text-gray-700 dark:text-gray-300 border-b pb-1">قائمة المندوبين:</h4>
                        {settings.representatives.map((rep, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-blue-100 rounded-lg shadow-sm">
                                <span className="font-medium text-gray-800 dark:text-gray-200">{rep.name} <span className="text-xs text-gray-500 dark:text-gray-400">({rep.vendor})</span></span>
                                <button onClick={() => handleDeleteRep(rep)} className="text-red-500 hover:text-red-700 p-1">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {settings.representatives.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 italic">لا يوجد مندوبون مضافون حالياً.</p>}
                    </div>
                </div>
                
                {/* إدارة المستخدمين والصلاحيات */}
                <div className="lg:col-span-2 space-y-6 p-6 rounded-xl shadow-lg border-l-4 border-purple-500 bg-gray-50">
                    <h3 className="text-2xl font-bold text-purple-800 flex items-center"><Users className="w-6 h-6 ml-2" /> إدارة المستخدمين والصلاحيات</h3>
                    
                    <ActionButton onClick={() => openUserModal()} className="bg-purple-600 hover:bg-purple-700 px-4 py-2 text-base">
                        <UserPlus className="w-5 h-5 ml-2" />
                        إضافة مستخدم جديد
                    </ActionButton>
                    
                    <div className="overflow-x-auto shadow-md rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-purple-100">
                                <tr>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">اسم المستخدم</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">البريد الإلكتروني</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">الصلاحيات الأساسية</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                {settings.users.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">{user.username}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{user.email}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">
                                            {user.permissions.revenues?.view ? 'إيرادات، ' : ''}
                                            {user.permissions.expenses?.view ? 'صرفيات، ' : ''}
                                            {user.permissions.inventoryEntry?.view ? 'إدخال مخزني' : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex space-x-3 space-x-reverse">
                                                <button onClick={() => openUserModal(user)} className="text-indigo-600 hover:text-indigo-900" title="تعديل الصلاحيات">
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                                <button onClick={() => handleDeleteUser(user.id)} className="text-red-600 hover:text-red-900" title="حذف المستخدم">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
             <ActionButton onClick={(e) => saveAllSettings(e)} className="w-full bg-green-600 hover:bg-green-700 mt-8">
                <Save className="w-5 h-5 ml-2" />
                حفظ جميع التغييرات في الإعدادات
            </ActionButton>

            
            {/* مودال إدارة صلاحيات المستخدمين */}
            {isUserModalOpen && (
                <Modal title={currentUser ? `تعديل صلاحيات: ${currentUser.username}` : 'إضافة مستخدم جديد'} onClose={() => setIsUserModalOpen(false)} size="xl">
                    <form onSubmit={handleUserFormSubmit} className="space-y-6">
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                             <InputField
                                label="اسم المستخدم"
                                value={userForm.username}
                                onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                                required
                            />
                             <InputField
                                label="البريد الإلكتروني"
                                type="email"
                                value={userForm.email}
                                onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                                required
                                readOnly={!!currentUser} // لا يمكن تغيير البريد بعد الإضافة
                            />
                             <InputField
                                label={currentUser ? "كلمة المرور الجديدة (أتركها فارغة للحفاظ على الحالية)" : "كلمة المرور"}
                                type="password"
                                value={userForm.password}
                                onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                required={!currentUser} // مطلوبة فقط عند إنشاء مستخدم جديد
                            />
                        </div>
                        
                        <h4 className="text-xl font-bold text-gray-700 dark:text-gray-300 border-b pb-2">تحديد الصلاحيات</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {availablePermissions.map(perm => (
                                <div key={perm.key} className="p-4 rounded-xl shadow-md bg-gray-100 dark:bg-gray-600 border border-gray-200">
                                    <h5 className="font-bold text-lg text-gray-800 dark:text-gray-200 mb-3">{perm.label}</h5>
                                    
                                    {/* صلاحية الرؤية */}
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-gray-700 dark:text-gray-300 font-medium">الرؤية ({perm.key === 'dashboard' ? 'مطلوبة' : 'view'})</label>
                                        <input
                                            type="checkbox"
                                            checked={userForm.permissions[perm.key]?.view || false}
                                            disabled={perm.key === 'dashboard'} // الرؤية دائما مطلوبة للرئيسية
                                            onChange={(e) => {
                                                setUserForm(prev => ({
                                                    ...prev,
                                                    permissions: {
                                                        ...prev.permissions,
                                                        [perm.key]: {
                                                            ...prev.permissions[perm.key],
                                                            view: e.target.checked,
                                                            // إذا ألغيت الرؤية، ألغِ باقي الصلاحيات
                                                            ...(e.target.checked ? {} : { add: false, edit: false, delete: false, approve: false, credit: false, cancel: false })
                                                        }
                                                    }
                                                }));
                                            }}
                                            className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                                        />
                                    </div>

                                    {/* صلاحيات CRUD (تعديل، إضافة، حذف) - ما عدا المخزن والإعدادات والتقارير */}
                                    {(perm.key !== 'inventory' && perm.key !== 'settings' && perm.key !== 'dashboard' && perm.key !== 'inventoryEntry') && (
                                        <div className='space-y-2 border-t pt-2 mt-2'>
                                            {['add', 'edit', 'delete'].map(action => (
                                                <div key={action} className="flex items-center justify-between">
                                                    <label className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {action === 'add' ? 'إضافة/إنشاء' : action === 'edit' ? 'تعديل' : 'حذف'}
                                                    </label>
                                                    <input
                                                        type="checkbox"
                                                        checked={userForm.permissions[perm.key]?.[action] || false}
                                                        disabled={!userForm.permissions[perm.key]?.view} // يتطلب صلاحية الرؤية
                                                        onChange={(e) => {
                                                            setUserForm(prev => ({
                                                                ...prev,
                                                                permissions: {
                                                                    ...prev.permissions,
                                                                    [perm.key]: {
                                                                        ...prev.permissions[perm.key],
                                                                        [action]: e.target.checked
                                                                    }
                                                                }
                                                            }));
                                                        }}
                                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                     {/* صلاحيات الإدخال المخزني الخاصة */}
                                    {perm.key === 'inventoryEntry' && userForm.permissions.inventoryEntry?.view && (
                                        <div className='space-y-2 border-t pt-2 mt-2'>
                                            <h6 className="font-semibold text-gray-700 dark:text-gray-300 text-sm">إجراءات الفواتير:</h6>
                                            {['approve', 'credit', 'cancel'].map(action => (
                                                <div key={action} className="flex items-center justify-between">
                                                    <label className="text-gray-600 dark:text-gray-400 text-sm">
                                                        {action === 'approve' ? 'اعتماد كاش' : action === 'credit' ? 'اعتماد آجل' : 'إلغاء الفاتورة'}
                                                    </label>
                                                    <input
                                                        type="checkbox"
                                                        checked={userForm.permissions.inventoryEntry[action] || false}
                                                        onChange={(e) => {
                                                            setUserForm(prev => ({
                                                                ...prev,
                                                                permissions: {
                                                                    ...prev.permissions,
                                                                    inventoryEntry: {
                                                                        ...prev.permissions.inventoryEntry,
                                                                        [action]: e.target.checked
                                                                    }
                                                                }
                                                            }));
                                                        }}
                                                        className="w-5 h-5 text-purple-600 focus:ring-purple-500 rounded"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        <ActionButton type="submit" className="w-full bg-purple-600 hover:bg-purple-700 mt-6">
                            <Save className="w-5 h-5 ml-2" />
                            {currentUser ? 'حفظ الصلاحيات' : 'إضافة المستخدم'}
                        </ActionButton>
                    </form>
                </Modal>
            )}
        </div>
    );
});


/**
 * 3.7. InventoryDispatchComponent (سجل الصرف المخزني)
 * **تم تحويله إلى صفحة سجل بسيط للعرض فقط**
 */
const InventoryDispatchComponent = React.memo(({ data, handleDataAction, showToast, handleDelete, handleRefresh }) => {
    const [isDispatchDetailsModalOpen, setIsDispatchDetailsModalOpen] = useState(false); 
    const [currentDispatch, setCurrentDispatch] = useState(null);
    const [globalSearchHistory, setGlobalSearchHistory] = useState('');

    
    // قائمة سجلات الصرف (للعرض في الصفحة الرئيسية للمكون)
    const dispatchHistory = useMemo(() => {
        let list = data.inventoryDispatches.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (globalSearchHistory) {
            const searchLower = normalizeTextForSearch(globalSearchHistory);
            const searchNumeric = normalizeTextForSearch(globalSearchHistory, true);
            
            list = list.filter(d => {
                const matchesName = normalizeTextForSearch(d.employeeName).includes(searchLower);
                const matchesCost = d.totalCost && normalizeTextForSearch(d.totalCost.toString(), true).includes(searchNumeric);
                
                return matchesName || matchesCost;
            });
        }
        return list; 
    }, [data.inventoryDispatches, globalSearchHistory]);
    
    // لفتح مودال التفاصيل عند النقر على سجل في الجدول
    const openDispatchDetails = (dispatch) => {
        setCurrentDispatch(dispatch);
        setIsDispatchDetailsModalOpen(true);
    };

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-blue-500 pb-3 flex items-center">
                <LogOut className="w-7 h-7 ml-3 text-blue-600" />
                سجل عمليات الصرف المخزني
            </h2>

            <div className="p-6 space-y-4 rounded-xl shadow-lg border-l-4 border-indigo-500 bg-gray-50">
                <h3 className="text-2xl font-bold text-indigo-800 flex items-center border-b pb-2">
                    <List className="w-5 h-5 ml-2" />
                    سجل عمليات الصرف التاريخية (للمراجعة)
                </h3>
                
                {/* البحث والتحديث */}
                <div className="flex justify-between items-center gap-4">
                    <div className="flex-grow relative">
                         <input
                            type="text"
                            value={globalSearchHistory}
                            onChange={(e) => setGlobalSearchHistory(e.target.value)}
                            placeholder="البحث باسم الموظف أو التكلفة..."
                            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-amber-500 focus:border-amber-500"
                        />
                        <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    <button onClick={handleRefresh} className="p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:text-gray-200 shadow-lg transition duration-200">
                        <RotateCcw className="w-6 h-6" />
                    </button>
                </div>

                <div className="overflow-x-auto shadow-md rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-100">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">التاريخ</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">الموظف المستلم</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">عدد المواد</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">التكلفة الإجمالية (د.ع.)</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                            {dispatchHistory.length === 0 ? (
                                <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا يوجد سجلات صرف مخزني.</td></tr>
                            ) : (
                                dispatchHistory.map(dispatch => (
                                    <tr key={dispatch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 cursor-pointer" onClick={() => openDispatchDetails(dispatch)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{new Date(dispatch.date).toLocaleString('en-US')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 font-semibold">{highlightText(dispatch.employeeName, globalSearchHistory)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{dispatch.items.reduce((sum, item) => sum + item.count, 0)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">{highlightText(formatCurrencyDisplay(dispatch.totalCost), globalSearchHistory)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                             <button onClick={(e) => { e.stopPropagation(); handleDelete('inventoryDispatches', dispatch.id); }} className="text-red-600 hover:text-red-900">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            
            {/* مودال عرض تفاصيل الصرف (الجدول السفلي) */}
            {isDispatchDetailsModalOpen && currentDispatch && (
                <Modal title={`تفاصيل صرف ${currentDispatch.employeeName}`} onClose={() => setIsDispatchDetailsModalOpen(false)} size="lg">
                    <div className="space-y-4 p-4 bg-gray-50 rounded-xl">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4 flex items-center">
                            <List className="w-5 h-5 ml-2 text-indigo-500" />
                            بيانات الصرف
                        </h4>
                        <p className="font-medium text-gray-700 dark:text-gray-300">**الموظف:** {currentDispatch.employeeName}</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">**التاريخ والوقت:** {new Date(currentDispatch.date).toLocaleString('en-US')}</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">**الملاحظات:** {currentDispatch.notes || 'لا توجد ملاحظات.'}</p>
                        
                        <h5 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b pb-2 pt-4">المواد المصروفة:</h5>
                        <div className="overflow-x-auto shadow-md rounded-xl">
                             <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-200">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">المادة</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الكمية</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">تكلفة الوحدة</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800">الإجمالي</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                    {currentDispatch.items.map(item => (
                                        <tr key={item.itemId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{item.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{item.count}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{formatCurrencyDisplay(item.unitPrice)}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-bold">{formatCurrencyDisplay(item.unitPrice * item.count)}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-green-50 dark:bg-green-900 font-extrabold text-lg">
                                        <td colSpan="3" className="px-4 py-3 text-right">الإجمالي الكلي:</td>
                                        <td className="px-4 py-3 text-red-800">{formatCurrencyDisplay(currentDispatch.totalCost)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}

        </div>
    );
});


/**
 * 3.8. AboutSystemModal (حول النظام)
 */
const AboutSystemModal = ({ onClose }) => (
    <Modal title="حول نظام المحاسبة العراقي" onClose={onClose} size="sm">
        <div className="space-y-4 text-center p-4">
            <h3 className="text-2xl font-extrabold text-blue-900">نظام المحاسبة العراقي (V 1.0)</h3>
            {/* **تم تغيير الجملة إلى جملة احترافية** */}
            <p className="text-gray-700 dark:text-gray-300">منصة احترافية متكاملة لإدارة الموارد والمخزون والعمليات التشغيلية بكفاءة عالية.</p>
            
            <div className="border-t border-gray-200 pt-4 space-y-2 text-right">
                {/* **تم تصحيح الاتجاه لليمين** */}
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">المصمم:</span>
                    <span className="font-bold text-indigo-600">علاء المالكي</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">رقم الهاتف:</span>
                    <span className="font-bold text-indigo-600">٠٧٧١٧٧١٦٢٠٥</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 dark:text-gray-200">إصدار التحديث:</span>
                    <span className="font-bold text-indigo-600">1.0</span>
                </div>
            </div>
            
            <ActionButton onClick={onClose} className="w-full bg-teal-600 hover:bg-teal-700 mt-4">
                إغلاق
            </ActionButton>
        </div>
    </Modal>
);


// =================================================================
// 4. المكون الرئيسي للتطبيق (APP COMPONENT)
// =================================================================

const AccountingApp = () => {
    // 1. Toaster Handler (Moved to the top to fix ReferenceError)
    const [toast, setToast] = useState({ message: '', type: '', id: null });
    const showToast = useCallback((message, type) => {
        const id = Date.now();
        setToast({ message, type, id });
    }, []);

    // 2. State Management
    const [data, setData] = useState(defaultDataStructure);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [printItem, setPrintItem] = useState(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [printReportData, setPrintReportData] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false); 
    const [refreshKey, setRefreshKey] = useState(0); 
    const [initialExpenseState, setInitialExpenseState] = useState(null);
    const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); 
    
    // **تعديل:** إزالة منطق المصادقة والاعتماد على المستخدم الافتراضي
    const currentUser = data.settings.users[0];
    
    // تحميل تفضيلات Dark Mode و Sidebar Collapse من المستخدم
    useEffect(() => {
        const user = data.settings.users[0];
        if (user) {
            setIsDarkMode(user.darkMode || false);
            setIsSidebarCollapsed(user.sidebarCollapsed || false);
        }
    }, [data.settings.users]);

    // تطبيق dark mode على body
    useEffect(() => {
        if (isDarkMode) {
            document.body.classList.add('dark');
        } else {
            document.body.classList.remove('dark');
        }
    }, [isDarkMode]);

    // حفظ تفضيلات Dark Mode و Sidebar في localStorage
    const toggleDarkMode = () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        const updatedUsers = [...data.settings.users];
        updatedUsers[0] = { ...updatedUsers[0], darkMode: newMode };
        handleSettingsUpdate({ ...data.settings, users: updatedUsers });
    };

    const toggleSidebarCollapse = () => {
        const newCollapse = !isSidebarCollapsed;
        setIsSidebarCollapsed(newCollapse);
        const updatedUsers = [...data.settings.users];
        updatedUsers[0] = { ...updatedUsers[0], sidebarCollapsed: newCollapse };
        handleSettingsUpdate({ ...data.settings, users: updatedUsers });
    }; 


    // دالة تحديث الحالة العامة (لحل مشكلة التحديث الفوري)
    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
        showToast('تم تحديث بيانات الصفحة.', 'info');
    }, [showToast]);

    // 3. CRUD Logic (Updated to take showToast as an argument where needed)
    const handleDataAction = (collectionName, item, isNew, overwrite = false) => {
        // **تحديث: فحص صلاحيات الإضافة/التعديل**
        const permissionKey = navItems.find(i => i.key === collectionName)?.key;
        const requiredAction = isNew ? 'add' : 'edit';

        if (permissionKey && !currentUser?.permissions[permissionKey]?.[requiredAction]) {
            showToast(`ليس لديك صلاحية ${isNew ? 'إضافة' : 'تعديل'} سجلات في قسم ${navItems.find(i => i.key === collectionName)?.label}.`, 'error');
            return;
        }


        let newData = { ...data };
        let collection = newData[collectionName];

        if (overwrite) {
             newData[collectionName] = item;
             saveData(newData);
             
             // إجبار المكونات على إعادة الرسم بعد التحديث الشامل
             setRefreshKey(prev => prev + 1);
             return;
        }

        if (isNew) {
            // إضافة
            // للمواد المخزنية، قد يكون لديها id و barcode بالفعل
            const newItem = {
                ...item,
                id: item.id || crypto.randomUUID(),
                // فقط إضافة invoiceNumber إذا لم يكن المخزون
                ...(collectionName !== 'inventory' ? { invoiceNumber: generateInvoiceNumber() } : {})
            };
            newData[collectionName] = [...collection, newItem];
            
            // رسالة النجاح المخصصة
            if (collectionName === 'inventory') {
                // لا نعرض رسالة هنا لأن المكون سيعرضها
            } else {
                showToast(`تم إضافة السجل بنجاح!`, 'success');
            }
            
            // إذا كان سجلاً في المخزون تم إضافته يدوياً، نضيف له سجل شراء مبدئي
            if (collectionName === 'inventory' && !newItem.purchaseHistory) {
                 newItem.purchaseHistory = [];
            }
            setInitialExpenseState(null); // مسح حالة الإرسال التلقائي
        } else {
            // تعديل
            const index = collection.findIndex(i => i.id === item.id);
            if (index !== -1) {
                collection[index] = item;
                newData[collectionName] = collection;
                showToast(`تم تعديل السجل بنجاح!`, 'success');
            } else if (collectionName === 'pendingInvoices' && item.status) {
                 // حالة تحديث حالة فاتورة موجودة (مصروفة أو ملغاة)
                 const existingIndex = collection.findIndex(i => i.id === item.id);
                 if (existingIndex !== -1) {
                      collection[existingIndex] = item;
                      newData[collectionName] = collection;
                 } else {
                     // في حالة عدم العثور عليها، يتم إضافتها إذا لم يكن لديها حالة (للتأكد فقط)
                      newData[collectionName] = [...collection, item];
                 }
            }
        }
        
        saveData(newData);
        // **إضافة التحديث الفوري:**
        setRefreshKey(prev => prev + 1);
    };

    const handleDelete = (collectionName, id, showMessage = true) => {
        // **تحديث: فحص صلاحيات الحذف**
        const permissionKey = navItems.find(i => i.key === collectionName)?.key;
        if (permissionKey && !currentUser?.permissions[permissionName]?.delete && collectionName !== 'inventoryDispatches') {
            showToast(`ليس لديك صلاحية حذف سجلات في قسم ${navItems.find(i => i.key === collectionName)?.label}.`, 'error');
            return;
        }
        
        let newData = { ...data };
        
        // **مهم:** إذا تم حذف سجل صرف مخزني، يجب إعادة المواد للمخزون
        if (collectionName === 'inventoryDispatches') {
            const dispatchToDelete = data.inventoryDispatches.find(d => d.id === id);
            if (dispatchToDelete) {
                let updatedInventory = [...newData.inventory];
                dispatchToDelete.items.forEach(dItem => {
                    const index = updatedInventory.findIndex(i => i.id === dItem.itemId);
                    if (index !== -1) {
                        updatedInventory[index] = {
                            ...updatedInventory[index],
                            count: updatedInventory[index].count + dItem.count,
                        };
                    }
                });
                // تحديث المخزون بالكامل
                newData.inventory = updatedInventory; 
            }
        }
        
        newData[collectionName] = newData[collectionName].filter(item => item.id !== id);

        if (showMessage) {
           showToast('تم حذف السجل بنجاح.', 'warning');
        }
        
        saveData(newData);
        setRefreshKey(prev => prev + 1); // تحديث فوري بعد الحذف
    };
    
    // 4. Data Persistence (Local Storage for simplicity)
    useEffect(() => {
        try {
            const savedData = localStorage.getItem(STORAGE_KEY);
            if (savedData) {
                // دمج البيانات المحفوظة مع الإعدادات الافتراضية الجديدة في حال عدم وجودها
                const parsedData = JSON.parse(savedData);
                setData(prev => ({
                    ...defaultDataStructure,
                    ...parsedData,
                    settings: {
                        ...defaultSettings,
                        ...(parsedData.settings || {})
                    }
                }));
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
        }
    }, []);

    const saveData = (newData) => {
        setData(newData);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
        } catch (error) {
            console.error("Failed to save data to localStorage", error);
            showToast('خطأ في حفظ البيانات محلياً. يرجى التحقق من مساحة التخزين.', 'error');
        }
    };

    // 5. Settings Update
    const handleSettingsUpdate = (newSettings) => {
        saveData({
            ...data,
            settings: newSettings
        });
    };
    
    // 6. Birthdays Calculation
    const upcomingBirthdays = useMemo(() => {
        const today = new Date();
        const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return data.employees.filter(emp => {
            if (!emp.dateOfBirth) return false;
            
            const dob = new Date(emp.dateOfBirth);
            const thisYearBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
            
            // تحقق إذا كان عيد الميلاد في الـ 7 أيام القادمة
            if (thisYearBirthday >= today && thisYearBirthday <= next7Days) {
                return true;
            }
            
            return false;
        }).map(emp => ({
            name: emp.name,
            date: new Date(emp.dateOfBirth).toLocaleDateString('ar-IQ', { month: 'long', day: 'numeric' })
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

    }, [data.employees]);


    // 7. Routing and Navigation
    const navItems = [
        { key: 'dashboard', label: 'الرئيسية', icon: Home, component: DashboardComponent },
        { key: 'revenues', label: 'الإيرادات', icon: TrendingUp, component: DataPageComponent, props: { type: 'revenue', collectionName: 'revenues', categories: data.settings.revenueCategories, fields: [{ key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'category', label: 'فئة الإيراد', type: 'select', required: true }, { key: 'description', label: 'الوصف/المصدر', type: 'textarea' }], handleRefresh } },
        { key: 'expenses', label: 'الصرفيات', icon: TrendingDown, component: DataPageComponent, props: { type: 'expense', collectionName: 'expenses', categories: data.settings.expenseCategories, fields: [{ key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'category', label: 'فئة المصروف', type: 'select', required: true }, { key: 'description', label: 'الوصف المفصل', type: 'textarea', required: true }], handleRefresh } },
        { key: 'advances', label: 'السلف', icon: Coins, component: DataPageComponent, props: { type: 'advance', collectionName: 'advances', categories: data.settings.advanceCategories, fields: [{ key: 'employeeName', label: 'الموظف المعني', type: 'select', required: true }, { key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'category', label: 'فئة السلفة', type: 'select', required: true }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }], handleRefresh } },
        { key: 'suspended', label: 'المعلقة (قيد التسوية)', icon: RotateCcw, component: DataPageComponent, props: { type: 'suspended', collectionName: 'suspended', fields: [{ key: 'recipientName', label: 'اسم المستلم', required: true }, { key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }], handleRefresh } },
        { key: 'employees', label: 'الموظفين', icon: Users, component: EmployeePageComponent, props: { handleRefresh } },
        { key: 'payroll', label: 'الرواتب', icon: Calculator, component: PayrollPageComponent, props: { handleRefresh } },
        { key: 'inventoryEntry', label: 'الإدخال المخزني', icon: ClipboardCheck, component: InventoryEntryComponent, props: { handleRefresh } },
        { key: 'inventory', label: 'المخزن والمواد', icon: Package, component: InventoryPageComponent, props: { handleRefresh, handleDataAction } },
        { key: 'settings', label: 'الإعدادات', icon: Settings, component: SettingsPage, props: { handleSettingsUpdate } },
    ];
    
    // فلترة عناصر القائمة حسب صلاحيات المستخدم
    const visibleNavItems = useMemo(() => {
        if (!currentUser) return [];
        return navItems.filter(item => {
            const perm = currentUser.permissions[item.key];
            // حول النظام مرئية للجميع
            if (item.key === 'about') return true; 
            // تحقق من صلاحية الرؤية
            return perm && perm.view;
        });
    }, [currentUser, data.settings.users]); 

    const CurrentComponent = navItems.find(item => item.key === currentPage);
    const PageComponent = CurrentComponent?.component;
    const pageProps = CurrentComponent?.props || {};
    
    // **تعديل:** إزالة منطق تسجيل الدخول
    // ------------------------------------
    const currentUserForApp = data.settings.users[0]; // المستخدم الافتراضي
    // ------------------------------------

    const handleNavigationClick = (key) => {
        // **الإصلاح الجذري لمشكلة التنقل:**
        if (currentPage === 'settings' && key !== 'settings') {
             // نرسل نية الانتقال إلى SettingsPage لتبدأ عملية التحقق من isDirty
             const settingsPageInstance = navItems.find(i => i.key === 'settings');
             
             // نمرر النية إلى SettingsPage
             // بما أننا لا نستطيع استخدام Refs/Instances مباشرة، سنعتمد على دالة callback خاصة من App
             // SettingsPage ستستخدم onNavigateAttempt التي يتم تمريرها لفتح مودال التأكيد
             handleSettingsNavigation(key);
             return;
        }

        setCurrentPage(key);
        setInitialExpenseState(null); 
        setIsSidebarOpen(false); // إغلاق الشريط الجانبي بعد التنقل في وضع الجوال
    }
    
    // **دالة تنقل خاصة تستخدمها SettingsPage فقط بعد تأكيد الحفظ/الإلغاء**
    const handleSettingsNavigation = (key) => {
         setCurrentPage(key);
         setInitialExpenseState(null); 
         setIsSidebarOpen(false);
    }



    // =================================================================
    // AI Chatbot Component
    // =================================================================
    const AIChatbot = () => {
        const [isOpen, setIsOpen] = useState(false);
        const [messages, setMessages] = useState([
            {
                id: 1,
                text: 'مرحباً! أنا علاء، مساعدك الذكي في نظام الحسابات. كيف يمكنني مساعدتك اليوم؟',
                sender: 'bot',
                timestamp: new Date()
            }
        ]);
        const [inputMessage, setInputMessage] = useState('');
        const [isSending, setIsSending] = useState(false);
        const messagesEndRef = React.useRef(null);

        const scrollToBottom = () => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        };

        useEffect(() => {
            scrollToBottom();
        }, [messages]);

        const handleSendMessage = async (e) => {
            e.preventDefault();
            
            if (!inputMessage.trim() || isSending) return;

            const userMessage = {
                id: Date.now(),
                text: inputMessage,
                sender: 'user',
                timestamp: new Date()
            };

            setMessages(prev => [...prev, userMessage]);
            setInputMessage('');
            setIsSending(true);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        message: inputMessage,
                        context: {
                            currentPage,
                            user: currentUserForApp.username
                        }
                    }),
                });

                if (!response.ok) {
                    throw new Error('فشل في الاتصال بالخادم');
                }

                const data = await response.json();
                
                const botMessage = {
                    id: Date.now() + 1,
                    text: data.reply || 'عذراً، حدث خطأ في معالجة طلبك.',
                    sender: 'bot',
                    timestamp: new Date()
                };

                setMessages(prev => [...prev, botMessage]);
            } catch (error) {
                console.error('Chat error:', error);
                const errorMessage = {
                    id: Date.now() + 1,
                    text: 'عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
                    sender: 'bot',
                    timestamp: new Date()
                };
                setMessages(prev => [...prev, errorMessage]);
            } finally {
                setIsSending(false);
            }
        };

        const formatTime = (date) => {
            return new Date(date).toLocaleTimeString('ar-IQ', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        };

        return (
            <div className="fixed bottom-4 left-4 z-50" dir="rtl">
                {/* Chat Window */}
                {isOpen && (
                    <div className="mb-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transition-all duration-300">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-teal-600 to-blue-600 p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3 space-x-reverse">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                                    <MessageCircle className="w-6 h-6 text-teal-600" />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-lg">اسأل علاء</h3>
                                    <p className="text-teal-100 text-xs">متصل الآن</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
                                data-testid="button-close-chatbot"
                            >
                                <Minimize2 className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Messages Container */}
                        <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex ${message.sender === 'user' ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl p-3 ${
                                            message.sender === 'user'
                                                ? 'bg-teal-600 text-white rounded-tr-none'
                                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                                        }`}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                                        <p className={`text-xs mt-1 ${
                                            message.sender === 'user' 
                                                ? 'text-teal-100' 
                                                : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                            {formatTime(message.timestamp)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {isSending && (
                                <div className="flex justify-end">
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-tl-none p-3">
                                        <div className="flex space-x-2 space-x-reverse">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Form */}
                        <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-2 space-x-reverse">
                                <input
                                    type="text"
                                    value={inputMessage}
                                    onChange={(e) => setInputMessage(e.target.value)}
                                    placeholder="اكتب رسالتك هنا..."
                                    disabled={isSending}
                                    className="flex-1 p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent transition bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                                    data-testid="input-chat-message"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputMessage.trim() || isSending}
                                    className="bg-teal-600 hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white p-3 rounded-xl transition duration-200 shadow-lg"
                                    data-testid="button-send-message"
                                >
                                    <Send className="w-5 h-5" />
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Floating Toggle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110"
                    data-testid="button-toggle-chatbot"
                >
                    {isOpen ? (
                        <X className="w-6 h-6" />
                    ) : (
                        <MessageCircle className="w-6 h-6" />
                    )}
                </button>
            </div>
        );
    };

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 antialiased text-right" dir="rtl">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                    body { font-family: 'Cairo', sans-serif; }
                    /* تنسيق خاص للطباعة */
                    @media print {
                        .app-sidebar, .app-header, .print:hidden, .no-print-footer { display: none !important; }
                        .app-main-content { margin-right: 0 !important; width: 100% !important; }
                        body { background: white !important; }
                        /* لإظهار محتوى الطباعة داخل المودال */
                        #print-invoice-content, #print-report-content { display: block !important; }
                    }
                `}
            </style>
            
            {/* Overlay for mobile view */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* Sidebar Navigation (Fixed for better consistency) */}
            <div className={`app-sidebar ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white flex flex-col shadow-2xl border-l border-blue-700 dark:border-gray-700 fixed top-0 right-0 h-full z-50 transition-all duration-300 transform ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'} lg:flex`}>
                <div className={`${isSidebarCollapsed ? 'p-2' : 'p-6'} text-center border-b-2 border-blue-600 dark:border-gray-700 transition-all duration-300 bg-blue-950/30 dark:bg-gray-950/30`}>
                    {/* زر الطي في أعلى Sidebar */}
                    <button onClick={toggleSidebarCollapse} className={`${isSidebarCollapsed ? 'mx-auto' : 'absolute left-3 top-4'} text-white p-2 rounded-full lg:inline-block hidden hover:bg-blue-800 transition`}>
                        {isSidebarCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {!isSidebarCollapsed && <h1 className="text-3xl font-extrabold">{data.settings.companyName}</h1>}
                    {!isSidebarCollapsed && <p className="text-sm opacity-75">مرحباً, {currentUserForApp.username}</p>}
                    <button onClick={() => setIsSidebarOpen(false)} className="absolute left-3 top-4 text-white p-2 rounded-full lg:hidden hover:bg-blue-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <nav className={`flex-grow ${isSidebarCollapsed ? 'p-2' : 'p-4'} space-y-2 overflow-y-auto transition-all duration-300`}>
                    {visibleNavItems.map(item => (
                        <button
                            key={item.key}
                            onClick={() => {
                                handleNavigationClick(item.key);
                                setIsSidebarOpen(false);
                            }}
                            className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'text-right p-3'} rounded-xl transition duration-200 ${
                                currentPage === item.key ? 'bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-500 dark:to-purple-500 shadow-xl font-bold scale-105' : 'hover:bg-blue-800/50 dark:hover:bg-gray-700/50 hover:scale-102'
                            }`}
                            title={isSidebarCollapsed ? item.label : ''}
                        >
                            <item.icon className={`w-5 h-5 ${!isSidebarCollapsed && 'ml-3'}`} />
                            {!isSidebarCollapsed && <span className="text-lg">{item.label}</span>}
                        </button>
                    ))}
                    {/* زر حول النظام */}
                    <button
                        onClick={() => { setIsAboutModalOpen(true); setIsSidebarOpen(false); }}
                        title={isSidebarCollapsed ? 'حول النظام' : ''}
                        className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center p-2' : 'text-right p-3'} rounded-xl transition-all duration-200 hover:bg-blue-800/50 dark:hover:bg-gray-700/50 mt-4 border-t-2 border-blue-600 dark:border-gray-700 pt-4 hover:scale-102`}
                    >
                        <Info className={`w-5 h-5 ${!isSidebarCollapsed && 'ml-3'}`} />
                        {!isSidebarCollapsed && <span className="text-lg">حول النظام</span>}
                    </button>
                    
                    {/* زر الوضع الداكن/الفاتح */}
                    <button
                        onClick={toggleDarkMode}
                        data-testid="button-toggle-theme"
                        title={isDarkMode ? 'الوضع الفاتح' : 'الوضع الداكن'}
                        className="w-full flex items-center justify-center p-2 rounded-xl transition-all duration-200 hover:bg-blue-800/50 dark:hover:bg-gray-700/50 hover:scale-105"
                    >
                        {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </button>
                </nav>
            </div>

            {/* Main Content Area */}
            <main className={`flex-grow p-4 md:p-8 ${isSidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
                {/* Header for Mobile/Tablet */}
                <header className="app-header flex justify-between items-center bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 mb-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 lg:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="text-blue-600 dark:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-700 transition">
                        <Menu className="w-6 h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 dark:text-gray-100">{navItems.find(item => item.key === currentPage)?.label}</h1>
                <div className="flex items-center space-x-2 space-x-reverse">
                        <button onClick={toggleDarkMode} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 text-gray-700 dark:text-gray-200">
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </header>

                <div className="max-w-full mx-auto"> {/* تم تغيير max-w-7xl إلى max-w-full لزيادة التجاوب */}
                    {PageComponent && (
                        <PageComponent
                            key={currentPage + refreshKey} // استخدام refreshKey لإجبار المكون على إعادة الرسم
                            data={data}
                            handleDataAction={handleDataAction}
                            handleDelete={handleDelete}
                            handleSettingsUpdate={handleSettingsUpdate}
                            showToast={showToast}
                            setCurrentPage={setCurrentPage}
                            upcomingBirthdays={upcomingBirthdays}
                            setPrintItem={setPrintItem}
                            setPrintReportData={setPrintReportData}
                            setIsReportModalOpen={setIsReportModalOpen}
                            initialExpenseState={initialExpenseState} // تمرير حالة المصروف التلقائي
                            setInitialExpenseState={setInitialExpenseState} // تمرير دالة المسح
                            handleRefresh={handleRefresh}
                            currentUser={currentUserForApp} // تمرير صلاحيات المستخدم الافتراضي
                            onNavigateAttempt={handleSettingsNavigation} // تمرير دالة التنقل الخاصة بـ SettingsPage
                            {...pageProps}
                        />
                    )}
                </div>
            </main>

            {/* Print Modal (for individual invoices/advances) */}
            {printItem && (
                <PrintInvoice 
                    item={printItem} 
                    onClose={() => setPrintItem(null)}
                    companyName={data.settings.companyName}
                    companyLogoUrl={data.settings.companyLogoUrl}
                    employees={data.employees}
                />
            )}
            
            {/* Print Report Modal (for lists) */}
            {isReportModalOpen && (
                <PrintReportModal
                    reportData={printReportData}
                    title={CurrentComponent?.label || 'التقرير'}
                    onClose={() => setIsReportModalOpen(false)}
                    companyName={data.settings.companyName}
                    companyLogoUrl={data.settings.companyLogoUrl}
                />
            )}

            {/* About System Modal */}
            {isAboutModalOpen && <AboutSystemModal onClose={() => setIsAboutModalOpen(false)} />}


            {/* Notification Toast */}
            {toast.message && (
                <NotificationToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: '', id: null })}
                />
            )}

            {/* AI Chatbot */}
            <AIChatbot />
        </div>
    );
};

export default AccountingApp;