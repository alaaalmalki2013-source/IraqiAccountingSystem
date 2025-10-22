// About Page Component - نظام المحاسبة العراقي
import { 
    Shield, CheckCircle, Users, TrendingUp, TrendingDown, Package, 
    Globe, Moon, Smartphone, Lock, Clock, FileText, Database,
    Zap, RefreshCw, Calendar, BarChart, Settings, DollarSign
} from 'lucide-react';

export const AboutPage = () => {
    const features = [
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: 'إدارة الإيرادات',
            description: 'نظام شامل لتسجيل وتتبع جميع الإيرادات مع التصنيفات والفلاتر المتقدمة'
        },
        {
            icon: <TrendingDown className="w-8 h-8" />,
            title: 'إدارة الصرفيات',
            description: 'تسجيل وتنظيم المصروفات مع إمكانية التصنيف والتصدير للإكسل'
        },
        {
            icon: <Clock className="w-8 h-8" />,
            title: 'الصرفيات المعلقة',
            description: 'نظام موافقات للمصروفات مع الاحتفاظ الدائم بالسجلات للمراجعة'
        },
        {
            icon: <Users className="w-8 h-8" />,
            title: 'إدارة الموظفين',
            description: 'قاعدة بيانات شاملة للموظفين مع تتبع الرواتب والسلف والغيابات'
        },
        {
            icon: <DollarSign className="w-8 h-8" />,
            title: 'نظام الرواتب',
            description: 'حساب آلي للرواتب مع المكافآت والاستقطاعات وطباعة القسائم'
        },
        {
            icon: <Package className="w-8 h-8" />,
            title: 'إدارة المخزون',
            description: 'تتبع كامل للمواد مع الباركود، فواتير الإدخال والاستخراج'
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: 'نظام الصلاحيات',
            description: '6 مستويات صلاحيات مختلفة مع تحكم دقيق بالوصول'
        },
        {
            icon: <Globe className="w-8 h-8" />,
            title: 'ثنائي اللغة',
            description: 'دعم كامل للعربية والإنجليزية مع واجهة RTL احترافية'
        },
        {
            icon: <Moon className="w-8 h-8" />,
            title: 'الوضع الليلي',
            description: 'تبديل سلس بين الوضعين الفاتح والداكن لراحة العين'
        },
        {
            icon: <Smartphone className="w-8 h-8" />,
            title: 'تصميم متجاوب',
            description: 'يعمل بكفاءة على جميع الأجهزة والشاشات'
        },
        {
            icon: <Database className="w-8 h-8" />,
            title: 'عمل بدون إنترنت',
            description: 'جميع البيانات محفوظة محلياً - يعمل بدون اتصال'
        },
        {
            icon: <FileText className="w-8 h-8" />,
            title: 'تصدير واستيراد Excel',
            description: 'إمكانية استيراد وتصدير البيانات من وإلى ملفات Excel'
        },
        {
            icon: <Lock className="w-8 h-8" />,
            title: 'صلاحية النظام',
            description: 'تحديد تاريخ انتهاء للنظام مع وصول حصري للأدمن بعد الانتهاء'
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: 'أداء عالي',
            description: 'تحديثات فورية وأداء سريع مع تقنيات React الحديثة'
        },
        {
            icon: <RefreshCw className="w-8 h-8" />,
            title: 'سجل النشاطات',
            description: 'تسجيل تلقائي لجميع العمليات مع فلترة وبحث متقدم'
        },
        {
            icon: <Calendar className="w-8 h-8" />,
            title: 'تنبيهات الأعياد',
            description: 'تذكير تلقائي بأعياد ميلاد الموظفين على لوحة التحكم'
        }
    ];

    const permissionLevels = [
        {
            icon: '🛡️',
            title: 'الأدمن',
            description: 'صلاحيات كاملة على جميع الأقسام بما في ذلك صفحة الإدارة'
        },
        {
            icon: '👔',
            title: 'السوبر فايزر',
            description: 'صلاحيات كاملة على جميع الأقسام ما عدا صفحة الإدارة'
        },
        {
            icon: '📊',
            title: 'المدير العام',
            description: 'صلاحيات قراءة فقط على جميع الأقسام ما عدا الإعدادات'
        },
        {
            icon: '📦',
            title: 'أمين المخزن',
            description: 'صلاحيات كاملة على المخزون والإدخال والاستخراج'
        },
        {
            icon: '💼',
            title: 'المحاسب',
            description: 'صلاحيات قراءة + اعتماد الفواتير والصرفيات المعلقة'
        },
        {
            icon: '💰',
            title: 'الكاشير',
            description: 'اعتماد الاستخراجات المخزنية وإدارة المبالغ المعلقة'
        }
    ];

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl">
            {/* Header */}
            <div className="text-center space-y-4 p-8 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-800 dark:to-indigo-800 rounded-2xl shadow-2xl">
                <h1 className="text-4xl md:text-5xl font-extrabold text-white">
                    نظام المحاسبة العراقي
                </h1>
                <p className="text-xl md:text-2xl text-blue-100">
                    Iraqi Accounting System
                </p>
                <div className="inline-block px-6 py-2 bg-white/20 rounded-full">
                    <span className="text-white font-bold text-lg">الإصدار V3.0</span>
                </div>
            </div>

            {/* Description */}
            <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-3">
                    <BarChart className="w-8 h-8 text-blue-600" />
                    نظرة عامة
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                    نظام محاسبة شامل مصمم خصيصاً للسوق العراقي، يوفر إدارة كاملة للإيرادات والمصروفات والمخزون والموظفين والرواتب. 
                    يتميز بواجهة عربية احترافية كاملة مع دعم RTL، ووضع ليلي متطور، وإمكانية العمل بدون إنترنت، 
                    ونظام صلاحيات متعدد المستويات لضمان الأمان والتحكم الكامل.
                </p>
            </div>

            {/* Features Grid */}
            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                    المزايا والخصائص
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-5 bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-r-4 border-blue-500"
                        >
                            <div className="text-blue-600 dark:text-blue-400 mb-3">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Permission Levels */}
            <div className="space-y-4">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-3">
                    <Shield className="w-8 h-8 text-purple-600" />
                    مستويات الصلاحيات
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {permissionLevels.map((level, index) => (
                        <div
                            key={index}
                            className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-xl shadow-lg border-r-4 border-purple-600"
                        >
                            <div className="text-4xl mb-3">{level.icon}</div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
                                {level.title}
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {level.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Technical Specs */}
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 dark:from-gray-700 dark:to-gray-800 p-6 md:p-8 rounded-2xl shadow-xl">
                <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                    <Settings className="w-8 h-8" />
                    المواصفات التقنية
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-200">
                    <div className="space-y-2">
                        <p className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-semibold">التقنية:</span> React + TypeScript
                        </p>
                        <p className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-semibold">التصميم:</span> Tailwind CSS + Gradients
                        </p>
                        <p className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-semibold">التخزين:</span> localStorage (offline-first)
                        </p>
                    </div>
                    <div className="space-y-2">
                        <p className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-semibold">التنسيق:</span> dd/mm/yyyy للتواريخ
                        </p>
                        <p className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-semibold">الأرقام:</span> English numerals
                        </p>
                        <p className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-green-400" />
                            <span className="font-semibold">المحذوفات:</span> لا حذف نهائي - تغيير حالة فقط
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-center p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                    نظام محاسبة متكامل • مصمم للسوق العراقي • 2025
                </p>
            </div>
        </div>
    );
};
