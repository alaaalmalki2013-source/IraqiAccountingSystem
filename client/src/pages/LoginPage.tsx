import { useState } from 'react';
import { Lock, Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginPageProps {
    onLogin: (userType: 'admin' | 'warehouse' | 'cashier') => void;
    settings: {
        adminPassword: string;
        warehousePassword: string;
        cashierPassword: string;
        companyName: string;
    };
}

export default function LoginPage({ onLogin, settings }: LoginPageProps) {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isShaking, setIsShaking] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (password === settings.adminPassword) {
            onLogin('admin');
        } else if (password === settings.warehousePassword) {
            onLogin('warehouse');
        } else if (password === settings.cashierPassword) {
            onLogin('cashier');
        } else {
            setError('كلمة المرور غير صحيحة');
            setIsShaking(true);
            setTimeout(() => setIsShaking(false), 500);
            setPassword('');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4">
            <div className="w-full max-w-md">
                {/* بطاقة تسجيل الدخول */}
                <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-10 border border-gray-100 dark:border-gray-700 ${isShaking ? 'animate-shake' : ''}`}>
                    {/* شعار النظام */}
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-teal-500 to-blue-600 mb-4 shadow-lg">
                            <Lock className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 mb-2">
                            {settings.companyName}
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                            النظام المحاسبي العراقي المتكامل
                        </p>
                    </div>

                    {/* نموذج تسجيل الدخول */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                كلمة المرور
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError('');
                                    }}
                                    className="block w-full pr-10 pl-10 py-3 md:py-4 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-base md:text-lg transition-all duration-200"
                                    placeholder="أدخل كلمة المرور"
                                    autoFocus
                                    data-testid="input-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 left-0 pl-3 flex items-center hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                                    data-testid="button-toggle-password"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* رسالة الخطأ */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl text-sm md:text-base text-center animate-fadeIn" data-testid="text-error">
                                {error}
                            </div>
                        )}

                        {/* زر الدخول */}
                        <button
                            type="submit"
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 md:py-4 text-base md:text-lg font-semibold text-white bg-gradient-to-r from-teal-500 to-blue-600 rounded-xl hover:from-teal-600 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-teal-300 dark:focus:ring-teal-800 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                            data-testid="button-login"
                        >
                            <LogIn className="w-5 h-5" />
                            <span>تسجيل الدخول</span>
                        </button>
                    </form>

                    {/* معلومات إضافية */}
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-center text-xs md:text-sm text-gray-500 dark:text-gray-400">
                            نظام محاسبة متقدم بتقنيات حديثة
                        </p>
                        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-2">
                            V3.0 © 2025
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
                    20%, 40%, 60%, 80% { transform: translateX(10px); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-shake {
                    animation: shake 0.5s;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
            `}</style>
        </div>
    );
}
