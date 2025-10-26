import { ChevronLeft, ChevronRight, X, Sun, Moon, LogOut } from 'lucide-react';

interface SidebarProps {
    isSidebarCollapsed: boolean;
    toggleSidebarCollapse: () => void;
    isSidebarOpen: boolean;
    setIsSidebarOpen: (open: boolean) => void;
    companyName: string;
    username: string;
    visibleNavItems: any[];
    currentPage: string;
    handleNavigationClick: (key: string) => void;
    isDarkMode: boolean;
    toggleDarkMode: () => void;
    handleLogout: () => void;
    t: (key: string) => string;
}

export function Sidebar({
    isSidebarCollapsed,
    toggleSidebarCollapse,
    isSidebarOpen,
    setIsSidebarOpen,
    companyName,
    username,
    visibleNavItems,
    currentPage,
    handleNavigationClick,
    isDarkMode,
    toggleDarkMode,
    handleLogout,
    t
}: SidebarProps) {
    return (
        <div className={`app-sidebar ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white flex flex-col shadow-2xl border-l border-blue-700 dark:border-gray-700 fixed top-0 right-0 h-full z-50 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full'} lg:!translate-x-0`}>
            <div className={`${isSidebarCollapsed ? 'p-2' : 'p-6'} text-center border-b-2 border-blue-600 dark:border-gray-700 transition-all duration-300 bg-blue-950/30 dark:bg-gray-950/30`}>
                {/* زر الطي في أعلى Sidebar */}
                <button onClick={toggleSidebarCollapse} className={`${isSidebarCollapsed ? 'mx-auto' : 'absolute left-3 top-4'} flex items-center justify-center text-white p-2 rounded-full lg:inline-block hidden hover:bg-blue-800 transition`}>
                    {isSidebarCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
                {!isSidebarCollapsed && <h1 className="text-3xl font-extrabold">{companyName}</h1>}
                {!isSidebarCollapsed && <p className="text-sm opacity-75">مرحباً, {username}</p>}
                <button onClick={() => setIsSidebarOpen(false)} className="absolute left-3 top-4 flex items-center justify-center text-white p-2 rounded-full lg:hidden hover:bg-blue-800">
                    <X className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>
            <nav className={`flex-grow ${isSidebarCollapsed ? 'p-2' : 'p-4'} space-y-2 overflow-y-auto transition-all duration-300 sidebar-scroll`}>
                {visibleNavItems.map((item, index) => {
                    // تحديد ما إذا كنا بحاجة لفاصل بعد هذا العنصر
                    const needsSeparator = 
                        item.key === 'dashboard' || // بعد الرئيسية
                        item.key === 'advances' || // بعد السلف
                        item.key === 'pendingExpenses' || // بعد الصرفيات المعلقة
                        item.key === 'payroll' || // بعد الرواتب
                        item.key === 'inventory' || // بعد المخزن والمواد
                        item.key === 'admin'; // بعد الإدارة
                    
                    return (
                        <div key={item.key}>
                            <button
                                data-testid={`nav-${item.key}`}
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
                            {needsSeparator && (
                                <div className="my-3 border-t border-blue-400/30 dark:border-gray-600/50" />
                            )}
                        </div>
                    );
                })}
                
                {/* فاصل قبل الأزرار الثابتة */}
                {visibleNavItems.length > 0 && (
                    <div className="my-3 border-t border-blue-400/30 dark:border-gray-600/50" />
                )}
                
                {/* زر الوضع الداكن/الفاتح */}
                <button
                    onClick={toggleDarkMode}
                    data-testid="button-toggle-theme"
                    title={isSidebarCollapsed ? (isDarkMode ? t('lightMode') : t('darkMode')) : ''}
                    className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2" : "text-right p-3"} rounded-xl transition-all duration-200 hover:bg-blue-800/50 dark:hover:bg-gray-700/50 hover:scale-102`}
                >
                    {isDarkMode ? <Sun className={`w-5 h-5 ${!isSidebarCollapsed && "ml-3"}`} /> : <Moon className={`w-5 h-5 ${!isSidebarCollapsed && "ml-3"}`} />}
                    {!isSidebarCollapsed && <span className="text-lg">{isDarkMode ? t("lightMode") : t("darkMode")}</span>}
                </button>
                
                {/* زر تسجيل الخروج */}
                <button
                    onClick={handleLogout}
                    data-testid="button-logout"
                    title={isSidebarCollapsed ? 'تسجيل الخروج' : ''}
                    className={`w-full flex items-center ${isSidebarCollapsed ? "justify-center p-2" : "text-right p-3"} rounded-xl transition-all duration-200 hover:bg-red-600/50 dark:hover:bg-red-700/50 hover:scale-102 text-red-100 hover:text-white`}
                >
                    <LogOut className={`w-5 h-5 ${!isSidebarCollapsed && "ml-3"}`} />
                    {!isSidebarCollapsed && <span className="text-lg">تسجيل الخروج</span>}
                </button>
            </nav>
        </div>
    );
}
