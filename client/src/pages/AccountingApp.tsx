// @ts-nocheck
import { AboutPage } from "./about-content";
import { Sidebar } from '../components/Sidebar';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
    Home,
    DollarSign,
    Users,
    Settings,
    Plus,
    X,
    Edit,
    Edit2,
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
    Minimize2,
    Languages,
    FolderOpen,
    Upload,
    FileText,
    Clock,
    XCircle,
    FileImage,
    Shield,
    FileDown,
    Mail,
    Key,
    Scan
} from 'lucide-react';

// استيراد الثوابت والأنواع
import {
    STORAGE_KEY,
    CUSTOM_CATEGORY_COLORS,
    BASE_PERMISSIONS,
    USER_ROLES,
    ROLE_LABELS,
    ROLE_PERMISSIONS,
    ROLE_DESCRIPTIONS,
    defaultSettings,
    defaultDataStructure
} from '../types/accounting';

// استيراد الدوال المساعدة
import {
    generateInvoiceNumber,
    generateBarcode,
    convertArabicToEnglish,
    normalizeTextForSearch,
    formatCurrencyDisplay,
    formatDateDDMMYYYY,
    formatDateTimeDDMMYYYY,
    getDefaultDateTime,
    highlightText,
    exportToCsv,
    getCurrentMonthRange
} from '../utils/accounting';

// استيراد نظام الترجمة
import { useLanguage } from '../contexts/LanguageContext';

// =================================================================
// 2. المكونات الأساسية (UI PRIMITIVES)
// =================================================================

const generateClientSideId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `att_${Math.random().toString(16).slice(2)}_${Date.now()}`;
};

const ensureAttachmentShape = (attachment, fallbackName = 'مرفق') => {
    if (!attachment) {
        return null;
    }

    const dataUrl = attachment.dataUrl || attachment.url || attachment.attachmentUrl || attachment.src || '';
    if (!dataUrl) {
        return null;
    }

    const inferredType = attachment.type || (dataUrl.startsWith('data:') ? dataUrl.slice(5, dataUrl.indexOf(';')) : '');

    return {
        id: attachment.id || generateClientSideId(),
        name: attachment.name || attachment.fileName || fallbackName,
        type: inferredType,
        size: attachment.size || 0,
        dataUrl,
        uploadedAt: attachment.uploadedAt || new Date().toISOString(),
    };
};

const normalizeAttachmentList = (source, fallbackUrl = '', fallbackName = 'مرفق') => {
    if (!source && !fallbackUrl) {
        return [];
    }

    let normalized = [];

    if (Array.isArray(source)) {
        normalized = source
            .map(item => ensureAttachmentShape(item, item?.name || fallbackName))
            .filter(Boolean);
    } else if (source && typeof source === 'object') {
        const ensured = ensureAttachmentShape(source, source?.name || fallbackName);
        if (ensured) {
            normalized = [ensured];
        }
    }

    if (normalized.length === 0 && fallbackUrl) {
        const ensured = ensureAttachmentShape({ dataUrl: fallbackUrl, name: fallbackName });
        if (ensured) {
            normalized = [ensured];
        }
    }

    return normalized;
};

const getPrimaryAttachmentDataUrl = (attachments = []) => {
    if (!Array.isArray(attachments) || attachments.length === 0) {
        return '';
    }

    const primary = attachments.find(att => att && (att.dataUrl || att.url || att.attachmentUrl));
    if (!primary) {
        return '';
    }

    return primary.dataUrl || primary.url || primary.attachmentUrl || '';
};

const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
        resolve(event?.target?.result || '');
    };
    reader.onerror = () => reject(new Error('failed_to_read_file'));
    reader.readAsDataURL(file);
});

const createAttachmentFromFile = async (file) => {
    const dataUrl = await readFileAsDataUrl(file);
    return ensureAttachmentShape({
        id: generateClientSideId(),
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl,
        uploadedAt: new Date().toISOString(),
    });
};

const createAttachmentFromDataUrl = (dataUrl, name = 'مرفق ممسوح') => {
    if (!dataUrl) {
        return null;
    }

    const mimeMatch = dataUrl.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const estimatedSize = Math.round((dataUrl.length * 3) / 4);

    return ensureAttachmentShape({
        id: generateClientSideId(),
        name,
        type: mimeType,
        size: estimatedSize,
        dataUrl,
        uploadedAt: new Date().toISOString(),
    }, name);
};

const isImageAttachment = (attachment) => {
    if (!attachment) {
        return false;
    }
    const type = attachment.type || '';
    const dataUrl = attachment.dataUrl || attachment.url || attachment.attachmentUrl || '';
    return (type && type.startsWith('image')) || /^data:image\//.test(dataUrl);
};

// مكون التنبيه المنبثق
const NotificationToast = React.memo(({ message, type, onClose }) => {
    const isSuccess = type === 'success';
    const bgColor = isSuccess ? 'bg-green-50 dark:bg-green-900' : (type === 'error' ? 'bg-red-50 dark:bg-red-900' : 'bg-amber-50 dark:bg-amber-900');
    const textColor = isSuccess ? 'text-green-800 dark:text-green-200' : (type === 'error' ? 'text-red-800 dark:text-red-200' : 'text-amber-800 dark:text-amber-200');
    const Icon = isSuccess ? CheckCircle : AlertTriangle;

    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); 
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-2xl ${textColor}  flex items-center space-x-3 space-x-reverse transition-transform duration-300 transform translate-x-0 ${bgColor}`}>
            <Icon className="w-5 h-5 md:w-6 md:h-6" />
            <span className="font-semibold">{message}</span>
            <button onClick={onClose} className="flex items-center justify-center p-1 rounded-full hover:bg-black hover:bg-opacity-10 transition">
                <X className="w-4 h-4" />
            </button>
        </div>
    );
});

const ScannerCaptureModal = React.memo(({ isOpen, title, onClose, onCapture, defaultFileName = 'مرفق ممسوح' }) => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const [isInitializing, setIsInitializing] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    const initializeStream = useCallback(async () => {
        if (!isOpen) {
            return;
        }

        setErrorMessage('');
        setIsInitializing(true);

        try {
            if (!navigator.mediaDevices?.getUserMedia) {
                throw new Error('unsupported');
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }
        } catch (error) {
            console.error('Failed to initialize scanner stream', error);
            setErrorMessage('تعذر الوصول إلى الكاميرا. يرجى التأكد من السماح للمتصفح باستخدامها أو جرب جهازًا آخر.');
            stopStream();
        } finally {
            setIsInitializing(false);
        }
    }, [isOpen, stopStream]);

    useEffect(() => {
        if (isOpen) {
            initializeStream();
        }

        return () => {
            stopStream();
        };
    }, [isOpen, initializeStream, stopStream]);

    const handleClose = useCallback(() => {
        stopStream();
        onClose();
    }, [onClose, stopStream]);

    const handleCapture = useCallback(async () => {
        if (!videoRef.current) {
            return;
        }

        try {
            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;
            canvas.width = width;
            canvas.height = height;
            const context = canvas.getContext('2d');
            context.drawImage(video, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
            const attachment = createAttachmentFromDataUrl(dataUrl, defaultFileName);

            if (attachment && typeof onCapture === 'function') {
                onCapture(attachment);
            }

            handleClose();
        } catch (error) {
            console.error('Failed to capture scanner frame', error);
            setErrorMessage('حدث خطأ أثناء التقاط الصورة. يرجى المحاولة مرة أخرى.');
        }
    }, [defaultFileName, handleClose, onCapture]);

    if (!isOpen) {
        return null;
    }

    return (
        <Modal title={title || 'مسح المستند عبر السكنر'} onClose={handleClose} size="xl">
            <div className="space-y-4">
                {errorMessage && (
                    <div className="p-3 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-200 text-sm font-semibold">
                        {errorMessage}
                    </div>
                )}

                <div className="relative rounded-2xl overflow-hidden bg-black">
                    <video
                        ref={videoRef}
                        playsInline
                        autoPlay
                        muted
                        className="w-full h-full object-contain max-h-[60vh]"
                    />
                    {isInitializing && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 text-white text-sm">
                            جاري تهيئة الكاميرا...
                        </div>
                    )}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        وجّه المستند أمام الكاميرا ثم اضغط زر المسح لحفظه كصورة ضمن المرفقات.
                    </p>
                    <button
                        type="button"
                        onClick={handleCapture}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-lg transition"
                        disabled={isInitializing}
                    >
                        <Scan className="w-5 h-5" />
                        مسح المستند الآن
                    </button>
                </div>
            </div>
        </Modal>
    );
});

// حقل إدخال موحد
const InputField = React.memo(({ label, type = 'text', value, onChange, placeholder, required = false, currency = false, children, inputKey = label, readOnly = false, textarea = false, onBlur, className = '' }) => {
    const fieldRef = React.useRef(null);

    React.useEffect(() => {
        if (required && value !== undefined && value !== null && value !== '') {
            fieldRef.current?.setCustomValidity('');
        }
    }, [value, required]);

    return (
        <div className="flex flex-col space-y-1 text-right">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <div className="relative">
                {textarea ? (
                    <textarea
                        ref={fieldRef}
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
                        ref={fieldRef}
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
    );
});

const FILTER_CARD_THEMES = {
    teal: {
        bg: 'bg-teal-50 dark:bg-teal-900/30',
        activeBg: 'bg-teal-100 dark:bg-teal-900/50',
        text: 'text-teal-800 dark:text-teal-200',
        activeText: 'text-teal-900 dark:text-teal-100',
        border: 'border-teal-400 dark:border-teal-500',
        iconBg: 'bg-white/50 dark:bg-black/30'
    },
    rose: {
        bg: 'bg-rose-50 dark:bg-rose-900/30',
        activeBg: 'bg-rose-100 dark:bg-rose-900/50',
        text: 'text-rose-800 dark:text-rose-200',
        activeText: 'text-rose-900 dark:text-rose-100',
        border: 'border-rose-400 dark:border-rose-500',
        iconBg: 'bg-white/50 dark:bg-black/30'
    },
    purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/30',
        activeBg: 'bg-purple-100 dark:bg-purple-900/50',
        text: 'text-purple-800 dark:text-purple-200',
        activeText: 'text-purple-900 dark:text-purple-100',
        border: 'border-purple-400 dark:border-purple-500',
        iconBg: 'bg-white/50 dark:bg-black/30'
    },
    amber: {
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        activeBg: 'bg-amber-100 dark:bg-amber-900/50',
        text: 'text-amber-800 dark:text-amber-200',
        activeText: 'text-amber-900 dark:text-amber-100',
        border: 'border-amber-400 dark:border-amber-500',
        iconBg: 'bg-white/60 dark:bg-black/20'
    },
    orange: {
        bg: 'bg-orange-50 dark:bg-orange-900/30',
        activeBg: 'bg-orange-100 dark:bg-orange-900/50',
        text: 'text-orange-800 dark:text-orange-200',
        activeText: 'text-orange-900 dark:text-orange-100',
        border: 'border-orange-400 dark:border-orange-500',
        iconBg: 'bg-white/50 dark:bg-black/30'
    },
    emerald: {
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        activeBg: 'bg-emerald-100 dark:bg-emerald-900/50',
        text: 'text-emerald-800 dark:text-emerald-200',
        activeText: 'text-emerald-900 dark:text-emerald-100',
        border: 'border-emerald-400 dark:border-emerald-500',
        iconBg: 'bg-white/50 dark:bg-black/30'
    },
    slate: {
        bg: 'bg-slate-50 dark:bg-slate-800/40',
        activeBg: 'bg-slate-100 dark:bg-slate-800/60',
        text: 'text-slate-700 dark:text-slate-200',
        activeText: 'text-slate-900 dark:text-slate-100',
        border: 'border-slate-400 dark:border-slate-500',
        iconBg: 'bg-white/40 dark:bg-black/20'
    },
    blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        activeBg: 'bg-blue-100 dark:bg-blue-900/50',
        text: 'text-blue-800 dark:text-blue-200',
        activeText: 'text-blue-900 dark:text-blue-100',
        border: 'border-blue-400 dark:border-blue-500',
        iconBg: 'bg-white/50 dark:bg-black/30'
    },
    gray: {
        bg: 'bg-gray-50 dark:bg-gray-800/40',
        activeBg: 'bg-gray-100 dark:bg-gray-800/60',
        text: 'text-gray-700 dark:text-gray-200',
        activeText: 'text-gray-900 dark:text-white',
        border: 'border-gray-300 dark:border-gray-500',
        iconBg: 'bg-white/40 dark:bg-black/20'
    }
};

const DEBT_TYPES = {
    MANUAL: 'manual',
    INVENTORY: 'inventoryCredit',
};

const DEBT_TYPE_LABELS = {
    [DEBT_TYPES.MANUAL]: 'الديون السابقة',
    [DEBT_TYPES.INVENTORY]: 'فواتير آجلة',
};

const mergeFilterThemes = (baseTheme, customTheme) => {
    if (!customTheme) {
        return baseTheme;
    }

    const mergeClasses = (baseValue, customValue) => {
        if (!customValue) {
            return baseValue;
        }
        return `${baseValue} ${customValue}`;
    };

    return {
        ...baseTheme,
        bg: mergeClasses(baseTheme.bg, customTheme.bg),
        activeBg: mergeClasses(baseTheme.activeBg, customTheme.bg),
        text: mergeClasses(baseTheme.text, customTheme.text),
        activeText: mergeClasses(baseTheme.activeText, customTheme.text),
        border: mergeClasses(baseTheme.border, customTheme.border),
    };
};

const FilterStatCard = React.memo(({
    title,
    value,
    subtitle,
    meta,
    icon: Icon,
    onClick,
    active = false,
    themeKey = 'teal',
    customTheme = null,
    size = 'sm',
    dataTestId,
    disabled = false
}) => {
    const baseTheme = FILTER_CARD_THEMES[themeKey] || FILTER_CARD_THEMES.gray;
    const theme = mergeFilterThemes(baseTheme, customTheme);

    const padding = size === 'md' ? 'p-5' : 'p-4';
    const valueSize = size === 'md' ? 'text-2xl' : 'text-xl';
    const titleSize = size === 'md' ? 'text-sm' : 'text-xs';
    const subtitleSize = size === 'md' ? 'text-sm' : 'text-xs';
    const metaSize = size === 'md' ? 'text-xs' : 'text-[11px]';
    const iconPadding = size === 'md' ? 'p-3' : 'p-2';
    const iconSize = size === 'md' ? 'w-6 h-6' : 'w-5 h-5';

    const cardClasses = [
        'relative overflow-hidden rounded-2xl transition-all duration-300 flex flex-col justify-between text-right',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        active ? 'border-4 shadow-2xl scale-[1.01]' : 'border-2 shadow-md hover:-translate-y-1 hover:shadow-lg',
        theme.border,
        active ? theme.activeBg : theme.bg,
        active ? theme.activeText : theme.text,
        padding
    ].filter(Boolean).join(' ');

    const contentTextClass = active ? theme.activeText : theme.text;

    return (
        <div
            className={cardClasses}
            onClick={disabled ? undefined : onClick}
            data-testid={dataTestId}
        >
            <div className="flex items-center justify-between gap-3">
                <div className={`flex-1 space-y-1 ${contentTextClass}`}>
                    <p className={`${titleSize} font-semibold leading-tight`}>{title}</p>
                    {value !== undefined && (
                        <p className={`font-extrabold ${valueSize}`}>{value}</p>
                    )}
                    {subtitle && (
                        <p className={`${subtitleSize} font-medium`}>{subtitle}</p>
                    )}
                </div>
                {Icon && (
                    <div className={`flex items-center justify-center rounded-xl ${theme.iconBg} ${contentTextClass} ${iconPadding}`}>
                        <Icon className={`${iconSize} text-current`} />
                    </div>
                )}
            </div>
            {meta && (
                <p className={`${metaSize} font-medium mt-3 ${contentTextClass}`}>{meta}</p>
            )}
        </div>
    );
});

const PAGE_SIZE_OPTIONS = [50, 100, 200, 'all'];
const DEFAULT_PAGE_SIZE = 100;

const usePagination = (items, defaultPageSize = DEFAULT_PAGE_SIZE) => {
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [currentPage, setCurrentPage] = useState(1);

    const safeItems = Array.isArray(items) ? items : [];
    const totalItems = safeItems.length;
    const resolvedPageSize = pageSize === 'all' ? (totalItems || defaultPageSize) : pageSize;
    const totalPages = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(totalItems / resolvedPageSize));

    useEffect(() => {
        setCurrentPage(prev => {
            const nextPage = Math.min(prev, Math.max(totalPages, 1));
            return nextPage || 1;
        });
    }, [totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [totalItems]);

    const paginatedItems = useMemo(() => {
        if (pageSize === 'all') {
            return safeItems;
        }
        const start = (currentPage - 1) * resolvedPageSize;
        return safeItems.slice(start, start + resolvedPageSize);
    }, [safeItems, pageSize, currentPage, resolvedPageSize]);

    const changePageSize = useCallback((size) => {
        setPageSize(size === 'all' ? 'all' : Number(size));
        setCurrentPage(1);
    }, []);

    const goToPage = useCallback((page) => {
        setCurrentPage(prev => {
            const nextPage = Math.min(Math.max(page, 1), Math.max(totalPages, 1));
            return nextPage;
        });
    }, [totalPages]);

    return {
        paginatedItems,
        totalItems,
        pageSize,
        currentPage,
        totalPages,
        changePageSize,
        goToPage,
    };
};

const PaginationControls = React.memo(({ pageSize, onPageSizeChange, currentPage, totalPages, onPageChange, totalItems }) => {
    const normalizedPageSize = pageSize === 'all' ? 'all' : Number(pageSize);

    return (
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <span>عرض</span>
                <select
                    value={normalizedPageSize}
                    onChange={(e) => onPageSizeChange(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 focus:ring-teal-500 focus:border-teal-500"
                >
                    {PAGE_SIZE_OPTIONS.map(option => (
                        <option key={option} value={option === 'all' ? 'all' : option}>
                            {option === 'all' ? 'الكل' : option}
                        </option>
                    ))}
                </select>
                <span>سجل لكل صفحة</span>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1 || totalPages <= 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                </button>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                    صفحة {Math.min(currentPage, Math.max(totalPages, 1))} من {Math.max(totalPages, 1)}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages || totalPages <= 1}
                    className="flex items-center gap-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    التالي
                    <ChevronLeft className="w-4 h-4" />
                </button>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 text-right lg:text-left">
                إجمالي السجلات: {totalItems}
            </div>
        </div>
    );
});

// زر الإجراءات
const ActionButton = ({ onClick, children, className = '', type = 'button', disabled = false }) => (
    <button
        onClick={onClick}
        type={type}
        disabled={disabled}
        className={`px-6 py-3 rounded-xl shadow-lg transition duration-200 flex items-center justify-center space-x-2 space-x-reverse font-semibold text-white bg-teal-600 hover:bg-teal-700 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`.trim()}
    >
        {children}
    </button>
);

// نافذة المودال
const Modal = ({ title, children, onClose, size = 'lg', isPrintModal = false }) => {
	const sizeClass = size === 'sm'
		? 'max-w-sm md:max-w-md'
		: size === 'md'
			? 'max-w-lg'
			: size === 'lg'
				? 'max-w-md md:max-w-xl'
				: size === 'xl'
					? 'max-w-3xl'
					: size === '2xl'
						? 'max-w-5xl'
						: size === 'full'
							? 'max-w-6xl'
							: 'max-w-4xl';

	return (
		<div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
			<div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100
				${sizeClass}
				${isPrintModal ? 'bg-white/90 dark:bg-gray-800/90 backdrop-filter backdrop-blur-sm' : ''}
			`} onClick={e => e.stopPropagation()}>
				<div className="flex justify_between items-center p-4 border-b border-teal-100 dark:border-teal-700 bg-teal-50 dark:bg-teal-900/30 rounded-t-3xl">
					<h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 flex-grow text-center">{title}</h3>
					<button onClick={onClose} className="flex items-center justify-center text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition p-1 bg-white dark:bg-gray-700 rounded-full">
						<X className="w-5 h-5 md:w-6 md:h-6" />
					</button>
				</div>
				<div className="p-6">
					{children}
				</div>
			</div>
		</div>
	);
};

// مكون طباعة الفاتورة الفردية
const PrintInvoice = React.memo(({ item, onClose, companyName, companyLogoUrl, employees }) => {
    const [paperSize, setPaperSize] = useState('80mm');


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
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">قياس الورق:</label>
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
            
            <div id="print-invoice-content" className="p-4 print:p-0 print:block bg-gray-50 dark:bg-gray-700 rounded-xl" style={invoiceStyle}>
                <div className="invoice-container bg-white p-4 rounded-lg" style={{ color: "#000" }}>
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
                                التاريخ والوقت: <span style={{ fontWeight: 'bold' }}>{formatDateTimeDDMMYYYY(item.date)}</span>
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
                                <td style={{ border: '1px solid #ccc', padding: '6px', textAlign: 'right', fontSize: '18px', color: '#B45309' }}>{formatCurrencyDisplay(item.amount)}</td>
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
    
    const handlePrint = () => {
        window.print();
        onClose();
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
            <div id="print-report-content" className="p-0 max-w-full mx-auto bg-gray-50 dark:bg-gray-700 rounded-xl p-4" style={{ fontSize: '10pt', fontFamily: 'sans-serif' }}>
                
                {/* تم تعديل الـ CSS ليتناسب مع العرض داخل المودال */}
                <style>{`
                    .report-table th, .report-table td { border: 1px solid #ddd; padding: 6px; font-size: 10pt; }
                    .report-table th { background-color: #f2f2f2; }
                `}</style>
                
                <div className="report-header text-center mb-5 bg-white p-4 rounded-lg">
                    {companyLogoUrl && <img src={companyLogoUrl} alt="Logo" style={{ maxHeight: '60px', margin: '0 auto 10px' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                    <h1 className="text-2xl font-bold" style={{ color: "#000" }}>{companyName}</h1>
                    <h2 className="text-xl font-semibold mt-1" style={{ color: "#000" }}>تقرير {title} المفصل</h2>
                    <p className="text-sm" style={{ color: "#333" }}>تاريخ التقرير: {formatDateDDMMYYYY(new Date())}</p>
                </div>

                <div className="mb-4">
                    <p className="text-lg font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">إجمالي المبلغ في التقرير: {formatCurrencyDisplay(totalAmount)}</p>
                    <p className="text-sm">عدد السجلات: {reportData.length}</p>
                </div>

                <div className="overflow-x-auto bg-white p-4 rounded-lg">
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
                <p className="text-center text-xs mt-10 text-gray-700 dark:text-gray-300">--- نهاية التقرير ---</p>
            </div>
        </Modal>
    );
});

/**
 * 3.1. Dashboard Component
 */
const DashboardComponent = React.memo(({ data, upcomingBirthdays }) => {
    const { revenues, expenses, suspended, advances, employees, payroll } = data;
    const { t } = useLanguage();

    const currentYear = useMemo(() => new Date().getFullYear(), []);
    const currentMonth = useMemo(() => new Date().getMonth() + 1, []);
    const initialRange = useMemo(() => getCurrentMonthRange(), []);
    const [filterDateFrom, setFilterDateFrom] = useState(initialRange.start);
    const [filterDateTo, setFilterDateTo] = useState(initialRange.end);
    const [selectedMonth, setSelectedMonth] = useState(() => String(currentMonth));
    const [selectedYear, setSelectedYear] = useState(() => String(currentYear));

    const monthOptions = useMemo(() => {
        const names = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const base = names.map((name, index) => ({
            value: String(index + 1),
            label: `${String(index + 1).padStart(2, '0')} - ${name}`
        }));
        return [
            { value: 'all', label: 'كل الأشهر' },
            ...base,
            { value: 'custom', label: 'نطاق مخصص' }
        ];
    }, []);

    const getRecordDate = useCallback((record) => {
        if (!record) return null;
        const candidate = record.date || record.createdAt || record.entryDate || record.dispatchedAt || record.updatedAt;
        if (!candidate) return null;

        if (typeof candidate === 'string') {
            if (candidate.length >= 10) {
                return candidate.slice(0, 10);
            }
            const parsed = new Date(candidate);
            return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
        }

        if (candidate instanceof Date) {
            return candidate.toISOString().slice(0, 10);
        }

        const parsed = new Date(candidate);
        return isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
    }, []);

    const yearOptions = useMemo(() => {
        const years = new Set();
        const registerYears = (list) => {
            (list || []).forEach(item => {
                const dateValue = getRecordDate(item);
                if (dateValue) {
                    years.add(dateValue.slice(0, 4));
                }
            });
        };

        registerYears(revenues);
        registerYears(expenses);
        registerYears(advances);
        registerYears(suspended);

        (payroll || []).forEach(item => {
            if (item?.year) {
                years.add(String(item.year));
            }
        });

        years.add(String(currentYear));

        return Array.from(years)
            .filter(Boolean)
            .sort((a, b) => parseInt(b, 10) - parseInt(a, 10));
    }, [revenues, expenses, advances, suspended, payroll, getRecordDate, currentYear]);

    const isDateWithinSelectedRange = useCallback((startDate, endDate = startDate) => {
        if (!filterDateFrom && !filterDateTo) {
            return true;
        }

        if (!startDate && !endDate) {
            return false;
        }

        const effectiveStart = startDate || endDate;
        const effectiveEnd = endDate || startDate;

        if (filterDateFrom && effectiveEnd < filterDateFrom) {
            return false;
        }

        if (filterDateTo && effectiveStart > filterDateTo) {
            return false;
        }

        return true;
    }, [filterDateFrom, filterDateTo]);

    const filterRecordsByDate = useCallback((records) => {
        if (!Array.isArray(records)) {
            return [];
        }

        return records.filter(record => {
            const isoDate = getRecordDate(record);
            return isDateWithinSelectedRange(isoDate, isoDate);
        });
    }, [getRecordDate, isDateWithinSelectedRange]);

    const filteredRevenues = useMemo(() => filterRecordsByDate(revenues), [revenues, filterRecordsByDate]);
    const filteredExpenses = useMemo(() => filterRecordsByDate(expenses), [expenses, filterRecordsByDate]);
    const filteredAdvances = useMemo(() => filterRecordsByDate(advances), [advances, filterRecordsByDate]);
    const filteredSuspended = useMemo(() => filterRecordsByDate(suspended), [suspended, filterRecordsByDate]);

    const filteredPayroll = useMemo(() => {
        if (!Array.isArray(payroll)) {
            return [];
        }

        return payroll.filter(record => {
            const monthNumber = parseInt(record?.month, 10);
            const yearNumber = parseInt(record?.year, 10);

            if (!monthNumber || !yearNumber) {
                return !filterDateFrom && !filterDateTo;
            }

            const start = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-01`;
            const endDay = new Date(yearNumber, monthNumber, 0).getDate();
            const end = `${yearNumber}-${String(monthNumber).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;

            return isDateWithinSelectedRange(start, end);
        });
    }, [payroll, filterDateFrom, filterDateTo, isDateWithinSelectedRange]);

    const updateRangeForSelection = useCallback((monthValue, yearValue) => {
        if (monthValue === 'custom') {
            return;
        }

        if (!monthValue && !yearValue) {
            setFilterDateFrom('');
            setFilterDateTo('');
            return;
        }

        const parsedYear = yearValue ? parseInt(yearValue, 10) : null;

        if (monthValue === 'all') {
            if (parsedYear) {
                setFilterDateFrom(`${parsedYear}-01-01`);
                setFilterDateTo(`${parsedYear}-12-31`);
            } else {
                setFilterDateFrom('');
                setFilterDateTo('');
            }
            return;
        }

        if (monthValue) {
            const monthNumber = parseInt(monthValue, 10);
            if (Number.isFinite(monthNumber)) {
                const effectiveYear = parsedYear ?? currentYear;
                const start = `${effectiveYear}-${String(monthNumber).padStart(2, '0')}-01`;
                const endDay = new Date(effectiveYear, monthNumber, 0).getDate();
                const end = `${effectiveYear}-${String(monthNumber).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`;
                setFilterDateFrom(start);
                setFilterDateTo(end);
            }
        } else if (parsedYear) {
            setFilterDateFrom(`${parsedYear}-01-01`);
            setFilterDateTo(`${parsedYear}-12-31`);
        }
    }, [currentYear]);

    const handleMonthSelect = useCallback((value) => {
        setSelectedMonth(value);

        if (value === 'custom') {
            return;
        }

        if (value === 'all') {
            updateRangeForSelection(value, selectedYear);
            return;
        }

        if (!selectedYear) {
            const fallbackYear = String(currentYear);
            setSelectedYear(fallbackYear);
            updateRangeForSelection(value, fallbackYear);
        } else {
            updateRangeForSelection(value, selectedYear);
        }
    }, [selectedYear, updateRangeForSelection, currentYear]);

    const handleYearSelect = useCallback((value) => {
        setSelectedYear(value);

        if (!value) {
            if (selectedMonth === 'all') {
                setFilterDateFrom('');
                setFilterDateTo('');
            }
            return;
        }

        if (selectedMonth !== 'custom') {
            updateRangeForSelection(selectedMonth, value);
        }
    }, [selectedMonth, updateRangeForSelection]);

    const handleDateFromChange = useCallback((value) => {
        setFilterDateFrom(value);

        if (!value && !filterDateTo) {
            setSelectedMonth('all');
            setSelectedYear('');
            return;
        }

        setSelectedMonth('custom');
    }, [filterDateTo]);

    const handleDateToChange = useCallback((value) => {
        setFilterDateTo(value);

        if (!value && !filterDateFrom) {
            setSelectedMonth('all');
            setSelectedYear('');
            return;
        }

        setSelectedMonth('custom');
    }, [filterDateFrom]);

    const handleResetToCurrent = useCallback(() => {
        setSelectedMonth(String(currentMonth));
        setSelectedYear(String(currentYear));
        setFilterDateFrom(initialRange.start);
        setFilterDateTo(initialRange.end);
    }, [currentMonth, currentYear, initialRange.start, initialRange.end]);

    const handleShowAll = useCallback(() => {
        setSelectedMonth('all');
        setSelectedYear('');
        setFilterDateFrom('');
        setFilterDateTo('');
    }, []);

    // استخدام useMemo لضمان عدم إعادة الحساب إلا عند الضرورة
    const summaryData = useMemo(() => {
        const totalRevenues = filteredRevenues.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalAdvances = filteredAdvances.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalSuspended = filteredSuspended.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
        const totalSalaries = employees.reduce((sum, emp) => sum + parseFloat(emp.salary || 0), 0);


        // تجميع الإيرادات حسب الفئة
        const revenueByCategory = filteredRevenues.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + (parseFloat(item.amount) || 0);
            return acc;
        }, {});

        // تجميع الصرفيات حسب الفئة
        const expenseByCategory = filteredExpenses.reduce((acc, item) => {
            acc[item.category] = (acc[item.category] || 0) + (parseFloat(item.amount) || 0);
            return acc;
        }, {});


        // حساب مجموع الرواتب المدفوعة
        const totalPaidSalaries = filteredPayroll.length > 0 ? filteredPayroll.reduce((sum, payrollRecord) => {
            if (!payrollRecord.isPaid) return sum;

            // إيجاد الموظف المرتبط بسجل الرواتب
            const employee = employees.find(emp => emp.id === payrollRecord.employeeId);
            if (!employee) return sum;

            const baseSalary = parseFloat(employee.salary) || 0;
            let bonuses = 0;
            let deductions = 0;
            let absenceAmount = 0;
            let overtimeAmount = 0;

            // حساب التعديلات
            if (payrollRecord.adjustments) {
                payrollRecord.adjustments.forEach(adj => {
                    const amount = parseFloat(adj.amount) || 0;
                    if (adj.type === 'bonus') bonuses += amount;
                    if (adj.type === 'deduction') deductions += amount;
                    if (adj.type === 'absence') absenceAmount += amount;
                    if (adj.type === 'overtime') overtimeAmount += amount;
                });
            }

            // حساب الراتب الإجمالي (قبل خصم السلف)
            // ملاحظة: السلف تُخصم بشكل منفصل في معادلة رصيد الصندوق
            const grossSalary = baseSalary + bonuses + overtimeAmount - deductions - absenceAmount;

            return sum + grossSalary;
        }, 0) : 0;

        // حساب الصندوق: الإيرادات - (المصروفات + السلف + المعلقة + الرواتب المدفوعة)
        const totalCashFund = totalRevenues - (totalExpenses + totalAdvances + totalSuspended + totalPaidSalaries);

        return {
            totalRevenues,
            totalExpenses,
            totalAdvances,
            totalSuspended,
            totalSalaries,
            totalPaidSalaries,
            totalCashFund,
            revenueByCategory,
            expenseByCategory
        };
    }, [filteredRevenues, filteredExpenses, filteredAdvances, filteredSuspended, employees, filteredPayroll]);

    const primaryCards = [
        { 
            title: t('totalRevenues'), 
            value: formatCurrencyDisplay(summaryData.totalRevenues), 
            icon: TrendingUp, 
            color: 'text-emerald-600 dark:text-emerald-400', 
            bg: 'bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-950/50 dark:to-emerald-900/50',
            iconBg: 'bg-emerald-500/20 dark:bg-emerald-500/30',
            gradient: true
        },
        { 
            title: t('totalExpenses'), 
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
            title: t('totalAdvances'), 
            value: formatCurrencyDisplay(summaryData.totalAdvances), 
            icon: Coins, 
            color: 'text-violet-600 dark:text-violet-400', 
            bg: 'bg-gradient-to-br from-violet-100 to-violet-200 dark:from-violet-950/50 dark:to-violet-900/50',
            iconBg: 'bg-violet-500/20 dark:bg-violet-500/30',
            gradient: true
        },
        { 
            title: t('totalSuspended'), 
            value: formatCurrencyDisplay(summaryData.totalSuspended), 
            icon: RotateCcw, 
            color: 'text-amber-600 dark:text-amber-400', 
            bg: 'bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-950/50 dark:to-amber-900/50',
            iconBg: 'bg-amber-500/20 dark:bg-amber-500/30',
            gradient: true
        },
        { 
            title: t('totalSalaries'), 
            value: formatCurrencyDisplay(summaryData.totalSalaries), 
            icon: Users, 
            color: 'text-purple-600 dark:text-purple-400', 
            bg: 'bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/50 dark:to-purple-900/50',
            iconBg: 'bg-purple-500/20 dark:bg-purple-500/30',
            gradient: true
        },
        { 
            title: t('totalPaidSalaries'), 
            value: formatCurrencyDisplay(summaryData.totalPaidSalaries), 
            icon: Calculator, 
            color: 'text-teal-600 dark:text-teal-400', 
            bg: 'bg-gradient-to-br from-teal-100 to-teal-200 dark:from-teal-950/50 dark:to-teal-900/50',
            iconBg: 'bg-teal-500/20 dark:bg-teal-500/30',
            gradient: true
        },
    ];


    return (
        <div className="space-y-8 p-8 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700">
            <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent border-b-2 border-blue-500 dark:border-blue-400 pb-3">{ t("dashboard") }</h2>

            <div className="bg-white/90 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-3xl shadow-xl p-6">
                <div className="flex flex-col xl:flex-row gap-4 xl:items-end justify-between">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1">
                        <div className="flex flex-col text-right">
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">من تاريخ</label>
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => handleDateFromChange(e.target.value)}
                                className="w-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col text-right">
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">إلى تاريخ</label>
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => handleDateToChange(e.target.value)}
                                className="w-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex flex-col text-right">
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">اختر الشهر</label>
                            <select
                                value={selectedMonth}
                                onChange={(e) => handleMonthSelect(e.target.value)}
                                className="w-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                {monthOptions.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col text-right">
                            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1">اختر السنة</label>
                            <select
                                value={selectedYear}
                                onChange={(e) => handleYearSelect(e.target.value)}
                                className="w-full rounded-2xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">اختر السنة</option>
                                {yearOptions.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 justify-end w-full xl:w-auto">
                        <button
                            onClick={handleResetToCurrent}
                            className="inline-flex items-center justify-center rounded-2xl bg-blue-500 text-white px-5 py-2.5 text-sm font-semibold shadow-lg hover:bg-blue-600 transition-colors"
                        >
                            <CalendarCheck className="w-4 h-4 ml-2" />
                            شهر حالي
                        </button>
                        <button
                            onClick={handleShowAll}
                            className="inline-flex items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 px-5 py-2.5 text-sm font-semibold shadow-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <RotateCcw className="w-4 h-4 ml-2" />
                            إظهار الكل
                        </button>
                    </div>
                </div>
                {(filterDateFrom || filterDateTo) && (
                    <div className="mt-4 text-right text-sm text-blue-700 dark:text-blue-300">
                        <span>النطاق الحالي: {filterDateFrom || 'غير محدد'} → {filterDateTo || 'غير محدد'}</span>
                    </div>
                )}
            </div>

            {upcomingBirthdays.length > 0 && (
                <div className="bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-950/50 dark:to-rose-950/50 border-l-4 border-pink-500 dark:border-pink-400 p-6 rounded-2xl shadow-xl">
                    <h3 className="text-2xl font-bold text-pink-800 dark:text-pink-200 flex items-center mb-2">
                        <Gift className="w-6 h-6 ml-2" />
                        { t("upcomingBirthdaysReminder") }
                    </h3>
                    <ul className="list-disc list-inside space-y-1 text-gray-700 dark:text-gray-300">
                        {upcomingBirthdays.map((b, index) => (
                            <li key={index} className="font-semibold">
                                {t("employee")} **{b.name}** {t("birthdayOn")} **{b.date}**.
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 border-b-2 border-gradient-to-r from-blue-500 to-purple-500 pb-2">{ t("financialSummary") }</h3>
            
            {/* البطاقات المالية - بطاقات مستطيلة أفقية */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. رصيد الصندوق */}
                <div className="p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border dark:border-gray-200/10 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-950/50 dark:to-blue-900/50">
                    <div className="flex items-center gap-4">
                        <div className="p-4 rounded-xl shadow-lg bg-blue-500/20 dark:bg-blue-500/30 flex-shrink-0">
                            <DollarSign className={`w-8 h-8 ${summaryData.totalCashFund >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">{ t("currentCashFund") }</p>
                            <p className={`text-3xl font-extrabold truncate ${summaryData.totalCashFund >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-rose-700 dark:text-rose-300'}`}>
                                {formatCurrencyDisplay(summaryData.totalCashFund)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2-3. الإيرادات والصرفيات */}
                {primaryCards.map((card, index) => (
                    <div key={index} className={`p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border dark:border-gray-200/10 ${card.bg}`}>
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-xl shadow-lg ${card.iconBg} flex-shrink-0`}>
                                <card.icon className={`w-8 h-8 ${card.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">{card.title}</p>
                                <p className={`text-3xl font-extrabold truncate ${card.color}`}>{card.value}</p>
                            </div>
                        </div>
                    </div>
                ))}

                {/* 4-7. باقي البطاقات */}
                {secondaryCards.map((card, index) => {
                    const CardIcon = card.icon;
                    return (
                        <div key={index} className={`p-5 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border dark:border-gray-200/10 ${card.bg}`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-4 rounded-xl shadow-lg ${card.iconBg} flex-shrink-0`}>
                                    <CardIcon className={`w-8 h-8 ${card.color}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-bold text-gray-700 dark:text-gray-300 mb-1">{card.title}</p>
                                    <p className={`text-3xl font-extrabold truncate ${card.color}`}>{card.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 border-b border-gray-300 dark:border-gray-600 pb-2 pt-4">{ t("categoryStatistics") }</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* كروت الإيرادات حسب الفئة */}
                <div className="p-6 rounded-2xl shadow-xl bg-gradient-to-br from-emerald-50 to-green-100 dark:from-emerald-950/50 dark:to-green-900/50 border-l-4 border-emerald-500 dark:border-emerald-400">
                    <h4 className="text-xl font-bold text-emerald-700 dark:text-emerald-300 mb-4 flex items-center">
                        <TrendingUp className="w-5 h-5 ml-2" />
                        { t("revenuesByCategory") }
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
                        { t("expensesByCategory") }
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
    setIsReportModalOpen, showToast, initialExpenseState, handleRefresh, setInitialExpenseState,
    openScanner,
}) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    
    const initialRange = useMemo(() => getCurrentMonthRange(), []);
    const [filterDateFrom, setFilterDateFrom] = useState(initialRange.start);
    const [filterDateTo, setFilterDateTo] = useState(initialRange.end);
    const [filterCategory, setFilterCategory] = useState('الكل');
    const [globalSearch, setGlobalSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('active'); // فلتر الحالة: active, cancelled, all
    const isSearchActive = useMemo(() => globalSearch.trim().length > 0, [globalSearch]);
    const emptyStateColSpan = useMemo(() => {
        const base = 2; // التاريخ + الإجراءات
        const vendorColumn = collectionName === 'expenses' ? 1 : 0;
        const invoiceColumn = collectionName !== 'revenues' ? 1 : 0;
        const attachmentsColumn = collectionName === 'expenses' ? 1 : 0;
        return fields.length + base + vendorColumn + invoiceColumn + attachmentsColumn;
    }, [fields.length, collectionName]);
    
    // دالة تهيئة النماذج لتبسيط useEffect
    const getInitialFormState = useCallback((item = null, initialDispatch = null) => {
        const defaultForm = fields.reduce((acc, field) => ({ ...acc, [field.key]: field.defaultValue || '' }), {});

        let baseState = item ? item : {
            ...defaultForm,
            date: getDefaultDateTime(),
            employeeId: collectionName === 'advances' ? data.employees[0]?.id || '' : '',
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
                linkedDebtId: initialDispatch.linkedDebtId,
                linkedDebtPaymentId: initialDispatch.linkedDebtPaymentId,
            };
        }

        const baseId = item?.id || initialDispatch?.id || baseState?.id || null;

        if (collectionName === 'expenses') {
            const attachments = normalizeAttachmentList(
                item?.attachments || initialDispatch?.attachments,
                item?.invoiceImageUrl || initialDispatch?.invoiceImageUrl,
                'مرفق'
            );

            baseState = {
                ...baseState,
                attachments,
                invoiceImageUrl: getPrimaryAttachmentDataUrl(attachments) || baseState.invoiceImageUrl || '',
            };
        } else {
            baseState = {
                ...baseState,
                attachments: normalizeAttachmentList(item?.attachments, item?.invoiceImageUrl, 'مرفق'),
            };
        }

        return {
            ...baseState,
            id: baseId,
        };
    }, [fields, collectionName, data.employees]);

    const [formState, setFormState] = useState(() => getInitialFormState(currentItem, initialExpenseState));
    const [selectedVendor, setSelectedVendor] = useState(collectionName === 'expenses' && formState.vendor ? formState.vendor : '');
    const attachmentsList = Array.isArray(formState.attachments) ? formState.attachments : [];
    const [previewAttachment, setPreviewAttachment] = useState(null);
    const [previewZoomed, setPreviewZoomed] = useState(false);
    const scannerAvailable = typeof openScanner === 'function';

    useEffect(() => {
        if (previewAttachment) {
            setPreviewZoomed(false);
        }
    }, [previewAttachment]);

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
    const dateScopedCategorySource = useMemo(() => {
        if (collectionName === 'suspended') {
            return [];
        }

        const sourceList = Array.isArray(data[collectionName]) ? data[collectionName] : [];

        return sourceList.filter(item => {
            if (!item?.date) {
                // في حال عدم توفر تاريخ للسجل، يتم تضمينه فقط عندما لا يكون هناك فلتر تاريخ محدد
                return !filterDateFrom && !filterDateTo;
            }

            const rawDate = typeof item.date === 'string'
                ? item.date
                : new Date(item.date).toISOString();
            const itemDate = rawDate.slice(0, 10);

            if (filterDateFrom && itemDate < filterDateFrom) {
                return false;
            }

            if (filterDateTo && itemDate > filterDateTo) {
                return false;
            }

            return true;
        });
    }, [data, collectionName, filterDateFrom, filterDateTo]);

    const categoryTotals = useMemo(() => {
        if (dateScopedCategorySource.length === 0) {
            return [];
        }

        const totals = dateScopedCategorySource.reduce((acc, item) => {
            const category = item.category || 'غير مصنف';
            acc[category] = (acc[category] || 0) + (parseFloat(item.amount) || 0);
            return acc;
        }, {} as Record<string, number>);

        return Object.keys(totals).map(category => ({
            category,
            total: totals[category],
            color: type === 'revenue' ? 'green' : 'red'
        }));
    }, [dateScopedCategorySource, type]);

    const [activeCategories, setActiveCategories] = useState([]);

    useEffect(() => {
        setActiveCategories(prev => prev.filter(category =>
            categoryTotals.some(cat => cat.category === category)
        ));
    }, [categoryTotals]);
    
    const handleCategoryCardClick = (category) => {
        setActiveCategories(prev => {
            if (prev.includes(category)) {
                return prev.filter(cat => cat !== category);
            } else {
                return [...prev, category];
            }
        });
    };

    const handleShowAllRecords = useCallback(() => {
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterCategory('الكل');
        setActiveCategories([]);
        setGlobalSearch('');
    }, []);

    const handleResetFiltersToMonth = useCallback(() => {
        setFilterDateFrom(initialRange.start);
        setFilterDateTo(initialRange.end);
        setFilterCategory('الكل');
        setActiveCategories([]);
        setGlobalSearch('');
    }, [initialRange.start, initialRange.end]);

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
            const hasTextSearch = searchLower.length > 0;
            const hasNumericSearch = searchNumeric.length > 0;

            list = list.filter(item => {
                let textMatches = false;
                if (hasTextSearch) {
                    const matchesInvoice = item.invoiceNumber && normalizeTextForSearch(item.invoiceNumber).includes(searchLower);
                    const matchesCategory = item.category && normalizeTextForSearch(item.category).includes(searchLower);
                    const matchesDescription = item.description && normalizeTextForSearch(item.description).includes(searchLower);
                    const matchesNotes = item.notes && normalizeTextForSearch(item.notes).includes(searchLower);
                    const matchesRecipient = item.recipientName && normalizeTextForSearch(item.recipientName).includes(searchLower);
                    const matchesVendor = item.vendor && normalizeTextForSearch(item.vendor).includes(searchLower);
                    const matchesRep = item.representative && normalizeTextForSearch(item.representative).includes(searchLower);
                    const employeeName = item.employeeId ? data.employees.find(e => e.id === item.employeeId)?.name : '';
                    const matchesEmployee = employeeName && normalizeTextForSearch(employeeName).includes(searchLower);

                    textMatches = matchesInvoice || matchesCategory || matchesDescription || matchesRecipient || matchesVendor || matchesRep || matchesNotes || matchesEmployee;
                }

                const numericMatches = hasNumericSearch
                    ? !!(item.amount && normalizeTextForSearch(item.amount.toString(), true).includes(searchNumeric))
                    : false;

                return textMatches || numericMatches;
            });
        }
        return list;
    }, [data, collectionName, filterDateFrom, filterDateTo, filterCategory, globalSearch, activeCategories]);

    const totalFilteredAmount = useMemo(() => {
        return filteredList.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    }, [filteredList]);

    const {
        paginatedItems: paginatedList,
        totalItems: totalFilteredItems,
        pageSize: listPageSize,
        currentPage: listCurrentPage,
        totalPages: listTotalPages,
        changePageSize: changeListPageSize,
        goToPage: goToListPage,
    } = usePagination(filteredList);


    const handleSubmit = (e) => {
        e.preventDefault();

        let itemToSave = collectionName === 'expenses' ? {
            ...formState,
            vendor: selectedVendor,
            // Pass inventory items only if present (i.e., this came from dispatch flow)
            inventoryItems: formState.inventoryItems || [],
        } : formState;

        if (collectionName === 'expenses') {
            const normalizedAttachments = normalizeAttachmentList(itemToSave.attachments, itemToSave.invoiceImageUrl, 'مرفق');
            itemToSave = {
                ...itemToSave,
                attachments: normalizedAttachments,
                invoiceImageUrl: getPrimaryAttachmentDataUrl(normalizedAttachments),
            };
        }

        // تحقق إضافي لحقول المصروفات
        if (collectionName === 'expenses' && itemToSave.vendor && !itemToSave.representative) {
            showToast('يجب اختيار المندوب عند اختيار المورد.', 'error');
            return;
        }


        handleDataAction(collectionName, itemToSave, !currentItem);
        
        // مسح حالة الملء التلقائي بعد الإضافة
        if (initialExpenseState && !currentItem) {
            setInitialExpenseState(null);
        }
        
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

    const handleAttachmentsUpload = async (event) => {
        if (collectionName !== 'expenses') {
            return;
        }

        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
            return;
        }

        try {
            const newAttachments = await Promise.all(files.map(createAttachmentFromFile));
            setFormState(prev => {
                const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
                const updated = [...existing, ...newAttachments];
                return {
                    ...prev,
                    attachments: updated,
                    invoiceImageUrl: getPrimaryAttachmentDataUrl(updated),
                };
            });
            showToast('تم تحميل المرفقات بنجاح.', 'success');
        } catch (error) {
            console.error('Failed to upload attachments', error);
            showToast('تعذر تحميل المرفقات. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            event.target.value = '';
        }
    };

    const handleScanAttachment = useCallback(() => {
        if (collectionName !== 'expenses' || typeof openScanner !== 'function') {
            return;
        }

        const timestamp = new Date().toISOString().split('T')[0];

        openScanner({
            title: 'مسح فاتورة المصروف',
            defaultFileName: `فاتورة-${timestamp}`,
            onCapture: (attachment) => {
                if (!attachment) {
                    return;
                }
                setFormState(prev => {
                    const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
                    const updated = [...existing, attachment];
                    return {
                        ...prev,
                        attachments: updated,
                        invoiceImageUrl: getPrimaryAttachmentDataUrl(updated),
                    };
                });
                showToast('تم التقاط صورة الفاتورة عبر السكنر.', 'success');
            },
        });
    }, [collectionName, openScanner, showToast]);

    const removeAttachment = (attachmentId) => {
        if (collectionName !== 'expenses') {
            return;
        }
        setFormState(prev => {
            const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
            const updated = existing.filter(att => att.id !== attachmentId);
            return {
                ...prev,
                attachments: updated,
                invoiceImageUrl: getPrimaryAttachmentDataUrl(updated),
            };
        });
    };

    const handleAttachmentPreview = (attachment) => {
        if (!attachment) {
            return;
        }
        if (isImageAttachment(attachment)) {
            setPreviewAttachment(attachment);
        } else {
            const newWindow = window.open(attachment.dataUrl || attachment.url || attachment.attachmentUrl, '_blank');
            if (!newWindow) {
                showToast('يرجى السماح بالنوافذ المنبثقة لعرض المستند.', 'warning');
            }
        }
    };

    const handlePrintAll = () => {
        if (filteredList.length === 0) {
             showToast('لا توجد بيانات لطباعة التقرير.', "error");
             return;
        }
        const exportContent = filteredList.map(item => {
            const baseItem = {
                'التاريخ والوقت': formatDateTimeDDMMYYYY(item.date),
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
                'التاريخ والوقت': formatDateTimeDDMMYYYY(item.date),
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

    // وظيفة تحميل نموذج Excel
    const downloadExcelTemplate = () => {
        const templateData = [];
        
        // إنشاء صف واحد كمثال
        const exampleRow = {
            'التاريخ (yyyy-mm-dd)': '2025-01-01',
            'المبلغ': 100000,
        };
        
        // إضافة حقول إضافية حسب نوع الصفحة
        if (type === 'revenue') {
            exampleRow['الفئة'] = 'مبيعات';
            exampleRow['وصف الإيراد'] = 'مثال على إيراد';
        } else if (type === 'expense') {
            exampleRow['الفئة'] = 'رواتب';
            exampleRow['الوصف'] = 'مثال على مصروف';
            exampleRow['المورد'] = 'شركة مثال';
            exampleRow['المندوب'] = 'أحمد';
        } else if (type === 'advance') {
            exampleRow['الفئة'] = 'سلفة شخصية';
            exampleRow['اسم الموظف'] = 'محمد علي';
            exampleRow['ملاحظات'] = 'سلفة';
        }
        
        templateData.push(exampleRow);
        
        // إنشاء workbook وworksheet
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'البيانات');
        
        // تحميل الملف
        XLSX.writeFile(wb, `نموذج_${title}_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('تم تحميل نموذج Excel بنجاح!', 'success');
    };
    
    // وظيفة معالجة الملف المرفوع
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setSelectedFile(file);
        showToast('تم تحديد الملف. اضغط على "استيراد البيانات" للمتابعة.', 'info');
    };
    
    // وظيفة استيراد البيانات من ملف Excel
    const importDataFromExcel = () => {
        if (!selectedFile) {
            showToast('يرجى اختيار ملف Excel أولاً', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileData = new Uint8Array(e.target.result);
                const workbook = XLSX.read(fileData, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);
                
                if (jsonData.length === 0) {
                    showToast('الملف فارغ أو غير صالح', 'error');
                    return;
                }
                
                let successCount = 0;
                let errorCount = 0;
                
                jsonData.forEach((row, index) => {
                    try {
                        // التحقق من البيانات الأساسية
                        if (!row['المبلغ']) {
                            errorCount++;
                            return;
                        }
                        
                        const newItem = {
                            id: crypto.randomUUID(),
                            date: row['التاريخ (yyyy-mm-dd)'] ? `${row['التاريخ (yyyy-mm-dd)']}T${new Date().toTimeString().slice(0, 5)}` : getDefaultDateTime(),
                            invoiceNumber: generateInvoiceNumber(),
                            amount: parseFloat(row['المبلغ']) || 0,
                        };
                        
                        // إضافة حقول إضافية حسب نوع الصفحة
                        if (type === 'revenue') {
                            newItem.category = row['الفئة'] || categories[0] || '';
                            newItem.description = row['وصف الإيراد'] || '';
                            newItem.recipientName = row['اسم المستلم'] || '';
                        } else if (type === 'expense') {
                            newItem.category = row['الفئة'] || categories[0] || '';
                            newItem.description = row['الوصف'] || '';
                            newItem.vendor = row['المورد'] || '';
                            newItem.representative = row['المندوب'] || '';
                        } else if (type === 'advance') {
                            newItem.category = row['الفئة'] || categories[0] || '';
                            newItem.notes = row['ملاحظات'] || '';
                            // البحث عن الموظف بالاسم
                            const employeeName = row['اسم الموظف'];
                            const employee = data.employees.find(e => e.name === employeeName);
                            newItem.employeeId = employee ? employee.id : data.employees[0]?.id || '';
                        }
                        
                        // إضافة العنصر
                        handleDataAction(collectionName, newItem, true);
                        successCount++;
                    } catch (error) {
                        console.error(`خطأ في معالجة السطر ${index + 1}:`, error);
                        errorCount++;
                    }
                });
                
                showToast(`تم استيراد ${successCount} سجل بنجاح${errorCount > 0 ? ` (${errorCount} خطأ)` : ''}`, successCount > 0 ? 'success' : 'error');
                setIsImportModalOpen(false);
                setSelectedFile(null);
                if (typeof handleRefresh === 'function') {
                    handleRefresh();
                }
            } catch (error) {
                console.error('خطأ في قراءة ملف Excel:', error);
                showToast('حدث خطأ في قراءة ملف Excel', 'error');
            }
        };
        
        reader.readAsArrayBuffer(selectedFile);
    };

    const filteredReps = data.settings.representatives.filter(rep => rep.vendor === selectedVendor);


    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl app-main-content">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-teal-500 pb-3">{title}</h2>

            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                    <div className="col-span-1 text-xl font-bold p-6 rounded-2xl bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/40 dark:to-teal-800/30 text-teal-800 dark:text-teal-200 flex flex-col items-center justify-center shadow-xl border-r-4 border-teal-600 dark:border-teal-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                        <Calculator className="w-6 h-6 mb-1" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">المجموع المفلتر:</span>
                        <span className="font-extrabold text-2xl mt-1">
                            {formatCurrencyDisplay(totalFilteredAmount)}
                        </span>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-inner">
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

                                {/* تم إخفاء قائمة الفئة التقليدية لتشجيع استخدام الكروت */}
                                {categories && categories.length > 0 && collectionName !== 'advances' && (
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

                                <div className="md:col-span-3 flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={handleShowAllRecords}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-sm transition"
                                    >
                                        <Eye className="w-4 h-4" />
                                        عرض الكل
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleResetFiltersToMonth}
                                        className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition font-semibold"
                                    >
                                        <CalendarCheck className="w-4 h-4" />
                                        تصفية الشهر الحالي
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* **جديد:** كروت الفئات (Multiple Select) */}
            {collectionName !== 'suspended' && categoryTotals.length > 0 && (
                <div className="space-y-4" dir="rtl">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Filter className="w-5 h-5 ml-2" />
                        فلترة حسب فئة {type === 'revenue' ? 'الإيراد' : 'الصرف'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {categoryTotals.map(cat => (
                            <FilterStatCard
                                key={cat.category}
                                title={cat.category}
                                value={formatCurrencyDisplay(cat.total)}
                                onClick={() => handleCategoryCardClick(cat.category)}
                                active={isFilterActive(cat.category)}
                                themeKey={type === 'revenue' ? 'teal' : type === 'advance' ? 'purple' : 'rose'}
                                customTheme={CUSTOM_CATEGORY_COLORS[cat.category]}
                                size="sm"
                            />
                        ))}
                    </div>
                </div>
            )}


            
            
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button 
                    onClick={() => openModal()} 
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 shadow-lg transition duration-200"
                    disabled={!!initialExpenseState && collectionName === 'expenses' && isModalOpen}
                    data-testid="button-add-record"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    {type === 'suspended' ? 'إضافة مبلغ معلق' : type === 'revenue' ? 'إضافة إيراد' : type === 'expense' ? 'إضافة مصروف' : 'إضافة سلفة'}
                    {!!initialExpenseState && collectionName === 'expenses' && ' (معلومات من المخزن)'}
                </button>

                <div className="flex flex-wrap gap-2 space-x-reverse">
                    <button onClick={handlePrintAll} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                        <Printer className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition duration-200" data-testid="button-import-excel">
                        <Upload className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={handleExportAll} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition duration-200">
                        <Download className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200">
                        <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>



            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600 rounded-t-xl">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">التاريخ والوقت</th>
                            {fields.map(field => (
                                <th key={field.key} className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">{field.label}</th>
                            ))}
                            {collectionName === 'expenses' && <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">المورد والمندوب</th>}
                            {collectionName !== 'revenues' && (
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">رقم الفاتورة</th>
                            )}
                            {collectionName === 'expenses' && (
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">المرفقات</th>
                            )}
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredList.length === 0 ? (
                            <tr><td colSpan={emptyStateColSpan} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا توجد سجلات متاحة تتوافق مع الفلاتر.</td></tr>
                        ) : (
                            paginatedList.map(item => (
                                <tr
                                    key={item.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 cursor-pointer ${isSearchActive ? 'bg-amber-50 dark:bg-amber-900/40 border-r-4 border-amber-400' : ''}`}
                                    onClick={() => openModal(item)}
                                    data-testid={`row-${item.id}`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">{formatDateTimeDDMMYYYY(item.date)}</td>
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
                                    {collectionName !== 'revenues' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 font-mono">{highlightText(item.invoiceNumber || 'N/A', globalSearch)}</td>
                                    )}
                                    {collectionName === 'expenses' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                                            {(() => {
                                                const attachments = normalizeAttachmentList(item.attachments, item.invoiceImageUrl, 'مرفق');
                                                if (attachments.length === 0) {
                                                    return <span className="text-gray-400 dark:text-gray-500 text-xs">لا توجد</span>;
                                                }

                                                return (
                                                    <div className="flex flex-wrap gap-2">
                                                        {attachments.map(attachment => (
                                                            <button
                                                                key={attachment.id}
                                                                type="button"
                                                                onClick={() => handleAttachmentPreview(attachment)}
                                                                className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/60 text-xs font-semibold transition"
                                                            >
                                                                {attachment.name || 'مرفق'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    )}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex space-x-3 space-x-reverse">
                                            {(type === 'expense' || type === 'advance') && (
                                                <button onClick={() => handlePrint(item)} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100">
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

            <PaginationControls
                pageSize={listPageSize}
                onPageSizeChange={changeListPageSize}
                currentPage={listCurrentPage}
                totalPages={listTotalPages}
                onPageChange={goToListPage}
                totalItems={totalFilteredItems}
            />

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
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الشركة الموردة</label>
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
                                        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right ${!!initialExpenseState && !currentItem ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500'}`}
                                        disabled={!!initialExpenseState && !currentItem}
                                    >
                                        <option value="" disabled>-- اختر الشركة --</option>
                                        {data.settings.vendors.map(vendor => (
                                            <option key={vendor} value={vendor}>{vendor}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="flex flex-col space-y-1 text-right">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المندوب المسؤول</label>
                                    <select
                                        value={formState.representative || ''}
                                        onChange={(e) => setFormState({ ...formState, representative: e.target.value })}
                                        required
                                        disabled={!selectedVendor || (!!initialExpenseState && !currentItem)}
                                        className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right ${!!initialExpenseState && !currentItem ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500'}`}
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
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
                                        <select
                                            value={formState[field.key] || ''}
                                            onChange={(e) => setFormState({ ...formState, [field.key]: e.target.value })}
                                            required={field.required}
                                            onInvalid={(e) => e.target.setCustomValidity(field.required ? 'هذا الحقل إجباري، يرجى اختياره.' : '')}
                                            onInput={(e) => e.target.setCustomValidity('')}
                                            className={`w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl transition duration-150 text-right ${isAutoFilled ? 'bg-gray-100 dark:bg-gray-600' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500'}`}
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
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{field.label}</label>
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

        {collectionName === 'expenses' && (
            <div className="space-y-2 text-right">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">مرفقات الصرفية (صور / مستندات)</label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        multiple
                        onChange={handleAttachmentsUpload}
                        className="flex-1 p-3 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <button
                        type="button"
                        onClick={handleScanAttachment}
                        disabled={!scannerAvailable}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition shadow ${scannerAvailable ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                        title={scannerAvailable ? 'التقاط صورة عبر السكنر' : 'السكنر غير متاح في هذا الجهاز'}
                    >
                        <Scan className="w-5 h-5" />
                        مسح عبر السكنر
                    </button>
                </div>
                {attachmentsList.length > 0 && (
                    <div className="space-y-2">
                        {attachmentsList.map(attachment => (
                            <div
                                key={attachment.id}
                                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                            >
                                <span className="flex-1 truncate font-medium">{attachment.name}</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => handleAttachmentPreview(attachment)}
                                        className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/60"
                                    >
                                        معاينة
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => removeAttachment(attachment.id)}
                                        className="px-3 py-1 text-xs rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/60"
                                    >
                                        حذف
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {initialExpenseState && collectionName === 'expenses' && !currentItem && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-700 rounded-xl text-indigo-800 dark:text-indigo-200 font-semibold text-center">
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
            {/* Import Modal */}
            {isImportModalOpen && (
                <Modal title="استيراد البيانات من Excel" onClose={() => setIsImportModalOpen(false)}>
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
                            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                كيفية الاستخدام:
                            </h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                                <li>قم بتحميل نموذج Excel الفارغ</li>
                                <li>املأ البيانات في النموذج</li>
                                <li>ارفع الملف المملوء هنا</li>
                                <li>اضغط على "استيراد البيانات"</li>
                            </ol>
                        </div>
                        
                        <div className="flex flex-col gap-4">
                            <button
                                onClick={downloadExcelTemplate}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-lg transition duration-200"
                                data-testid="button-download-template"
                            >
                                <FileDown className="w-5 h-5" />
                                تحميل نموذج Excel
                            </button>
                            
                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6">
                                <label className="flex flex-col items-center justify-center cursor-pointer">
                                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {selectedFile ? selectedFile.name : 'اضغط لاختيار ملف Excel'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        (xlsx, xls)
                                    </span>
                                    <input
                                        type="file"
                                        accept=".xlsx,.xls"
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        data-testid="input-file-upload"
                                    />
                                </label>
                            </div>
                            
                            <button
                                onClick={importDataFromExcel}
                                disabled={!selectedFile}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-lg transition duration-200 ${
                                    selectedFile
                                        ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
                                        : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                }`}
                                data-testid="button-import-data"
                            >
                                <Upload className="w-5 h-5" />
                                استيراد البيانات
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
});






/**
 * 3.2.b DebtsPage Component (إدارة الديون)
 */
const DebtsPageComponent = React.memo(({ data, handleDataAction, handleDelete, showToast, setInitialExpenseState, navigateWithGuards, currentUser, handleRefresh, openScanner }) => {
    const initialRange = useMemo(() => getCurrentMonthRange(), []);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState(null);
    const [activeDebt, setActiveDebt] = useState(null);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState(initialRange.start);
    const [filterDateTo, setFilterDateTo] = useState(initialRange.end);
    const [filterCategory, setFilterCategory] = useState('الكل');
    const [globalSearch, setGlobalSearch] = useState('');
    const [originFilter, setOriginFilter] = useState('all');
    const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
    const scannerAvailable = typeof openScanner === 'function';

    const resolveDebtType = useCallback((debt) => {
        if (!debt) {
            return DEBT_TYPES.MANUAL;
        }
        if (debt.debtType) {
            return debt.debtType;
        }
        if (debt.linkedInvoiceId || debt.debtSource === DEBT_TYPES.INVENTORY || debt.source === DEBT_TYPES.INVENTORY) {
            return DEBT_TYPES.INVENTORY;
        }
        return DEBT_TYPES.MANUAL;
    }, []);

    const defaultForm = useMemo(() => ({
        companyName: data.settings.vendors[0] || '',
        vendorName: '',
        category: data.settings.expenseCategories[0] || '',
        totalAmount: '',
        description: '',
        attachmentUrl: '',
    }), [data.settings.vendors, data.settings.expenseCategories]);

    const [debtForm, setDebtForm] = useState(defaultForm);

    const importInputRef = useRef(null);

    const canAddDebt = !!currentUser?.permissions?.debts?.add;
    const canEditDebt = !!currentUser?.permissions?.debts?.edit;
    const canDeleteDebt = !!currentUser?.permissions?.debts?.delete;
    const canPayDebt = !!currentUser?.permissions?.debts?.pay;

    const handlePrintDebts = useCallback(() => {
        window.print();
    }, []);

    const triggerImportDialog = () => {
        importInputRef.current?.click();
    };

    const handleImportDebts = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const buffer = await file.arrayBuffer();
            const workbook = XLSX.read(buffer, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet);

            if (!Array.isArray(rows) || rows.length === 0) {
                showToast('الملف لا يحتوي على بيانات صالحة.', 'error');
                event.target.value = '';
                return;
            }

            let addedCount = 0;

            rows.forEach((row, index) => {
                const companyName = row['اسم الشركة'] || row['الشركة'] || row['Company'] || '';
                const vendorName = row['اسم المورد'] || row['المورد'] || row['Vendor'] || '';
                const category = row['الفئة'] || row['Category'] || '';
                const totalAmountRaw = row['المبلغ الكلي'] || row['Total'] || row['TotalAmount'] || '';
                const remainingRaw = row['المتبقي'] || row['Remaining'] || '';
                const description = row['التفاصيل'] || row['الوصف'] || row['Description'] || '';

                if (!companyName || !totalAmountRaw) {
                    return;
                }

                const totalAmountValue = normalizeAmount(totalAmountRaw);
                const remainingAmountValue = remainingRaw ? normalizeAmount(remainingRaw) : totalAmountValue;

                if (Number.isNaN(totalAmountValue) || totalAmountValue <= 0) {
                    return;
                }

                const payload = {
                    companyName,
                    vendorName,
                    category: category || data.settings.expenseCategories[0] || '',
                    totalAmount: totalAmountValue,
                    remainingAmount: Math.max(0, remainingAmountValue),
                    description,
                    payments: [],
                    status: remainingAmountValue <= 0 ? 'settled' : 'active',
                    date: getDefaultDateTime(),
                    createdAt: getDefaultDateTime(),
                    updatedAt: getDefaultDateTime(),
                    debtType: DEBT_TYPES.MANUAL,
                };

                handleDataAction('debts', payload, true, false, { silent: addedCount > 0 });
                addedCount += 1;
            });

            if (addedCount === 0) {
                showToast('لم يتم العثور على سجلات ديون صالحة في الملف.', 'warning');
            } else {
                showToast(`تم استيراد ${addedCount} من سجلات الديون بنجاح.`, 'success');
            }
        } catch (error) {
            console.error('Debt import failed', error);
            showToast('تعذّر قراءة ملف الديون. يرجى التحقق من التنسيق.', 'error');
        } finally {
            event.target.value = '';
        }
    };

    useEffect(() => {
        if (editingDebt) {
            setDebtForm({
                companyName: editingDebt.companyName || defaultForm.companyName,
                vendorName: editingDebt.vendorName || '',
                category: editingDebt.category || defaultForm.category,
                totalAmount: editingDebt.totalAmount?.toString() || editingDebt.totalAmount || '',
                description: editingDebt.description || '',
                attachmentUrl: editingDebt.attachmentUrl || '',
            });
        } else {
            setDebtForm(defaultForm);
        }
    }, [editingDebt, defaultForm]);

    const normalizeAmount = useCallback((value) => {
        const normalized = convertArabicToEnglish((value ?? '').toString());
        const cleaned = normalized.replace(/[^0-9.]/g, '');
        const numeric = parseFloat(cleaned);
        return Number.isFinite(numeric) ? numeric : 0;
    }, []);

    const debts = useMemo(() => Array.isArray(data.debts) ? data.debts : [], [data.debts]);

    const representativesForVendor = useMemo(() => {
        return data.settings.representatives.filter(rep => rep.vendor === debtForm.companyName);
    }, [data.settings.representatives, debtForm.companyName]);

    useEffect(() => {
        if (!debtForm.companyName && data.settings.vendors[0]) {
            setDebtForm(prev => ({ ...prev, companyName: data.settings.vendors[0] }));
        }
    }, [data.settings.vendors, debtForm.companyName]);

    useEffect(() => {
        if (representativesForVendor.length === 0 && debtForm.vendorName) {
            setDebtForm(prev => ({ ...prev, vendorName: '' }));
            return;
        }

        if (representativesForVendor.length > 0) {
            const hasMatch = representativesForVendor.some(rep => rep.name === debtForm.vendorName);
            if (!hasMatch) {
                setDebtForm(prev => ({ ...prev, vendorName: representativesForVendor[0].name }));
            }
        }
    }, [representativesForVendor, debtForm.vendorName]);

    const baseFilteredDebts = useMemo(() => {
        let list = debts.slice().sort((a, b) => new Date(b.updatedAt || b.date || 0) - new Date(a.updatedAt || a.date || 0));

        if (filterDateFrom) {
            list = list.filter(item => {
                const recordDate = (item.date || item.createdAt || '').slice(0, 10);
                return recordDate ? recordDate >= filterDateFrom : true;
            });
        }

        if (filterDateTo) {
            list = list.filter(item => {
                const recordDate = (item.date || item.createdAt || '').slice(0, 10);
                return recordDate ? recordDate <= filterDateTo : true;
            });
        }

        if (filterCategory !== 'الكل') {
            list = list.filter(item => (item.category || '') === filterCategory);
        }

        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch);
            const numericSearch = normalizeTextForSearch(globalSearch, true);
            const hasTextSearch = searchLower.length > 0;
            const hasNumericSearch = numericSearch.length > 0;

            list = list.filter(item => {
                let textMatch = false;
                if (hasTextSearch) {
                    const matchesCompany = item.companyName && normalizeTextForSearch(item.companyName).includes(searchLower);
                    const matchesVendor = item.vendorName && normalizeTextForSearch(item.vendorName).includes(searchLower);
                    const matchesCategory = item.category && normalizeTextForSearch(item.category).includes(searchLower);
                    const matchesDescription = item.description && normalizeTextForSearch(item.description).includes(searchLower);
                    textMatch = matchesCompany || matchesVendor || matchesCategory || matchesDescription;
                }

                const numericMatch = hasNumericSearch ? (
                    (!!item.totalAmount && normalizeTextForSearch(item.totalAmount.toString(), true).includes(numericSearch)) ||
                    (!!item.remainingAmount && normalizeTextForSearch(item.remainingAmount.toString(), true).includes(numericSearch))
                ) : false;

                return textMatch || numericMatch;
            });
        }

        return list;
    }, [debts, filterDateFrom, filterDateTo, filterCategory, globalSearch]);

    const sourceBreakdown = useMemo(() => {
        const initial = {
            [DEBT_TYPES.MANUAL]: { total: 0, remaining: 0, count: 0 },
            [DEBT_TYPES.INVENTORY]: { total: 0, remaining: 0, count: 0 },
        };

        baseFilteredDebts.forEach(debt => {
            const type = resolveDebtType(debt);
            const total = normalizeAmount(debt.totalAmount ?? 0);
            const remaining = normalizeAmount(debt.remainingAmount ?? total);
            if (!initial[type]) {
                initial[type] = { total: 0, remaining: 0, count: 0 };
            }
            initial[type].total += total;
            initial[type].remaining += remaining;
            initial[type].count += 1;
        });

        return initial;
    }, [baseFilteredDebts, normalizeAmount, resolveDebtType]);

    const filteredDebts = useMemo(() => {
        if (originFilter === 'all') {
            return baseFilteredDebts;
        }
        return baseFilteredDebts.filter(debt => resolveDebtType(debt) === originFilter);
    }, [baseFilteredDebts, originFilter, resolveDebtType]);

    const handleExportDebts = useCallback(() => {
        if (filteredDebts.length === 0) {
            showToast('لا توجد بيانات للتصدير.', 'error');
            return;
        }

        const exportRows = filteredDebts.map(debt => ({
            'اسم الشركة': debt.companyName || '---',
            'اسم المورد': debt.vendorName || '---',
            'الفئة': debt.category || '---',
            'المبلغ الكلي': normalizeAmount(debt.totalAmount ?? 0),
            'المتبقي': normalizeAmount(debt.remainingAmount ?? debt.totalAmount ?? 0),
            'آخر تحديث': formatDateTimeDDMMYYYY(debt.updatedAt || debt.date || getDefaultDateTime()),
        }));

        exportToCsv(exportRows, `تقرير_الديون_${new Date().toISOString().slice(0, 10)}`);
        showToast('تم تصدير الديون بنجاح.', 'success');
    }, [filteredDebts, normalizeAmount, showToast]);

    const categoryTotals = useMemo(() => {
        const totals = {};
        filteredDebts.forEach(debt => {
            const key = debt.category || 'غير مصنف';
            totals[key] = (totals[key] || 0) + normalizeAmount(debt.remainingAmount ?? debt.totalAmount ?? 0);
        });
        return Object.entries(totals).map(([category, total]) => ({ category, total }));
    }, [filteredDebts, normalizeAmount]);

    const overviewTotals = useMemo(() => {
        return filteredDebts.reduce((acc, debt) => {
            const total = normalizeAmount(debt.totalAmount ?? 0);
            const remaining = normalizeAmount(debt.remainingAmount ?? total);
            acc.totalAmount += total;
            acc.totalRemaining += remaining;
            acc.count += 1;
            return acc;
        }, { totalAmount: 0, totalRemaining: 0, count: 0 });
    }, [filteredDebts, normalizeAmount]);

    const totalPaidValue = overviewTotals.totalAmount - overviewTotals.totalRemaining;

    const {
        paginatedItems: paginatedDebts,
        totalItems: totalFilteredDebts,
        pageSize: debtsPageSize,
        currentPage: debtsCurrentPage,
        totalPages: debtsTotalPages,
        changePageSize: changeDebtsPageSize,
        goToPage: goToDebtsPage,
    } = usePagination(filteredDebts);

    const resetFilters = useCallback(() => {
        setFilterCategory('الكل');
        setFilterDateFrom(initialRange.start);
        setFilterDateTo(initialRange.end);
        setGlobalSearch('');
        setOriginFilter('all');
    }, [initialRange]);

    const handleToolbarRefresh = useCallback(() => {
        if (typeof handleRefresh === 'function') {
            handleRefresh();
        }
        resetFilters();
    }, [handleRefresh, resetFilters]);

    const handleOriginFilterToggle = (type) => {
        setOriginFilter(prev => (prev === type ? 'all' : type));
    };

    const isOriginActive = (type) => originFilter === type;

    const handleCategoryCardClick = (category) => {
        setFilterCategory(prev => (prev === category ? 'الكل' : category));
    };

    const isCategoryActive = (category) => filterCategory === category;

    const handleAttachmentChange = (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            setDebtForm(prev => ({ ...prev, attachmentUrl: e.target?.result || '' }));
            showToast('تم تحميل الملف بنجاح.', 'success');
        };
        reader.onerror = () => {
            showToast('تعذّر قراءة الملف. يرجى المحاولة مرة أخرى.', 'error');
        };
        reader.readAsDataURL(file);
    };

    const handleScanDebtAttachment = useCallback(() => {
        if (typeof openScanner !== 'function') {
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        openScanner({
            title: 'مسح مستند الدين',
            defaultFileName: `دين-${timestamp}`,
            onCapture: (attachment) => {
                if (!attachment) {
                    return;
                }

                const sourceUrl = attachment.dataUrl || attachment.url || attachment.attachmentUrl || '';
                if (!sourceUrl) {
                    return;
                }

                setDebtForm(prev => ({ ...prev, attachmentUrl: sourceUrl }));
                showToast('تم التقاط المستند وإضافته إلى الدين.', 'success');
            },
        });
    }, [openScanner, showToast]);

    const handleDebtSubmit = (e) => {
        e.preventDefault();

        if (!debtForm.companyName) {
            showToast('يرجى اختيار اسم الشركة.', 'error');
            return;
        }

        const totalAmountValue = normalizeAmount(debtForm.totalAmount);
        if (totalAmountValue <= 0) {
            showToast('يرجى إدخال مبلغ إجمالي صحيح.', 'error');
            return;
        }

        const existingPayments = Array.isArray(editingDebt?.payments) ? editingDebt.payments : [];
        const totalPaid = existingPayments.reduce((sum, payment) => sum + normalizeAmount(payment.amount), 0);
        if (!editingDebt && totalPaid > 0) {
            showToast('لا يمكن إدخال دفعات مسبقة لدين جديد.', 'error');
            return;
        }

        if (totalPaid > totalAmountValue) {
            showToast('إجمالي الدفعات أكبر من المبلغ الكلي للدين.', 'error');
            return;
        }

        const remainingAmount = Math.max(0, totalAmountValue - totalPaid);

        const debtType = editingDebt ? resolveDebtType(editingDebt) : DEBT_TYPES.MANUAL;
        const createdAt = editingDebt?.createdAt || editingDebt?.date || getDefaultDateTime();

        const payload = {
            ...(editingDebt || {}),
            companyName: debtForm.companyName,
            vendorName: debtForm.vendorName,
            category: debtForm.category,
            totalAmount: totalAmountValue,
            remainingAmount,
            description: debtForm.description,
            attachmentUrl: debtForm.attachmentUrl || '',
            payments: existingPayments,
            status: remainingAmount <= 0 ? 'settled' : 'active',
            date: editingDebt?.date || getDefaultDateTime(),
            createdAt,
            updatedAt: getDefaultDateTime(),
            debtType,
        };

        handleDataAction('debts', payload, !editingDebt);
        setIsModalOpen(false);
        setEditingDebt(null);
    };

    const openNewDebtModal = () => {
        if (!canAddDebt) {
            showToast('لا تملك صلاحية إضافة دين جديد.', 'error');
            return;
        }
        setEditingDebt(null);
        setIsModalOpen(true);
    };

    const openEditModal = (debt) => {
        if (!canEditDebt) {
            showToast('لا تملك صلاحية تعديل هذا الدين.', 'error');
            return;
        }
        setIsDetailsModalOpen(false);
        setEditingDebt(debt);
        setIsModalOpen(true);
    };

    const openDetailsModal = (debt) => {
        setActiveDebt(debt);
        setIsDetailsModalOpen(true);
    };

    const openPaymentModal = (debt) => {
        if (!canPayDebt) {
            showToast('لا تملك صلاحية تسجيل دفعة.', 'error');
            return;
        }
        setActiveDebt(debt);
        setPaymentAmount('');
        setIsDetailsModalOpen(false);
        setIsPaymentModalOpen(true);
    };

    const handleDeleteDebt = (debt) => {
        if (!canDeleteDebt) {
            showToast('لا تملك صلاحية حذف الدين.', 'error');
            return;
        }
        handleDelete('debts', debt.id);
        setIsDetailsModalOpen(false);
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        if (!activeDebt) return;

        const amountValue = normalizeAmount(paymentAmount);
        if (amountValue <= 0) {
            showToast('يرجى إدخال مبلغ دفعة صالح.', 'error');
            return;
        }

        const remaining = normalizeAmount(activeDebt.remainingAmount ?? activeDebt.totalAmount ?? 0);
        if (amountValue > remaining) {
            showToast('لا يمكن أن تتجاوز الدفعة المبلغ المتبقي.', 'error');
            return;
        }

        const canDirectExpense = !!currentUser?.permissions?.expenses?.add && !!currentUser?.permissions?.expenses?.view;
        const canPendingExpense = !!currentUser?.permissions?.pendingExpenses?.add && !!currentUser?.permissions?.pendingExpenses?.view;

        if (!canDirectExpense && !canPendingExpense) {
            showToast('لا تملك صلاحية تسجيل الدفعة كمصروف.', 'error');
            return;
        }

        const paymentId = crypto.randomUUID();
        const targetCollection = canDirectExpense ? 'expenses' : 'pendingExpenses';
        const vendorCompany = activeDebt.companyName || '';
        const representatives = Array.isArray(data.settings?.representatives)
            ? data.settings.representatives
            : [];
        const matchedRepresentative = representatives.find(
            (rep) => rep.vendor === vendorCompany && rep.name === activeDebt.vendorName
        );
        const defaultRepresentative = matchedRepresentative
            ? matchedRepresentative.name
            : representatives.find((rep) => rep.vendor === vendorCompany)?.name || activeDebt.vendorName || '';

        const expenseDraft = {
            id: paymentId,
            type: 'expense',
            status: 'pending',
            date: getDefaultDateTime(),
            amount: amountValue.toString(),
            category: activeDebt.category || data.settings.expenseCategories[0] || '',
            description: `دفعة على دين ${activeDebt.companyName}`,
            vendor: vendorCompany,
            representative: defaultRepresentative,
            notes: activeDebt.description || '',
            invoiceImageUrl: activeDebt.attachmentUrl || '',
            linkedDebtId: activeDebt.id,
            linkedDebtPaymentId: paymentId,
        };

        const navigated = navigateWithGuards(targetCollection, { preserveInitialExpenseState: true });
        if (!navigated) {
            return;
        }

        setInitialExpenseState(expenseDraft);
        setIsPaymentModalOpen(false);
        setIsDetailsModalOpen(false);

        showToast(
            canDirectExpense
                ? 'تم تجهيز بيانات الدفعة. يرجى اعتمادها من صفحة الصرفيات.'
                : 'تم تجهيز بيانات الدفعة. يرجى اعتمادها من صفحة الصرفيات المعلقة.',
            'info'
        );
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-gray-100">إدارة الديون</h1>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">متابعة الديون وتسجيل الدفعات وفق الصلاحيات.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                <FilterStatCard
                    title="إجمالي الديون"
                    value={formatCurrencyDisplay(overviewTotals.totalAmount)}
                    subtitle="القيمة الكلية"
                    icon={FileText}
                />
                <FilterStatCard
                    title="إجمالي المدفوع"
                    value={formatCurrencyDisplay(Math.max(totalPaidValue, 0))}
                    subtitle="مجموع الدفعات"
                    icon={DollarSign}
                    variant="success"
                />
                <FilterStatCard
                    title="المتبقي"
                    value={formatCurrencyDisplay(Math.max(overviewTotals.totalRemaining, 0))}
                    subtitle="مبالغ لم تُسدّد"
                    icon={AlertTriangle}
                    variant="warning"
                />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <FilterStatCard
                    title={DEBT_TYPE_LABELS[DEBT_TYPES.MANUAL]}
                    value={formatCurrencyDisplay(sourceBreakdown[DEBT_TYPES.MANUAL]?.total || 0)}
                    subtitle={`المتبقي: ${formatCurrencyDisplay(Math.max(sourceBreakdown[DEBT_TYPES.MANUAL]?.remaining || 0, 0))}`}
                    meta={`عدد السجلات: ${sourceBreakdown[DEBT_TYPES.MANUAL]?.count || 0}`}
                    icon={Briefcase}
                    onClick={() => handleOriginFilterToggle(DEBT_TYPES.MANUAL)}
                    active={isOriginActive(DEBT_TYPES.MANUAL)}
                    themeKey="blue"
                />
                <FilterStatCard
                    title={DEBT_TYPE_LABELS[DEBT_TYPES.INVENTORY]}
                    value={formatCurrencyDisplay(sourceBreakdown[DEBT_TYPES.INVENTORY]?.total || 0)}
                    subtitle={`المتبقي: ${formatCurrencyDisplay(Math.max(sourceBreakdown[DEBT_TYPES.INVENTORY]?.remaining || 0, 0))}`}
                    meta={`عدد السجلات: ${sourceBreakdown[DEBT_TYPES.INVENTORY]?.count || 0}`}
                    icon={Truck}
                    onClick={() => handleOriginFilterToggle(DEBT_TYPES.INVENTORY)}
                    active={isOriginActive(DEBT_TYPES.INVENTORY)}
                    themeKey="emerald"
                />
            </div>

            {categoryTotals.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {categoryTotals.map(item => (
                        <FilterStatCard
                            key={item.category}
                            title={item.category}
                            value={formatCurrencyDisplay(item.total)}
                            subtitle="مبالغ متبقية"
                            icon={FolderOpen}
                            onClick={() => handleCategoryCardClick(item.category)}
                            active={isCategoryActive(item.category)}
                            themeKey="gray"
                        />
                    ))}
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 items-end">
                <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">من تاريخ</label>
                    <input
                        type="date"
                        value={filterDateFrom}
                        onChange={(e) => setFilterDateFrom(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">إلى تاريخ</label>
                    <input
                        type="date"
                        value={filterDateTo}
                        onChange={(e) => setFilterDateTo(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                </div>
                <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الفئة</label>
                    <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                        <option value="الكل">الكل</option>
                        {data.settings.expenseCategories.map(category => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col space-y-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">بحث</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="ابحث باسم الشركة، المورد أو المبلغ"
                            value={globalSearch}
                            onChange={(e) => setGlobalSearch(e.target.value)}
                            className="w-full pl-10 pr-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 py-2">
                <div className="flex flex-wrap items-center gap-2 order-2 md:order-1 md:justify-start">
                    <button
                        type="button"
                        onClick={handleToolbarRefresh}
                        className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition"
                        title="تحديث"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handlePrintDebts}
                        className="p-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white transition"
                        title="طباعة"
                    >
                        <Printer className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={triggerImportDialog}
                        className="p-2 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white transition"
                        title="استيراد"
                    >
                        <Upload className="w-5 h-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleExportDebts}
                        className="p-2 rounded-full bg-amber-500 hover:bg-amber-600 text-white transition"
                        title="تصدير"
                    >
                        <FileDown className="w-5 h-5" />
                    </button>
                    <input
                        ref={importInputRef}
                        type="file"
                        accept=".xlsx,.xls"
                        className="hidden"
                        onChange={handleImportDebts}
                    />
                </div>
                <div className="flex flex-wrap gap-2 order-1 md:order-2 justify-end">
                    <ActionButton onClick={openNewDebtModal} disabled={!canAddDebt}>
                        <Plus className="w-5 h-5 ml-2" />
                        إضافة دين
                    </ActionButton>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gradient-to-l from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">الشركة</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">المورد</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">الفئة</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">المبلغ الكلي</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">المتبقي</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">آخر تحديث</th>
                                <th className="px-6 py-3 text-right text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedDebts.map(debt => {
                                const remaining = normalizeAmount(debt.remainingAmount ?? debt.totalAmount ?? 0);
                                const total = normalizeAmount(debt.totalAmount ?? 0);
                                const lastUpdate = formatDateTimeDDMMYYYY(debt.updatedAt || debt.date || getDefaultDateTime());
                                return (
                                    <tr key={debt.id} className="hover:bg-amber-50 dark:hover:bg-amber-900/30 transition" onClick={() => openDetailsModal(debt)}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-gray-100">{debt.companyName || 'غير محدد'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{debt.vendorName || '---'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{debt.category || '---'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatCurrencyDisplay(total)}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${remaining > 0 ? 'text-amber-600 dark:text-amber-300' : 'text-green-600 dark:text-green-300'}`}>{formatCurrencyDisplay(remaining)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400">{lastUpdate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={() => openDetailsModal(debt)}
                                                    className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                                                >
                                                    عرض
                                                </button>
                                                <button
                                                    onClick={() => openPaymentModal(debt)}
                                                    disabled={!canPayDebt}
                                                    className={`px-3 py-1 rounded-lg ${canPayDebt ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-200 text-gray-500 dark:bg-gray-700 dark:text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    إعطاء دفعة
                                                </button>
                                                <button
                                                    onClick={() => openEditModal(debt)}
                                                    disabled={!canEditDebt}
                                                    className={`p-2 rounded-lg ${canEditDebt ? 'text-amber-600 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-900/30' : 'text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteDebt(debt)}
                                                    disabled={!canDeleteDebt}
                                                    className={`p-2 rounded-lg ${canDeleteDebt ? 'text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30' : 'text-gray-400 cursor-not-allowed'}`}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {paginatedDebts.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
                                        لا توجد سجلات مطابقة للبحث المحدد.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4">
                    <PaginationControls
                        pageSize={debtsPageSize}
                        onPageSizeChange={changeDebtsPageSize}
                        currentPage={debtsCurrentPage}
                        totalPages={debtsTotalPages}
                        onPageChange={goToDebtsPage}
                        totalItems={totalFilteredDebts}
                    />
                </div>
            </div>

            {isModalOpen && (
                <Modal title={editingDebt ? 'تعديل الدين' : 'إضافة دين جديد'} onClose={() => { setIsModalOpen(false); setEditingDebt(null); }}>
                    <form onSubmit={handleDebtSubmit} className="space-y-5">
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم الشركة</label>
                            <select
                                value={debtForm.companyName}
                                onChange={(e) => setDebtForm(prev => ({ ...prev, companyName: e.target.value }))}
                                required
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                <option value="" disabled>اختر الشركة</option>
                                {data.settings.vendors.map(vendor => (
                                    <option key={vendor} value={vendor}>{vendor}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">اسم المورد</label>
                            <select
                                value={debtForm.vendorName}
                                onChange={(e) => setDebtForm(prev => ({ ...prev, vendorName: e.target.value }))}
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                <option value="">لا يوجد</option>
                                {representativesForVendor.map(rep => (
                                    <option key={rep.name} value={rep.name}>{rep.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الصنف</label>
                            <select
                                value={debtForm.category}
                                onChange={(e) => setDebtForm(prev => ({ ...prev, category: e.target.value }))}
                                required
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            >
                                {data.settings.expenseCategories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <InputField
                            label="المبلغ الكلي"
                            type="number"
                            value={debtForm.totalAmount}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, totalAmount: e.target.value }))}
                            required
                        />
                        <InputField
                            label="التفاصيل"
                            textarea
                            value={debtForm.description}
                            onChange={(e) => setDebtForm(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="أدخل تفاصيل الدين أو شروطه"
                        />
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">رفع ملف مرفق</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleAttachmentChange}
                                    className="flex-1 p-2 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                />
                                <button
                                    type="button"
                                    onClick={handleScanDebtAttachment}
                                    disabled={!scannerAvailable}
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow transition ${scannerAvailable ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                    title={scannerAvailable ? 'التقاط صورة عبر السكنر' : 'السكنر غير متاح في هذا الجهاز'}
                                >
                                    <Scan className="w-5 h-5" />
                                    مسح عبر السكنر
                                </button>
                            </div>
                            {debtForm.attachmentUrl && (
                                <button type="button" className="text-sm text-blue-600 dark:text-blue-300 underline" onClick={() => setImagePreviewUrl(debtForm.attachmentUrl)}>
                                    معاينة المرفق
                                </button>
                            )}
                        </div>
                        <ActionButton type="submit" className="w-full">
                            <Save className="w-5 h-5 ml-2" />
                            حفظ
                        </ActionButton>
                    </form>
                </Modal>
            )}

            {isDetailsModalOpen && activeDebt && (
                <Modal title={`تفاصيل دين ${activeDebt.companyName || ''}`} onClose={() => setIsDetailsModalOpen(false)} size="xl">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700">
                                <p className="text-sm text-blue-800 dark:text-blue-200">المبلغ الكلي</p>
                                <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{formatCurrencyDisplay(normalizeAmount(activeDebt.totalAmount ?? 0))}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-600">
                                <p className="text-sm text-amber-800 dark:text-amber-200">المتبقي</p>
                                <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{formatCurrencyDisplay(normalizeAmount(activeDebt.remainingAmount ?? activeDebt.totalAmount ?? 0))}</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <p className="text-sm text-gray-600 dark:text-gray-300">التفاصيل:</p>
                            <p className="text-base text-gray-800 dark:text-gray-200 whitespace-pre-line">{activeDebt.description || 'لا توجد تفاصيل إضافية.'}</p>
                        </div>

                        {activeDebt.attachmentUrl && (
                            <div className="space-y-2">
                                <p className="text-sm text-gray-600 dark:text-gray-300">المرفقات:</p>
                                <button
                                    onClick={() => setImagePreviewUrl(activeDebt.attachmentUrl)}
                                    className="px-4 py-2 rounded-xl bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200"
                                >
                                    عرض المرفق
                                </button>
                            </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                            <ActionButton onClick={() => openPaymentModal(activeDebt)} disabled={!canPayDebt} className="bg-green-600 hover:bg-green-700">
                                <Coins className="w-5 h-5 ml-2" />
                                إعطاء دفعة
                            </ActionButton>
                            <ActionButton onClick={() => openEditModal(activeDebt)} disabled={!canEditDebt} className="bg-amber-500 hover:bg-amber-600">
                                <Edit2 className="w-5 h-5 ml-2" />
                                تعديل
                            </ActionButton>
                            <ActionButton onClick={() => handleDeleteDebt(activeDebt)} disabled={!canDeleteDebt} className="bg-red-600 hover:bg-red-700">
                                <Trash2 className="w-5 h-5 ml-2" />
                                حذف
                            </ActionButton>
                        </div>

                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-3">سجل الدفعات</h3>
                            <div className="space-y-3">
                                {Array.isArray(activeDebt.payments) && activeDebt.payments.length > 0 ? (
                                    activeDebt.payments
                                        .slice()
                                        .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                                        .map(payment => (
                                            <div key={payment.id} className="p-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/60">
                                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">تاريخ الدفع</p>
                                                        <p className="text-base font-semibold text-gray-800 dark:text-gray-200">{formatDateTimeDDMMYYYY(payment.date || getDefaultDateTime())}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">المبلغ المدفوع</p>
                                                        <p className="text-base font-semibold text-green-700 dark:text-green-300">{formatCurrencyDisplay(normalizeAmount(payment.amount))}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-500 dark:text-gray-400">المتبقي بعد الدفع</p>
                                                        <p className="text-base font-semibold text-amber-600 dark:text-amber-300">{formatCurrencyDisplay(normalizeAmount(payment.remainingAfter ?? activeDebt.remainingAmount ?? 0))}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <p className="text-sm text-gray-500 dark:text-gray-400">لم يتم تسجيل أي دفعات لهذا الدين بعد.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </Modal>
            )}

            {isPaymentModalOpen && activeDebt && (
                <Modal title={`تسجيل دفعة على دين ${activeDebt.companyName || ''}`} onClose={() => setIsPaymentModalOpen(false)}>
                    <form onSubmit={handlePaymentSubmit} className="space-y-5">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            المتبقي الحالي: <span className="font-semibold text-amber-600 dark:text-amber-300">{formatCurrencyDisplay(normalizeAmount(activeDebt.remainingAmount ?? activeDebt.totalAmount ?? 0))}</span>
                        </p>
                        <InputField
                            label="مبلغ الدفعة"
                            type="number"
                            value={paymentAmount}
                            onChange={(e) => setPaymentAmount(e.target.value)}
                            required
                        />
                        <ActionButton type="submit" className="w-full">
                            <Save className="w-5 h-5 ml-2" />
                            إضافة الدفعة
                        </ActionButton>
                    </form>
                </Modal>
            )}

            {imagePreviewUrl && (
                <Modal title="معاينة المرفق" onClose={() => setImagePreviewUrl(null)} size="xl">
                    <div className="flex justify-center">
                        <img
                            src={imagePreviewUrl}
                            alt="Debt Attachment"
                            className="max-h-[70vh] w-auto rounded-xl border border-gray-200 dark:border-gray-700"
                            onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = 'https://placehold.co/600x400/1f2937/fff?text=Attachment'; }}
                        />
                    </div>
                </Modal>
            )}
        </div>
    );
});

/**
 * 3.3. PendingExpenses Component - الصرفيات المعلقة
 */
const PendingExpensesComponent = React.memo(({ data, handleDataAction, handleDelete, showToast, setCurrentPage, setInitialExpenseState, handleRefresh, initialExpenseState, currentUser, openScanner }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [viewItem, setViewItem] = useState(null);
    const [formState, setFormState] = useState({
        id: null,
        type: 'expense',
        date: getDefaultDateTime(),
        amount: '',
        category: '',
        description: '',
        vendor: '',
        representative: '',
        employeeId: '',
        notes: '',
        status: 'pending',
        invoiceImageUrl: '',
        inventoryItems: [],
        linkedInvoiceId: null,
        fromInventoryEntry: false,
        invoiceNumber: '',
        attachments: [],
    });
    const [selectedVendor, setSelectedVendor] = useState('');
    const [globalSearch, setGlobalSearch] = useState('');
    const isSearchActive = useMemo(() => globalSearch.trim().length > 0, [globalSearch]);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [filterTypes, setFilterTypes] = useState([]); // مصفوفة للسماح باختيار متعدد: ['expense', 'advance']
    const [filterStatuses, setFilterStatuses] = useState([]); // مصفوفة للسماح باختيار متعدد: ['pending', 'cancelled', 'paid']
    const [previewAttachment, setPreviewAttachment] = useState(null);
    const [previewZoomed, setPreviewZoomed] = useState(false);
    const attachmentsList = Array.isArray(formState.attachments) ? formState.attachments : [];
    const scannerAvailable = typeof openScanner === 'function';

    const canAddPending = !!currentUser?.permissions?.pendingExpenses?.add;
    const canEditPending = !!currentUser?.permissions?.pendingExpenses?.edit;
    const canApprovePending = !!currentUser?.permissions?.pendingExpenses?.approve;
    const canCancelPending = !!currentUser?.permissions?.pendingExpenses?.cancel;

    const initialRange = useMemo(() => getCurrentMonthRange(), []);
    const [filterDateFrom, setFilterDateFrom] = useState(initialRange.start);
    const [filterDateTo, setFilterDateTo] = useState(initialRange.end);

    useEffect(() => {
        if (currentItem) {
            const normalizedAttachments = normalizeAttachmentList(currentItem.attachments, currentItem.invoiceImageUrl, 'مرفق');
            setFormState({
                ...currentItem,
                attachments: normalizedAttachments,
                invoiceImageUrl: getPrimaryAttachmentDataUrl(normalizedAttachments) || currentItem.invoiceImageUrl || '',
            });
            if (currentItem.type === 'expense') {
                setSelectedVendor(currentItem.vendor || '');
            }
        } else {
            setFormState({
                id: currentItem?.id || null,
                type: 'expense',
                date: getDefaultDateTime(),
                amount: '',
                category: '',
                description: '',
                vendor: '',
                representative: '',
                employeeId: data.employees[0]?.id || '',
                notes: '',
                status: 'pending',
                invoiceImageUrl: '',
                inventoryItems: [],
                linkedInvoiceId: null,
                fromInventoryEntry: false,
                invoiceNumber: '',
                linkedDebtId: '',
                linkedDebtPaymentId: '',
                attachments: [],
            });
            setSelectedVendor('');
        }
    }, [currentItem, data.employees]);

    useEffect(() => {
        if (previewAttachment) {
            setPreviewZoomed(false);
        }
    }, [previewAttachment]);

    useEffect(() => {
        if (initialExpenseState) {
            const normalizedAmount = convertArabicToEnglish((initialExpenseState.amount ?? '').toString());
            const normalizedAttachments = normalizeAttachmentList(initialExpenseState.attachments, initialExpenseState.invoiceImageUrl, 'مرفق');
            setFormState({
                id: initialExpenseState.id || null,
                type: 'expense',
                date: initialExpenseState.date || getDefaultDateTime(),
                amount: normalizedAmount || initialExpenseState.amount?.toString() || '',
                category: initialExpenseState.category || data.settings.expenseCategories[0] || '',
                description: initialExpenseState.description || '',
                vendor: initialExpenseState.vendor || '',
                representative: initialExpenseState.representative || '',
                employeeId: data.employees[0]?.id || '',
                notes: initialExpenseState.notes || '',
                status: 'pending',
                invoiceImageUrl: getPrimaryAttachmentDataUrl(normalizedAttachments) || initialExpenseState.invoiceImageUrl || '',
                inventoryItems: initialExpenseState.inventoryItems || [],
                linkedInvoiceId: initialExpenseState.linkedInvoiceId || null,
                fromInventoryEntry: initialExpenseState.fromInventoryEntry || false,
                invoiceNumber: initialExpenseState.invoiceNumber || '',
                linkedDebtId: initialExpenseState.linkedDebtId || '',
                linkedDebtPaymentId: initialExpenseState.linkedDebtPaymentId || '',
                attachments: normalizedAttachments,
            });
            setSelectedVendor(initialExpenseState.vendor || '');
            setCurrentItem(null);
            setIsModalOpen(true);
            setInitialExpenseState(null);
        }
    }, [initialExpenseState, data.settings.expenseCategories, data.employees, setInitialExpenseState]);

    const filteredList = useMemo(() => {
        let list = data.pendingExpenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // فلتر الحالة - إذا كان هناك فلاتر محددة، نطبقها
        if (filterStatuses.length > 0) {
            list = list.filter(item => {
                const itemStatus = item.status || 'pending';
                return filterStatuses.includes(itemStatus);
            });
        }
        
        if (filterDateFrom) list = list.filter(item => item.date.slice(0, 10) >= filterDateFrom);
        if (filterDateTo) list = list.filter(item => item.date.slice(0, 10) <= filterDateTo);
        
        // فلتر النوع - إذا كان هناك فلاتر محددة، نطبقها
        if (filterTypes.length > 0) {
            list = list.filter(item => filterTypes.includes(item.type));
        }
        
        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch);
            const searchNumeric = normalizeTextForSearch(globalSearch, true);
            const hasTextSearch = searchLower.length > 0;
            const hasNumericSearch = searchNumeric.length > 0;

            list = list.filter(item => {
                let textMatches = false;
                if (hasTextSearch) {
                    const matchesCategory = item.category && normalizeTextForSearch(item.category).includes(searchLower);
                    const matchesDescription = item.description && normalizeTextForSearch(item.description).includes(searchLower);
                    const matchesNotes = item.notes && normalizeTextForSearch(item.notes).includes(searchLower);
                    const matchesVendor = item.vendor && normalizeTextForSearch(item.vendor).includes(searchLower);
                    const employeeName = item.employeeId ? data.employees.find(e => e.id === item.employeeId)?.name : '';
                    const matchesEmployee = employeeName && normalizeTextForSearch(employeeName).includes(searchLower);

                    textMatches = matchesCategory || matchesDescription || matchesNotes || matchesVendor || matchesEmployee;
                }

                const numericMatches = hasNumericSearch
                    ? !!(item.amount && normalizeTextForSearch(item.amount.toString(), true).includes(searchNumeric))
                    : false;

                return textMatches || numericMatches;
            });
        }
        return list;
    }, [data.pendingExpenses, data.employees, filterDateFrom, filterDateTo, filterTypes, filterStatuses, globalSearch]);

    const typeTotals = useMemo(() => {
        const totals = { expense: 0, advance: 0 };
        filteredList.forEach(item => {
            if (item.type === 'expense') totals.expense += parseFloat(item.amount) || 0;
            if (item.type === 'advance') totals.advance += parseFloat(item.amount) || 0;
        });
        return totals;
    }, [filteredList]);

    const statusTotals = useMemo(() => {
        const totals = { pending: 0, cancelled: 0, paid: 0 };
        filteredList.forEach(item => {
            const itemStatus = item.status || 'pending';
            totals[itemStatus] += parseFloat(item.amount) || 0;
        });
        return totals;
    }, [filteredList]);

    const {
        paginatedItems: paginatedPendingList,
        totalItems: totalPendingItems,
        pageSize: pendingPageSize,
        currentPage: pendingCurrentPage,
        totalPages: pendingTotalPages,
        changePageSize: changePendingPageSize,
        goToPage: goToPendingPage,
    } = usePagination(filteredList);

    const handleShowAllPending = useCallback(() => {
        setFilterDateFrom('');
        setFilterDateTo('');
        setFilterTypes([]);
        setFilterStatuses([]);
        setGlobalSearch('');
    }, []);

    const handleResetPendingFilters = useCallback(() => {
        setFilterDateFrom(initialRange.start);
        setFilterDateTo(initialRange.end);
        setFilterTypes([]);
        setFilterStatuses([]);
        setGlobalSearch('');
    }, [initialRange.start, initialRange.end]);

    const handleAttachmentsUpload = async (event) => {
        if (formState.type !== 'expense') {
            showToast('يمكن إضافة مرفقات فقط للصرفيات.', 'warning');
            event.target.value = '';
            return;
        }

        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
            return;
        }

        try {
            const newAttachments = await Promise.all(files.map(createAttachmentFromFile));
            setFormState(prev => {
                const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
                const updated = [...existing, ...newAttachments];
                return {
                    ...prev,
                    attachments: updated,
                    invoiceImageUrl: getPrimaryAttachmentDataUrl(updated),
                };
            });
            showToast('تم تحميل المرفقات بنجاح.', 'success');
        } catch (error) {
            console.error('Failed to upload attachments for pending expense', error);
            showToast('تعذر تحميل المرفقات. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            event.target.value = '';
        }
    };

    const handleScanAttachment = useCallback(() => {
        if (typeof openScanner !== 'function') {
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        openScanner({
            title: 'مسح مرفق الصرفية المعلقة',
            defaultFileName: `صرفية-معلقة-${timestamp}`,
            onCapture: (attachment) => {
                if (!attachment) {
                    return;
                }

                setFormState(prev => {
                    const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
                    const updated = [...existing, attachment];
                    return {
                        ...prev,
                        attachments: updated,
                        invoiceImageUrl: getPrimaryAttachmentDataUrl(updated) || prev.invoiceImageUrl,
                    };
                });

                showToast('تم التقاط المرفق عبر السكنر وإضافته للصرفية المعلقة.', 'success');
            },
        });
    }, [openScanner, setFormState, showToast]);

    const removeAttachment = (attachmentId) => {
        setFormState(prev => {
            const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
            const updated = existing.filter(att => att.id !== attachmentId);
            return {
                ...prev,
                attachments: updated,
                invoiceImageUrl: getPrimaryAttachmentDataUrl(updated),
            };
        });
    };

    const handleAttachmentPreview = (attachment) => {
        if (!attachment) {
            return;
        }

        if (isImageAttachment(attachment)) {
            setPreviewAttachment(attachment);
        } else {
            const newWindow = window.open(attachment.dataUrl || attachment.url || attachment.attachmentUrl, '_blank');
            if (!newWindow) {
                showToast('يرجى السماح بالنوافذ المنبثقة لعرض المستند.', 'warning');
            }
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        const isNew = !currentItem;

        if (isNew && !canAddPending) {
            showToast('ليس لديك صلاحية إضافة صرفيات معلقة.', 'error');
            return;
        }

        if (!isNew && !canEditPending) {
            showToast('ليس لديك صلاحية تعديل الصرفيات المعلقة.', 'error');
            return;
        }

        let itemToSave = formState.type === 'expense' ? {
            ...formState,
            vendor: selectedVendor
        } : formState;

        if (formState.type === 'expense') {
            const normalizedAttachments = normalizeAttachmentList(itemToSave.attachments, itemToSave.invoiceImageUrl, 'مرفق');
            itemToSave = {
                ...itemToSave,
                attachments: normalizedAttachments,
                invoiceImageUrl: getPrimaryAttachmentDataUrl(normalizedAttachments),
            };
        } else {
            itemToSave = {
                ...itemToSave,
                attachments: Array.isArray(itemToSave.attachments) ? itemToSave.attachments : [],
            };
        }

        // vendor اختياري، لكن إذا تم اختياره، يجب اختيار representative
        if (formState.type === 'expense' && selectedVendor && !itemToSave.representative) {
            showToast('يجب اختيار المندوب عند اختيار المورد.', 'error');
            return;
        }

        if (formState.type === 'advance' && !itemToSave.employeeId) {
            showToast('يجب اختيار الموظف للسلفة.', 'error');
            return;
        }

        const effectiveId = currentItem?.id || formState.id || crypto.randomUUID();
        const parsedAmount = parseFloat(convertArabicToEnglish(itemToSave.amount || '0')) || 0;

        const pendingItem = {
            ...itemToSave,
            id: effectiveId,
            amount: parsedAmount,
            status: currentItem?.status || 'pending',
            inventoryItems: itemToSave.inventoryItems || [],
            linkedInvoiceId: itemToSave.linkedInvoiceId || null,
            fromInventoryEntry: itemToSave.fromInventoryEntry || false,
            invoiceNumber: itemToSave.invoiceNumber || '',
            attachments: Array.isArray(itemToSave.attachments) ? itemToSave.attachments : [],
        };

        handleDataAction('pendingExpenses', pendingItem, isNew);

        setIsModalOpen(false);
        setCurrentItem(null);
        setSelectedVendor('');
    };

    const handleApprove = (item, { bypassPermissionCheck = false, silent = false } = {}) => {
        if (!bypassPermissionCheck && !canApprovePending) {
            showToast('ليس لديك صلاحية اعتماد الصرفيات المعلقة.', 'error');
            return;
        }

        const updatedData = { ...data };

        if (!updatedData.pendingExpenses.find(p => p.id === item.id)) {
            updatedData.pendingExpenses = [...updatedData.pendingExpenses, item];
        }

        if (item.type === 'expense') {
            const expenseAttachments = normalizeAttachmentList(item.attachments, item.invoiceImageUrl, 'مرفق');
            const primaryAttachment = getPrimaryAttachmentDataUrl(expenseAttachments);
            const expenseData = {
                id: crypto.randomUUID(),
                invoiceNumber: generateInvoiceNumber(),
                date: item.date,
                amount: item.amount,
                category: item.category,
                description: item.description || '',
                vendor: item.vendor || '',
                representative: item.representative || '',
                invoiceImageUrl: primaryAttachment || '',
                attachments: expenseAttachments,
                linkedDebtId: item.linkedDebtId || null,
                linkedDebtPaymentId: item.linkedDebtPaymentId || null,
            };
            updatedData.expenses = [...updatedData.expenses, expenseData];
        } else {
            const advanceData = {
                id: crypto.randomUUID(),
                invoiceNumber: generateInvoiceNumber(),
                date: item.date,
                amount: item.amount,
                category: item.category,
                employeeId: item.employeeId,
                notes: item.notes || ''
            };
            updatedData.advances = [...updatedData.advances, advanceData];
        }

        updatedData.pendingExpenses = updatedData.pendingExpenses.map(p =>
            p.id === item.id
                ? {
                    ...p,
                    status: 'paid',
                    attachments: Array.isArray(item.attachments) ? item.attachments : [],
                    invoiceImageUrl: item.invoiceImageUrl || p.invoiceImageUrl || '',
                }
                : p
        );

        handleDataAction('___FULL_DATA_UPDATE___', updatedData, false);

        if (!silent) {
            showToast(`تمت الموافقة وإضافة ${item.type === 'expense' ? 'الصرفية' : 'السلفة'} بنجاح!`, 'success');
        }
    };

    const handleCancel = (item) => {
        if (!canCancelPending) {
            showToast('ليس لديك صلاحية إلغاء الصرفيات المعلقة.', 'error');
            return;
        }

        const updatedItem = { ...item, status: 'cancelled' };
        handleDataAction('pendingExpenses', updatedItem, false);
        showToast('تم إلغاء الطلب بنجاح!', 'success');
    };

    const totalFilteredAmount = filteredList.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

    return (
        <div className="space-y-6 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-3">
                    <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    الصرفيات المعلقة
                </h2>
            </div>

            {/* بطاقة المجموع والفلاتر */}
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-xl border-2 border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
                    <div className="col-span-1 text-xl font-bold p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/40 dark:to-amber-800/30 text-amber-800 dark:text-amber-200 flex flex-col items-center justify-center shadow-xl border-r-4 border-amber-600 dark:border-amber-400 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                        <Calculator className="w-6 h-6 mb-1" />
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">المجموع المفلتر:</span>
                        <span className="font-extrabold text-2xl mt-1">
                            {formatCurrencyDisplay(totalFilteredAmount)}
                        </span>
                    </div>

                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-700 shadow-inner">
                        <h3 className="md:col-span-3 w-full text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center border-b pb-2 mb-2">
                            <Filter className="w-5 h-5 ml-2" /> فلاتر الجدول
                        </h3>
                        
                        <div className="md:col-span-3 flex flex-col space-y-1 relative">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">البحث الشامل</label>
                            <input
                                type="text"
                                value={globalSearch}
                                onChange={(e) => setGlobalSearch(e.target.value)}
                                placeholder="اكتب كلمة أو مبلغ للبحث..."
                                className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-amber-500 focus:border-amber-500"
                                data-testid="input-search"
                            />
                            <Search className="w-5 h-5 absolute right-3 top-1/2 transform translate-y-1/2 text-gray-400 mt-2" />
                        </div>

                        <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">التاريخ من</label>
                            <input
                                type="date"
                                value={filterDateFrom}
                                onChange={(e) => setFilterDateFrom(e.target.value)}
                                className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                data-testid="input-date-from"
                            />
                        </div>

                        <div className="flex flex-col space-y-1">
                            <label className="text-sm font-medium text-gray-600 dark:text-gray-400">التاريخ إلى</label>
                            <input
                                type="date"
                                value={filterDateTo}
                                onChange={(e) => setFilterDateTo(e.target.value)}
                                className="p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-amber-500 focus:border-amber-500"
                                data-testid="input-date-to"
                            />
                        </div>

                        <div className="md:col-span-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={handleShowAllPending}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold shadow-sm transition-colors duration-200"
                            >
                                <Eye className="w-4 h-4" />
                                عرض الكل
                            </button>
                            <button
                                type="button"
                                onClick={handleResetPendingFilters}
                                className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors duration-200 font-semibold"
                                data-testid="button-reset-filters"
                            >
                                <RotateCcw className="w-5 h-5" />
                                إعادة تعيين
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* بطاقات فلتر النوع */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <FilterStatCard
                    title="الصرفيات"
                    value={formatCurrencyDisplay(typeTotals.expense)}
                    icon={TrendingDown}
                    onClick={() => setFilterTypes(prev => (
                        prev.includes('expense') ? prev.filter(t => t !== 'expense') : [...prev, 'expense']
                    ))}
                    active={filterTypes.includes('expense')}
                    themeKey="rose"
                    size="md"
                    dataTestId="filter-card-expenses"
                />
                <FilterStatCard
                    title="السلف"
                    value={formatCurrencyDisplay(typeTotals.advance)}
                    icon={Coins}
                    onClick={() => setFilterTypes(prev => (
                        prev.includes('advance') ? prev.filter(t => t !== 'advance') : [...prev, 'advance']
                    ))}
                    active={filterTypes.includes('advance')}
                    themeKey="purple"
                    size="md"
                    dataTestId="filter-card-advances"
                />
            </div>

            {/* بطاقات فلتر الحالة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <FilterStatCard
                    title="الطلبات المعلقة"
                    value={formatCurrencyDisplay(statusTotals.pending)}
                    icon={Clock}
                    onClick={() => setFilterStatuses(prev => (
                        prev.includes('pending') ? prev.filter(s => s !== 'pending') : [...prev, 'pending']
                    ))}
                    active={filterStatuses.includes('pending')}
                    themeKey="amber"
                    size="md"
                    dataTestId="filter-status-pending"
                />
                <FilterStatCard
                    title="الطلبات المعتمدة"
                    value={formatCurrencyDisplay(statusTotals.paid)}
                    icon={CheckCircle}
                    onClick={() => setFilterStatuses(prev => (
                        prev.includes('paid') ? prev.filter(s => s !== 'paid') : [...prev, 'paid']
                    ))}
                    active={filterStatuses.includes('paid')}
                    themeKey="emerald"
                    size="md"
                    dataTestId="filter-status-paid"
                />
                <FilterStatCard
                    title="الطلبات الملغاة"
                    value={formatCurrencyDisplay(statusTotals.cancelled)}
                    icon={XCircle}
                    onClick={() => setFilterStatuses(prev => (
                        prev.includes('cancelled') ? prev.filter(s => s !== 'cancelled') : [...prev, 'cancelled']
                    ))}
                    active={filterStatuses.includes('cancelled')}
                    themeKey="rose"
                    size="md"
                    dataTestId="filter-status-cancelled"
                />
            </div>


            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => {
                        setCurrentItem(null);
                        setIsModalOpen(true);
                    }}
                    disabled={!canAddPending}
                    className={`flex items-center px-6 py-3 rounded-xl shadow-lg transition duration-200 ${canAddPending ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed'}`}
                    data-testid="button-add-pending"
                >
                    <Plus className="w-5 h-5 ml-2" />
                    إضافة صرفية معلقة
                </button>

                <div className="flex flex-wrap gap-2 space-x-reverse">
                    <button onClick={() => window.print()} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                        <Printer className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200">
                        <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>

            {/* الجدول */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600 rounded-t-xl">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">التاريخ</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">النوع</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الفئة</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">المبلغ</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">التفاصيل</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الحالة</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">المرفقات</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredList.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                    لا توجد صرفيات معلقة
                                </td>
                            </tr>
                        ) : (
                            paginatedPendingList.map(item => {
                                const employee = item.employeeId ? data.employees.find(e => e.id === item.employeeId) : null;
                                return (
                                    <tr
                                        key={item.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 cursor-pointer"
                                        onClick={() => setViewItem(item)}
                                        data-testid={`row-${item.id}`}
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {formatDateDDMMYYYY(item.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold
                                                ${item.type === 'expense' 
                                                    ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                                                    : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                                }
                                            `}>
                                                {item.type === 'expense' ? 'صرفية' : 'سلفة'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                            {item.category}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-600 dark:text-blue-400" data-testid={`amount-${item.id}`}>
                                            {formatCurrencyDisplay(item.amount)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                            {item.type === 'expense' ? (
                                                <div>
                                                    <p>{item.description}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {item.vendor && item.representative ? `${item.vendor} - ${item.representative}` : 'بدون مورد'}
                                                    </p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <p>{employee?.name}</p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.notes}</p>
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm
                                                ${item.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700' : ''}
                                                ${item.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700' : ''}
                                                ${item.status === 'cancelled' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700' : ''}
                                            `} data-testid={`status-badge-${item.id}`}>
                                                {item.status === 'pending' && <Clock className="w-3 h-3" />}
                                                {item.status === 'paid' && <CheckCircle className="w-3 h-3" />}
                                                {item.status === 'cancelled' && <XCircle className="w-3 h-3" />}
                                                {item.status === 'pending' ? 'معلقة' : item.status === 'paid' ? 'مصروفة' : 'ملغية'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                                            {(() => {
                                                const attachments = normalizeAttachmentList(item.attachments, item.invoiceImageUrl, 'مرفق');
                                                if (attachments.length === 0) {
                                                    return <span className="text-gray-400 text-xs">لا توجد</span>;
                                                }

                                                return (
                                                    <div className="flex flex-wrap gap-2">
                                                        {attachments.map(attachment => (
                                                            <button
                                                                key={attachment.id}
                                                                type="button"
                                                                onClick={() => handleAttachmentPreview(attachment)}
                                                                className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/60 text-xs font-semibold transition"
                                                                data-testid={`button-view-invoice-${item.id}-${attachment.id}`}
                                                            >
                                                                {attachment.name || 'مرفق'}
                                                            </button>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                                            {item.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    {canEditPending && (
                                                        <button
                                                            onClick={() => {
                                                                setCurrentItem(item);
                                                                setIsModalOpen(true);
                                                            }}
                                                            className="px-3 py-1 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                                                            data-testid={`button-edit-${item.id}`}
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                            تعديل
                                                        </button>
                                                    )}
                                                    {canApprovePending && (
                                                        <button
                                                            onClick={() => handleApprove(item)}
                                                            className="px-3 py-1 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                                                            data-testid={`button-approve-${item.id}`}
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            موافقة
                                                        </button>
                                                    )}
                                                    {canCancelPending && (
                                                        <button
                                                            onClick={() => handleCancel(item)}
                                                            className="px-3 py-1 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center gap-1 text-xs font-semibold"
                                                            data-testid={`button-cancel-${item.id}`}
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                            إلغاء
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                pageSize={pendingPageSize}
                onPageSizeChange={changePendingPageSize}
                currentPage={pendingCurrentPage}
                totalPages={pendingTotalPages}
                onPageChange={goToPendingPage}
                totalItems={totalPendingItems}
            />

            {/* Modal */}
            {isModalOpen && (
                <Modal
                    title={currentItem ? 'تعديل صرفية معلقة' : 'إضافة صرفية معلقة جديدة'}
                    onClose={() => { setIsModalOpen(false); setPendingAutoApprove(false); }}
                    size="xl"
                >
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <InputField
                            label="تاريخ ووقت العملية"
                            type="datetime-local"
                            value={formState.date || getDefaultDateTime()}
                            onChange={(e) => setFormState({ ...formState, date: e.target.value })}
                            required
                        />

                        <div className="flex flex-col space-y-1 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">نوع الصرف</label>
                            <select
                                value={formState.type}
                                onChange={(e) => setFormState({
                                    ...formState,
                                    type: e.target.value,
                                    category: '',
                                    description: '',
                                    vendor: '',
                                    representative: '',
                                    employeeId: e.target.value === 'advance' ? (data.employees[0]?.id || '') : '',
                                    notes: '',
                                    attachments: [],
                                    invoiceImageUrl: '',
                                })}
                                required
                                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                                data-testid="select-type"
                            >
                                <option value="expense">صرفية</option>
                                <option value="advance">سلفة</option>
                            </select>
                        </div>

                        {formState.type === 'expense' ? (
                            <>
                                <div className="flex flex-col space-y-1 text-right">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        الشركة الموردة <span className="text-xs text-gray-500">(اختياري)</span>
                                    </label>
                                    <select
                                        value={selectedVendor}
                                        onChange={(e) => {
                                            const newVendor = e.target.value;
                                            setSelectedVendor(newVendor);
                                            if (newVendor) {
                                                const defaultRep = data.settings.representatives.find(r => r.vendor === newVendor)?.name || '';
                                                setFormState(prev => ({ ...prev, vendor: newVendor, representative: defaultRep }));
                                            } else {
                                                setFormState(prev => ({ ...prev, vendor: '', representative: '' }));
                                            }
                                        }}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                                        data-testid="select-vendor"
                                    >
                                        <option value="">بدون مورد</option>
                                        {data.settings.vendors.map(vendor => (
                                            <option key={vendor} value={vendor}>{vendor}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedVendor && (
                                    <div className="flex flex-col space-y-1 text-right">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            المندوب المسؤول <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={formState.representative || ''}
                                            onChange={(e) => setFormState({ ...formState, representative: e.target.value })}
                                            required
                                            className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                                            data-testid="select-representative"
                                        >
                                            <option value="" disabled>اختر المندوب</option>
                                            {data.settings.representatives
                                                .filter(r => r.vendor === selectedVendor)
                                                .map(rep => (
                                                    <option key={rep.name} value={rep.name}>{rep.name}</option>
                                                ))
                                            }
                                        </select>
                                    </div>
                                )}

                                <div className="flex flex-col space-y-1 text-right">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فئة المصروف</label>
                                    <select
                                        value={formState.category}
                                        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                                        required
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                                        data-testid="select-category"
                                    >
                                        <option value="" disabled>اختر الفئة</option>
                                        {data.settings.expenseCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <InputField
                                    label="المبلغ"
                                    type="text"
                                    value={formState.amount}
                                    onChange={(e) => {
                                        let newValue = convertArabicToEnglish(e.target.value);
                                        newValue = newValue.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                        setFormState({ ...formState, amount: newValue });
                                    }}
                                    required
                                    currency
                                />

                                <InputField
                                    label="الوصف المفصل"
                                    type="textarea"
                                    value={formState.description}
                                    onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                                    required
                                    textarea
                                />
                            </>
                        ) : (
                            <>
                                <div className="flex flex-col space-y-1 text-right">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">الموظف المعني</label>
                                    <select
                                        value={formState.employeeId}
                                        onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                                        required
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                                        data-testid="select-employee"
                                    >
                                        <option value="" disabled>اختر الموظف</option>
                                        {data.employees.map(emp => (
                                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col space-y-1 text-right">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فئة السلفة</label>
                                    <select
                                        value={formState.category}
                                        onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                                        required
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150 text-right"
                                        data-testid="select-advance-category"
                                    >
                                        <option value="" disabled>اختر الفئة</option>
                                        {data.settings.advanceCategories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <InputField
                                    label="المبلغ"
                                    type="text"
                                    value={formState.amount}
                                    onChange={(e) => {
                                        let newValue = convertArabicToEnglish(e.target.value);
                                        newValue = newValue.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                        setFormState({ ...formState, amount: newValue });
                                    }}
                                    required
                                    currency
                                />

                                <InputField
                                    label="ملاحظات"
                                    type="textarea"
                                    value={formState.notes}
                                    onChange={(e) => setFormState({ ...formState, notes: e.target.value })}
                                    textarea
                                />
                            </>
                        )}

                    {formState.type === 'expense' && (
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">مرفقات الصرفية (صور / مستندات)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    multiple
                                    onChange={handleAttachmentsUpload}
                                    className="flex-1 p-3 border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150"
                                />
                                <button
                                    type="button"
                                    onClick={handleScanAttachment}
                                    disabled={!scannerAvailable}
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow transition ${scannerAvailable ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                    title={scannerAvailable ? 'التقاط صورة عبر السكنر' : 'السكنر غير متاح في هذا الجهاز'}
                                >
                                    <Scan className="w-5 h-5" />
                                    مسح عبر السكنر
                                </button>
                            </div>
                            {attachmentsList.length > 0 && (
                                <div className="space-y-2">
                                    {attachmentsList.map(attachment => (
                                        <div key={attachment.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{attachment.name}</p>
                                                {attachment.type && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{attachment.type}</p>}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAttachmentPreview(attachment)}
                                                    className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                                                >
                                                    معاينة
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttachment(attachment.id)}
                                                    className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50"
                                                >
                                                    إزالة
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                        <ActionButton type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                            <Save className="w-5 h-5 ml-2" />
                            {currentItem ? 'حفظ التعديلات' : 'إضافة'}
                        </ActionButton>
                    </form>
                </Modal>
            )}

            {/* Modal معاينة المرفقات */}
            {previewAttachment && isImageAttachment(previewAttachment) && (
                <Modal
                    title={`معاينة المرفق: ${previewAttachment.name || 'مرفق'}`}
                    onClose={() => setPreviewAttachment(null)}
                    size="xl"
                >
                    <div className="space-y-4">
                        <div
                            className={`relative overflow-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 ${previewZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                            onClick={() => setPreviewZoomed(prev => !prev)}
                        >
                            <img
                                src={previewAttachment.dataUrl || previewAttachment.url || previewAttachment.attachmentUrl}
                                alt={previewAttachment.name || 'مرفق'}
                                className={`mx-auto transition-transform duration-300 ${previewZoomed ? 'scale-150' : 'scale-100'} max-h-[70vh]`}
                            />
                        </div>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">اضغط على الصورة للتكبير أو التصغير.</p>
                    </div>
                </Modal>
            )}

            {/* Modal معاينة التفاصيل */}
            {viewItem && (
                <Modal 
                    title={`معاينة ${viewItem.type === 'expense' ? 'الصرفية' : 'السلفة'} المعلقة`}
                    onClose={() => setViewItem(null)}
                >
                    <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">التاريخ</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {formatDateTimeDDMMYYYY(viewItem.date)}
                                </p>
                            </div>
                            
                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">النوع</p>
                                <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold
                                    ${viewItem.type === 'expense' 
                                        ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200' 
                                        : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                                    }
                                `}>
                                    {viewItem.type === 'expense' ? 'صرفية' : 'سلفة'}
                                </span>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المبلغ</p>
                                <p className="text-2xl font-extrabold text-teal-600 dark:text-teal-400">
                                    {formatCurrencyDisplay(viewItem.amount)}
                                </p>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الفئة</p>
                                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                    {viewItem.category}
                                </p>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الحالة</p>
                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold shadow-sm
                                    ${viewItem.status === 'pending' ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-700' : ''}
                                    ${viewItem.status === 'paid' ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700' : ''}
                                    ${viewItem.status === 'cancelled' ? 'bg-rose-100 dark:bg-rose-900/50 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700' : ''}
                                `}>
                                    {viewItem.status === 'pending' && <Clock className="w-4 h-4" />}
                                    {viewItem.status === 'paid' && <CheckCircle className="w-4 h-4" />}
                                    {viewItem.status === 'cancelled' && <XCircle className="w-4 h-4" />}
                                    {viewItem.status === 'pending' ? 'معلقة' : viewItem.status === 'paid' ? 'مصروفة' : 'ملغية'}
                                </span>
                            </div>

                            {viewItem.type === 'expense' ? (
                                <>
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الوصف</p>
                                        <p className="text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-3 rounded-lg">
                                            {viewItem.description || 'لا يوجد وصف'}
                                        </p>
                                    </div>

                                    {viewItem.vendor && (
                                        <>
                                            <div className="col-span-2 sm:col-span-1">
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الشركة الموردة</p>
                                                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                    {viewItem.vendor}
                                                </p>
                                            </div>

                                            <div className="col-span-2 sm:col-span-1">
                                                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">المندوب المسؤول</p>
                                                <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                                    {viewItem.representative || 'غير محدد'}
                                                </p>
                                            </div>
                                        </>
                                    )}

                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">المرفقات</p>
                                        {(() => {
                                            const attachments = normalizeAttachmentList(viewItem.attachments, viewItem.invoiceImageUrl, 'مرفق');
                                            if (attachments.length === 0) {
                                                return <span className="text-xs text-gray-400">لا توجد مرفقات</span>;
                                            }

                                            return (
                                                <div className="flex flex-wrap gap-2">
                                                    {attachments.map(attachment => (
                                                        <button
                                                            key={attachment.id}
                                                            type="button"
                                                            onClick={() => handleAttachmentPreview(attachment)}
                                                            className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/60"
                                                        >
                                                            {attachment.name || 'مرفق'}
                                                        </button>
                                                    ))}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">الموظف المعني</p>
                                        <p className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {data.employees.find(e => e.id === viewItem.employeeId)?.name || 'غير محدد'}
                                        </p>
                                    </div>

                                    <div className="col-span-2">
                                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ملاحظات</p>
                                        <p className="text-base text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 p-3 rounded-lg">
                                            {viewItem.notes || 'لا توجد ملاحظات'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-2 pt-4 border-t border-gray-300 dark:border-gray-600">
                            <button
                                onClick={() => {
                                    setViewItem(null);
                                    setCurrentItem(viewItem);
                                    setIsModalOpen(true);
                                }}
                                className="flex-1 px-4 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                                data-testid={`button-edit-preview-${viewItem.id}`}
                            >
                                <Edit2 className="w-4 h-4" />
                                تعديل
                            </button>
                            {viewItem.status === 'pending' && (
                                <>
                                    <button
                                        onClick={() => {
                                            setViewItem(null);
                                            handleApprove(viewItem);
                                        }}
                                        className="flex-1 px-4 py-2 bg-green-600 dark:bg-green-500 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                                        data-testid={`button-approve-preview-${viewItem.id}`}
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        موافقة
                                    </button>
                                    <button
                                        onClick={() => {
                                            setViewItem(null);
                                            handleCancel(viewItem);
                                        }}
                                        className="flex-1 px-4 py-2 bg-red-600 dark:bg-red-500 text-white rounded-lg hover:bg-red-700 dark:hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                                        data-testid={`button-cancel-preview-${viewItem.id}`}
                                    >
                                        <XCircle className="w-4 h-4" />
                                        إلغاء
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
});



/**
 * 3.3. EmployeePage Component
 */
const EmployeePageComponent = React.memo(({ data, handleDataAction, handleDelete, setPrintReportData, setIsReportModalOpen, showToast, handleRefresh, openScanner }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const [formState, setFormState] = useState({});
    const [globalSearch, setGlobalSearch] = useState('');
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const searchActive = useMemo(() => globalSearch.trim().length > 0, [globalSearch]);
    const [employeeDocPreview, setEmployeeDocPreview] = useState(null);
    const [employeeDocZoomed, setEmployeeDocZoomed] = useState(false);
    const scannerAvailable = typeof openScanner === 'function';

    useEffect(() => {
        if (employeeDocPreview) {
            setEmployeeDocZoomed(false);
        }
    }, [employeeDocPreview]);

    
    const formatDOB = (dateString) => {
        if (!dateString) return 'غير محدد';
        return formatDateDDMMYYYY(dateString);
    };

    const filteredList = useMemo(() => {
        let list = data.employees.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch);
            const searchNumeric = normalizeTextForSearch(globalSearch, true);
            const hasTextSearch = searchLower.length > 0;
            const hasNumericSearch = searchNumeric.length > 0;

            list = list.filter(item => {
                let textMatches = false;
                if (hasTextSearch) {
                    const matchesName = item.name && normalizeTextForSearch(item.name).includes(searchLower);
                    const matchesDept = item.department && normalizeTextForSearch(item.department).includes(searchLower);
                    const matchesJob = item.jobTitle && normalizeTextForSearch(item.jobTitle).includes(searchLower);

                    textMatches = matchesName || matchesDept || matchesJob;
                }

                const numericMatches = hasNumericSearch
                    ? !!(item.salary && normalizeTextForSearch(item.salary.toString(), true).includes(searchNumeric))
                    : false;

                return textMatches || numericMatches;
            });
        }
        return list;
    }, [data.employees, globalSearch]);

    const {
        paginatedItems: paginatedEmployees,
        totalItems: totalEmployees,
        pageSize: employeePageSize,
        currentPage: employeeCurrentPage,
        totalPages: employeeTotalPages,
        changePageSize: changeEmployeePageSize,
        goToPage: goToEmployeePage,
    } = usePagination(filteredList);

    useEffect(() => {
        if (currentEmployee) {
            setFormState({
                ...currentEmployee,
                docUrl: currentEmployee.docUrl || '',
                docName: currentEmployee.docName || '',
                docType: currentEmployee.docType || '',
            });
        } else {
            setFormState({
                name: '',
                phone: '',
                salary: '',
                department: data.settings.departments[0] || '',
                jobTitle: data.settings.jobTitles[0] || '',
                docUrl: '',
                docName: '',
                docType: '',
                dateOfBirth: '',
                id: null,
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
        setFormState({
            ...employee,
            docUrl: employee.docUrl || '',
            docName: employee.docName || '',
            docType: employee.docType || '',
        });
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

    const handleEmployeeDocUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        try {
            const attachment = await createAttachmentFromFile(file);
            setFormState(prev => ({
                ...prev,
                docUrl: attachment.dataUrl,
                docName: attachment.name,
                docType: attachment.type,
            }));
            showToast('تم تحميل المستند الشخصي بنجاح.', 'success');
        } catch (error) {
            console.error('Failed to upload employee document', error);
            showToast('تعذر تحميل المستند. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            event.target.value = '';
        }
    };

    const handleScanEmployeeDoc = useCallback(() => {
        if (typeof openScanner !== 'function') {
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        openScanner({
            title: 'مسح مستند الموظف',
            defaultFileName: `مستند-موظف-${timestamp}`,
            onCapture: (attachment) => {
                if (!attachment) {
                    return;
                }

                const sourceUrl = attachment.dataUrl || attachment.url || attachment.attachmentUrl || '';
                if (!sourceUrl) {
                    return;
                }

                setFormState(prev => ({
                    ...prev,
                    docUrl: sourceUrl,
                    docName: attachment.name || `مستند-${timestamp}`,
                    docType: attachment.type || 'image/jpeg',
                }));
                showToast('تم التقاط المستند الشخصي عبر السكنر.', 'success');
            },
        });
    }, [openScanner, showToast]);

    const handleRemoveEmployeeDoc = () => {
        setFormState(prev => ({ ...prev, docUrl: '', docName: '', docType: '' }));
    };

    const previewEmployeeDoc = () => {
        if (!formState.docUrl) {
            return;
        }
        const attachment = {
            dataUrl: formState.docUrl,
            name: formState.docName || 'المستند الشخصي',
            type: formState.docType || '',
        };
        if (isImageAttachment(attachment)) {
            setEmployeeDocPreview(attachment);
        } else {
            const newWindow = window.open(attachment.dataUrl, '_blank');
            if (!newWindow) {
                showToast('يرجى السماح بالنوافذ المنبثقة لعرض المستند.', 'warning');
            }
        }
    };

    const previewEmployeeDocFromDetails = () => {
        if (!currentEmployee?.docUrl) {
            return;
        }
        const attachment = {
            dataUrl: currentEmployee.docUrl,
            name: currentEmployee.docName || 'المستند الشخصي',
            type: currentEmployee.docType || '',
        };
        if (isImageAttachment(attachment)) {
            setEmployeeDocPreview(attachment);
        } else {
            const newWindow = window.open(attachment.dataUrl, '_blank');
            if (!newWindow) {
                showToast('يرجى السماح بالنوافذ المنبثقة لعرض المستند.', 'warning');
            }
        }
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

    const downloadEmployeeTemplate = () => {
        const template = [{
            'اسم الموظف': 'محمد علي',
            'تاريخ الميلاد (yyyy-mm-dd)': '1990-05-12',
            'القسم': data.settings.departments[0] || 'الإدارة',
            'المنصب': data.settings.jobTitles[0] || 'موظف',
            'الراتب الشهري': 750000,
            'رقم الهاتف': '07701234567',
            'رابط المستندات': 'https://example.com/docs.pdf'
        }];

        const worksheet = XLSX.utils.json_to_sheet(template);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الموظفون');
        XLSX.writeFile(workbook, `نموذج_الموظفين_${new Date().toISOString().split('T')[0]}.xlsx`);
        showToast('تم تحميل نموذج Excel بنجاح!', 'success');
    };

    const handleEmployeeFileUpload = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        setSelectedFile(file);
        showToast('تم اختيار الملف، اضغط على "استيراد البيانات" للمتابعة.', 'info');
    };

    const importEmployeesFromExcel = () => {
        if (!selectedFile) {
            showToast('يرجى اختيار ملف Excel أولاً', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (!e.target?.result) {
                    showToast('تعذر قراءة ملف Excel', 'error');
                    return;
                }

                const fileData = new Uint8Array(e.target.result as ArrayBuffer);
                const workbook = XLSX.read(fileData, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                if (jsonData.length === 0) {
                    showToast('الملف فارغ أو غير صالح', 'error');
                    return;
                }

                let successCount = 0;
                let errorCount = 0;

                jsonData.forEach((row, index) => {
                    try {
                        const nameCell = row['اسم الموظف'] || row['الاسم'];
                        if (!nameCell) {
                            errorCount++;
                            return;
                        }

                        const processedSalary = convertArabicToEnglish(row['الراتب الشهري'] || row['الراتب'] || '0');
                        const employeeId = crypto.randomUUID();
                        const dateOfBirth = row['تاريخ الميلاد (yyyy-mm-dd)'] || row['تاريخ الميلاد'] || '';

                        const newEmployee = {
                            id: employeeId,
                            name: nameCell.toString().trim(),
                            dateOfBirth: dateOfBirth ? dateOfBirth.toString().trim() : '',
                            department: (row['القسم'] || data.settings.departments[0] || '').toString(),
                            jobTitle: (row['المنصب'] || row['الوظيفة'] || data.settings.jobTitles[0] || '').toString(),
                            salary: parseFloat(processedSalary || 0) || 0,
                            phone: convertArabicToEnglish((row['رقم الهاتف'] || '').toString()),
                            docUrl: row['رابط المستندات'] ? row['رابط المستندات'].toString() : '',
                        };

                        handleDataAction('employees', newEmployee, true);
                        successCount++;
                    } catch (error) {
                        console.error(`فشل استيراد السطر ${index + 1}:`, error);
                        errorCount++;
                    }
                });

                showToast(`تم استيراد ${successCount} موظف${errorCount ? ` (أخطاء: ${errorCount})` : ''}`, successCount ? 'success' : 'error');
                setIsImportModalOpen(false);
                setSelectedFile(null);
                if (typeof handleRefresh === 'function') {
                    handleRefresh();
                }
            } catch (error) {
                console.error('خطأ في قراءة ملف Excel:', error);
                showToast('حدث خطأ في قراءة ملف Excel', 'error');
            }
        };

        reader.onerror = () => {
            showToast('تعذر قراءة ملف Excel', 'error');
        };

        reader.readAsArrayBuffer(selectedFile);
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

            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => openModal()}
                    className="flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl hover:from-green-600 hover:to-teal-600 shadow-lg transition duration-200"
                    data-testid="button-add-employee"
                >
                    <UserPlus className="w-5 h-5 ml-2" />
                    إضافة موظف جديد
                </button>

                <div className="flex flex-wrap gap-2 space-x-reverse">
                    <button onClick={handlePrintAll} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                        <Printer className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={() => setIsImportModalOpen(true)} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg transition duration-200" data-testid="button-import-excel">
                        <Upload className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={handleExportAll} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition duration-200">
                        <Download className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200">
                        <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">اسم الموظف</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">تاريخ الميلاد</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">القسم</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الراتب الأساسي (د.ع.)</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredList.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا يوجد موظفين مسجلين.</td></tr>
                        ) : (
                            paginatedEmployees.map(emp => (
                                <tr
                                    key={emp.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 ${searchActive ? 'bg-amber-50 dark:bg-amber-900/40 border-r-4 border-amber-400' : ''}`}
                                >
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
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">القسم</label>
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
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المنصب/العمل</label>
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
                        
                        <div className="space-y-2 text-right">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المستندات الشخصية (صورة / PDF)</label>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="file"
                                    accept="image/*,application/pdf"
                                    onChange={handleEmployeeDocUpload}
                                    className="flex-1 p-3 border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150"
                                />
                                <button
                                    type="button"
                                    onClick={handleScanEmployeeDoc}
                                    disabled={!scannerAvailable}
                                    className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow transition ${scannerAvailable ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                    title={scannerAvailable ? 'التقاط صورة عبر السكنر' : 'السكنر غير متاح في هذا الجهاز'}
                                >
                                    <Scan className="w-5 h-5" />
                                    مسح عبر السكنر
                                </button>
                            </div>
                            {formState.docUrl && (
                                <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{formState.docName || 'مستند مرفوع'}</p>
                                        {formState.docType && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{formState.docType}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={previewEmployeeDoc}
                                            className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                                        >
                                            معاينة
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleRemoveEmployeeDoc}
                                            className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50"
                                        >
                                            إزالة
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        <ActionButton type="submit" className="w-full bg-teal-600 hover:bg-teal-700">
                            <Save className="w-5 h-5 ml-2" />
                            {currentEmployee ? 'حفظ التعديلات' : 'إضافة موظف'}
                        </ActionButton>
                    </form>
                </Modal>
            )}

            {isDetailsModalOpen && currentEmployee && (
                <Modal title={`تفاصيل الموظف: ${currentEmployee.name}`} onClose={() => setIsDetailsModalOpen(false)} size="sm">
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">معلومات أساسية</h4>
                        <p className="flex items-center text-lg dark:text-gray-200"><CalendarCheck className="w-5 h-5 ml-2 text-indigo-500" /> **تاريخ الميلاد:** {formatDOB(currentEmployee.dateOfBirth)}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><Briefcase className="w-5 h-5 ml-2 text-indigo-500" /> **القسم:** {currentEmployee.department}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><List className="w-5 h-5 ml-2 text-indigo-500" /> **المنصب:** {currentEmployee.jobTitle}</p>
                        <p className="flex items-center text-lg dark:text-gray-200"><Phone className="w-5 h-5 ml-2 text-indigo-500" /> **الهاتف:** {currentEmployee.phone || 'غير متوفر'}</p>
                        
                        {currentEmployee.docUrl && (
                            <button
                                onClick={previewEmployeeDocFromDetails}
                                className="flex items-center justify-center w-full p-3 text-white bg-indigo-600 dark:bg-indigo-700 rounded-xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition space-x-2 space-x-reverse font-semibold mt-4"
                            >
                                <ExternalLink className="w-5 h-5 ml-2" />
                                عرض المستندات الشخصية
                            </button>
                        )}

                        
                    </div>
                </Modal>
            )}

            {isImportModalOpen && (
                <Modal title="استيراد الموظفين من Excel" onClose={() => { setIsImportModalOpen(false); setSelectedFile(null); }}>
                    <div className="space-y-6">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-xl">
                            <h3 className="font-bold text-blue-800 dark:text-blue-200 mb-2 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                خطوات الاستيراد:
                            </h3>
                            <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300">
                                <li>قم بتحميل نموذج Excel الفارغ.</li>
                                <li>أضف بيانات الموظفين مع الالتزام بالتنسيق.</li>
                                <li>ارفع الملف ثم اضغط على "استيراد البيانات".</li>
                            </ol>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={downloadEmployeeTemplate}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 shadow-lg transition duration-200"
                            >
                                <FileDown className="w-5 h-5" />
                                تحميل نموذج Excel
                            </button>

                            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6">
                                <label className="flex flex-col items-center justify-center cursor-pointer">
                                    <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-2" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {selectedFile ? selectedFile.name : 'اضغط لاختيار ملف Excel'}
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">(xlsx, xls)</span>
                                    <input type="file" accept=".xlsx,.xls" onChange={handleEmployeeFileUpload} className="hidden" />
                                </label>
                            </div>

                            <button
                                onClick={importEmployeesFromExcel}
                                disabled={!selectedFile}
                                className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl shadow-lg transition duration-200 ${selectedFile ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                            >
                                <Upload className="w-5 h-5" />
                                استيراد البيانات
                            </button>
                        </div>
                    </div>
                </Modal>
            )}

            {employeeDocPreview && isImageAttachment(employeeDocPreview) && (
                <Modal title={`معاينة المستند: ${employeeDocPreview.name}`} onClose={() => setEmployeeDocPreview(null)} size="xl">
                    <div className="space-y-4">
                        <div
                            className={`relative overflow-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 ${employeeDocZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                            onClick={() => setEmployeeDocZoomed(prev => !prev)}
                        >
                            <img
                                src={employeeDocPreview.dataUrl || employeeDocPreview.url || employeeDocPreview.attachmentUrl}
                                alt={employeeDocPreview.name}
                                className={`mx-auto transition-transform duration-300 ${employeeDocZoomed ? 'scale-150' : 'scale-100'} max-h-[70vh]`}
                            />
                        </div>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">اضغط على الصورة للتكبير أو التصغير.</p>
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
    const [payslipToPrint, setPayslipToPrint] = useState(null);

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

    const {
        paginatedItems: paginatedPayrollEmployees,
        totalItems: totalPayrollEmployees,
        pageSize: payrollPageSize,
        currentPage: payrollCurrentPage,
        totalPages: payrollTotalPages,
        changePageSize: changePayrollPageSize,
        goToPage: goToPayrollPage,
    } = usePagination(filteredEmployees);

    // حساب مجاميع الرواتب للكارتات
    const salaryTotals = useMemo(() => {
        let totalAll = 0;
        let totalPaid = 0;
        let totalUnpaid = 0;
        
        filteredEmployees.forEach(emp => {
            const salaryData = calculateEmployeeSalary(emp, selectedMonth, selectedYear);
            totalAll += salaryData.netSalary;
            if (salaryData.isPaid) {
                totalPaid += salaryData.netSalary;
            } else {
                totalUnpaid += salaryData.netSalary;
            }
        });
        
        return { totalAll, totalPaid, totalUnpaid };
    }, [filteredEmployees, selectedMonth, selectedYear, calculateEmployeeSalary]);

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

    // دالة استرجاع الراتب
    const handleRefundSalary = (employeeId) => {
        const employee = data.employees.find(e => e.id === employeeId);
        if (!employee) return;

        const salaryData = calculateEmployeeSalary(employee, selectedMonth, selectedYear);
        
        if (!salaryData.isPaid) {
            showToast('هذا الراتب غير مدفوع أصلاً!', 'warning');
            return;
        }

        if (!window.confirm(`⚠️ هل أنت متأكد من استرجاع راتب ${employee.name}؟\n\nسيتم:\n- إرجاع المبلغ ${formatCurrencyDisplay(salaryData.netSalary)} إلى الصندوق\n- تغيير حالة الراتب إلى "غير مدفوع"`)) {
            return;
        }

        // البحث عن سجل الراتب
        let payrollRecord = data.payroll.find(p => 
            p.employeeId === employeeId && 
            p.month === selectedMonth && 
            p.year === selectedYear
        );

        if (!payrollRecord) {
            showToast('خطأ: لم يتم العثور على سجل الراتب!', 'error');
            return;
        }

        // تحديث حالة الراتب إلى غير مدفوع
        payrollRecord.isPaid = false;
        payrollRecord.paidDate = null;
        handleDataAction('payroll', payrollRecord, false);

        // المبلغ يرجع تلقائياً للصندوق عند تغيير الحالة إلى "غير مدفوع"
        showToast(`تم استرجاع راتب ${employee.name} بنجاح! وأُرجع المبلغ ${formatCurrencyDisplay(salaryData.netSalary)} للصندوق.`, 'success');
    };

    // دالة طباعة كشف الراتب
    const handlePrintPayslip = (employee, salaryData) => {
        setPayslipToPrint({ employee, salaryData });
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

            {/* كروت مجاميع الرواتب */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                <FilterStatCard
                    title="الكل"
                    value={formatCurrencyDisplay(salaryTotals.totalAll)}
                    icon={Calculator}
                    onClick={() => setStatusFilter('الكل')}
                    active={statusFilter === 'الكل'}
                    themeKey="teal"
                    size="md"
                    dataTestId="card-total-all"
                />
                <FilterStatCard
                    title="المدفوع"
                    value={formatCurrencyDisplay(salaryTotals.totalPaid)}
                    icon={CheckCircle}
                    onClick={() => setStatusFilter('مدفوعة')}
                    active={statusFilter === 'مدفوعة'}
                    themeKey="emerald"
                    size="md"
                    dataTestId="card-total-paid"
                />
                <FilterStatCard
                    title="الغير مدفوع"
                    value={formatCurrencyDisplay(salaryTotals.totalUnpaid)}
                    icon={XCircle}
                    onClick={() => setStatusFilter('غير مدفوعة')}
                    active={statusFilter === 'غير مدفوعة'}
                    themeKey="orange"
                    size="md"
                    dataTestId="card-total-unpaid"
                />
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

            <div className="flex flex-wrap gap-2 space-x-reverse justify-end">
                <button onClick={() => window.print()} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                    <Printer className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200">
                    <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                </button>
            </div>

            {/* جدول الرواتب */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الموظف</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الراتب الأساسي</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">المكافآت</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الخصومات</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الغياب</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الأوفرتايم</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">السلف</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الراتب الصافي</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الحالة</th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredEmployees.length === 0 ? (
                            <tr><td colSpan="10" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا يوجد موظفين.</td></tr>
                        ) : (
                            paginatedPayrollEmployees.map(emp => {
                                const salaryData = calculateEmployeeSalary(emp, selectedMonth, selectedYear);
                                return (
                                    <tr
                                        key={emp.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer"
                                        onClick={() => { setCurrentEmployee(emp); setIsDetailsModalOpen(true); }}
                                        data-testid={`row-employee-${emp.id}`}
                                    >
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
                                        <td className="px-4 py-4 text-sm" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex space-x-2 space-x-reverse">
                                                <button
                                                    onClick={() => handlePrintPayslip(emp, salaryData)}
                                                    className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                                    data-testid={`button-print-${emp.id}`}
                                                    title="طباعة قسيمة الراتب"
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
                                                {salaryData.isPaid && (
                                                    <button
                                                        onClick={() => handleRefundSalary(emp.id)}
                                                        className="px-3 py-1 bg-orange-600 dark:bg-orange-500 text-white rounded-lg hover:bg-orange-700 dark:hover:bg-orange-600 transition-colors"
                                                        data-testid={`button-refund-salary-${emp.id}`}
                                                        title="استرجاع الراتب وإرجاع المبلغ للصندوق"
                                                    >
                                                        استرجاع
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                pageSize={payrollPageSize}
                onPageSizeChange={changePayrollPageSize}
                currentPage={payrollCurrentPage}
                totalPages={payrollTotalPages}
                onPageChange={goToPayrollPage}
                totalItems={totalPayrollEmployees}
            />

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
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateDDMMYYYY(adj.date)}</p>
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
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatDateDDMMYYYY(adv.date)}</p>
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

            {/* مودال معاينة قسيمة الراتب */}
            {payslipToPrint && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setPayslipToPrint(null)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
                        {/* رأس المودال */}
                        <div className="flex justify-between items-center p-4 border-b border-purple-100 dark:border-purple-700 bg-gradient-to-r from-purple-500 to-blue-600 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-white flex-grow text-center">معاينة قسيمة الراتب 🧾</h3> 
                            <button onClick={() => setPayslipToPrint(null)} className="flex items-center justify-center text-white hover:text-gray-200 transition p-1 bg-white/20 rounded-full">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* زر الطباعة */}
                        <div className="p-4 print:hidden flex justify-center">
                            <button
                                onClick={() => { window.print(); setPayslipToPrint(null); }}
                                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold shadow-lg transition flex items-center gap-2"
                                data-testid="button-print-payslip"
                            >
                                <Printer className="w-5 h-5" />
                                🖨️ طباعة الآن
                            </button>
                        </div>

                        {/* معاينة القسيمة */}
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 m-4 rounded-xl">
                            <div style={{
                                width: '80mm',
                                margin: '0 auto',
                                padding: '5mm',
                                backgroundColor: 'white',
                                color: '#000',
                                fontFamily: "'Cairo', Arial",
                                fontSize: '12px',
                                textAlign: 'right',
                                direction: 'rtl'
                            }}>
                                <h2 style={{ textAlign: 'center', margin: '10px 0', color: '#000', fontSize: '16px', fontWeight: 'bold' }}>{data.settings.companyName}</h2>
                                <h3 style={{ textAlign: 'center', color: '#000', fontSize: '14px' }}>كشف راتب</h3>
                                <p style={{ color: '#000', margin: '5px 0' }}><strong>الموظف:</strong> {payslipToPrint.employee.name}</p>
                                <p style={{ color: '#000', margin: '5px 0' }}><strong>الشهر:</strong> {monthNames[selectedMonth - 1]} {selectedYear}</p>
                                <hr style={{ border: '1px solid #000', margin: '10px 0' }} />
                                <table style={{ width: '100%', borderCollapse: 'collapse', color: '#000' }}>
                                    <tbody>
                                        <tr><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>الراتب الأساسي:</td><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>{payslipToPrint.salaryData.baseSalary.toLocaleString()} د.ع.</td></tr>
                                        {payslipToPrint.salaryData.bonuses > 0 && <tr><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>المكافآت:</td><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>+{payslipToPrint.salaryData.bonuses.toLocaleString()} د.ع.</td></tr>}
                                        {payslipToPrint.salaryData.overtimeAmount > 0 && <tr><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>الأوفرتايم:</td><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>+{payslipToPrint.salaryData.overtimeAmount.toLocaleString()} د.ع.</td></tr>}
                                        {payslipToPrint.salaryData.deductions > 0 && <tr><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>الخصومات:</td><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>-{payslipToPrint.salaryData.deductions.toLocaleString()} د.ع.</td></tr>}
                                        {payslipToPrint.salaryData.absenceAmount > 0 && <tr><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>خصم الغياب:</td><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>-{payslipToPrint.salaryData.absenceAmount.toLocaleString()} د.ع.</td></tr>}
                                        {payslipToPrint.salaryData.advances > 0 && <tr><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>السلف:</td><td style={{ padding: '5px', borderBottom: '1px dashed #ccc' }}>-{payslipToPrint.salaryData.advances.toLocaleString()} د.ع.</td></tr>}
                                        <tr style={{ fontWeight: 'bold', fontSize: '14px' }}><td style={{ padding: '5px', borderBottom: '1px solid #000' }}>الراتب الصافي:</td><td style={{ padding: '5px', borderBottom: '1px solid #000' }}>{payslipToPrint.salaryData.netSalary.toLocaleString()} د.ع.</td></tr>
                                    </tbody>
                                </table>
                                <p style={{ textAlign: 'center', marginTop: '20px', color: '#000' }}>التاريخ: {formatDateDDMMYYYY()}</p>
                            </div>
                        </div>

                        {/* معلومات الأبعاد */}
                        <div className="p-4 print:hidden text-center text-sm text-gray-600 dark:text-gray-400">
                            📏 الأبعاد: 80mm × طول تلقائي
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});



/**
 * 3.4. InventoryPage Component (عرض المخزون)
 */
const InventoryPageComponent = React.memo(({ data, showToast, handleRefresh, handleDataAction }) => {
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentItem, setCurrentItem] = useState(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
    const [itemToPrint, setItemToPrint] = useState(null);
    
    // دالة فتح معاينة الطباعة
    const openPrintPreview = (item) => {
        setItemToPrint(item);
        setIsPrintPreviewOpen(true);
    };
    
    // دالة طباعة الستكر
    const printBarcodeSticker = () => {
        if (!itemToPrint) return;
        
        const printWindow = window.open('', '_blank');
        const itemName = itemToPrint.name;
        const itemBarcode = itemToPrint.barcode || 'N/A';
        
        // حساب حجم الخط بناءً على طول النص
        const nameFontSize = itemName.length > 40 ? '7pt' : itemName.length > 25 ? '9pt' : '11pt';
        const nameLineClamp = itemName.length > 40 ? 4 : itemName.length > 25 ? 3 : 2;
        const barcodeFontSize = itemBarcode.length > 15 ? '8pt' : itemBarcode.length > 12 ? '10pt' : '12pt';
        const barcodeLetterSpacing = itemBarcode.length > 12 ? '0.5px' : '1px';
        
        const htmlContent = `
            <!DOCTYPE html>
            <html dir="rtl">
            <head>
                <meta charset="UTF-8">
                <title>طباعة باركود - ${itemName}</title>
                <style>
                    @page {
                        size: 50mm 30mm;
                        margin: 0;
                    }
                    
                    * {
                        margin: 0;
                        padding: 0;
                        box-sizing: border-box;
                    }
                    
                    body {
                        font-family: 'Cairo', 'Arial', sans-serif;
                        background: white;
                        padding: 0;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    
                    .sticker-container {
                        width: 50mm;
                        height: 30mm;
                        display: flex;
                        flex-direction: column;
                        justify-content: space-between;
                        align-items: center;
                        border: 2px solid #000;
                        padding: 2mm;
                        background: white;
                    }
                    
                    .item-name {
                        font-weight: bold;
                        text-align: center;
                        width: 100%;
                        word-wrap: break-word;
                        overflow-wrap: break-word;
                        hyphens: auto;
                        line-height: 1.2;
                        font-size: ${nameFontSize};
                        max-height: 12mm;
                        overflow: hidden;
                        display: -webkit-box;
                        -webkit-line-clamp: ${nameLineClamp};
                        -webkit-box-orient: vertical;
                        padding-bottom: 1mm;
                        color: #000;
                    }
                    
                    .barcode-visual {
                        width: 100%;
                        height: 8mm;
                        background: repeating-linear-gradient(
                            90deg,
                            #000 0px,
                            #000 1.5px,
                            #fff 1.5px,
                            #fff 3px
                        );
                        margin-top: 1mm;
                        margin-bottom: 1mm;
                        flex-shrink: 0;
                    }
                    
                    .barcode-display {
                        font-family: 'Courier New', monospace;
                        font-weight: bold;
                        letter-spacing: ${barcodeLetterSpacing};
                        text-align: center;
                        width: 100%;
                        font-size: ${barcodeFontSize};
                        padding-top: 1mm;
                        color: #000;
                    }
                </style>
            </head>
            <body>
                <div class="sticker-container">
                    <div class="item-name">${itemName}</div>
                    <div class="barcode-visual"></div>
                    <div class="barcode-display">${itemBarcode}</div>
                </div>
            </body>
            </html>
        `;
        
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
    };

    const filteredList = useMemo(() => {
        let list = data.inventory.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        if (globalSearch) {
            const searchLower = normalizeTextForSearch(globalSearch);
            const searchNumeric = normalizeTextForSearch(globalSearch, true);
            const hasTextSearch = searchLower.length > 0;
            const hasNumericSearch = searchNumeric.length > 0;

            list = list.filter(item => {
                let textMatches = false;
                if (hasTextSearch) {
                    const matchesName = item.name && normalizeTextForSearch(item.name).includes(searchLower);
                    const matchesBarcode = item.barcode && normalizeTextForSearch(item.barcode).includes(searchLower);
                    const matchesCategory = item.category && normalizeTextForSearch(item.category).includes(searchLower);

                    textMatches = matchesName || matchesBarcode || matchesCategory;
                }

                const numericMatches = hasNumericSearch
                    ? !!(item.price && normalizeTextForSearch(item.price.toString(), true).includes(searchNumeric))
                    : false;

                return textMatches || numericMatches;
            });
        }
        return list;
    }, [data.inventory, globalSearch]);

    const {
        paginatedItems: paginatedInventory,
        totalItems: totalInventoryItems,
        pageSize: inventoryPageSize,
        currentPage: inventoryCurrentPage,
        totalPages: inventoryTotalPages,
        changePageSize: changeInventoryPageSize,
        goToPage: goToInventoryPage,
    } = usePagination(filteredList);

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
                                <td className="px-2 py-1">{formatDateTimeDDMMYYYY(record.date)}</td>
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
            
            <div className="flex flex-wrap gap-2 space-x-reverse justify-end">
                <button onClick={() => window.print()} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                    <Printer className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button onClick={() => {
                    const csvContent = [
                        ['اسم المادة', 'الفئة', 'الباركود', 'السعر', 'الكمية'],
                        ...filteredList.map(item => [
                            item.name,
                            item.category,
                            item.barcode || 'N/A',
                            item.price,
                            item.count
                        ])
                    ].map(row => row.join(',')).join('\n');
                    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `المخزون_${new Date().toISOString().split('T')[0]}.csv`;
                    link.click();
                }} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition duration-200">
                    <Download className="w-5 h-5 md:w-6 md:h-6" />
                </button>
                <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200" data-testid="button-refresh-inventory">
                    <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
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
                            paginatedInventory.map(item => (
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

            <PaginationControls
                pageSize={inventoryPageSize}
                onPageSizeChange={changeInventoryPageSize}
                currentPage={inventoryCurrentPage}
                totalPages={inventoryTotalPages}
                onPageChange={goToInventoryPage}
                totalItems={totalInventoryItems}
            />
            
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
                        
                        {/* زر معاينة ستكر الباركود */}
                        <div className="pt-3 pb-2">
                            <ActionButton 
                                onClick={() => openPrintPreview(currentItem)} 
                                className="w-full bg-purple-600 hover:bg-purple-700"
                                data-testid="button-preview-barcode-sticker"
                            >
                                <Printer className="w-5 h-5 ml-2" />
                                معاينة و طباعة ستكر الباركود (50mm × 30mm)
                            </ActionButton>
                        </div>
                        
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 pt-4 mb-2 flex items-center"><CalendarCheck className="w-5 h-5 ml-2 text-teal-600" /> سجل الشراء (تاريخ وسعر التكلفة)</h4>
                        {formatPurchaseHistory(currentItem.purchaseHistory || [])}

                    </div>
                </Modal>
            )}
            
            {/* Modal معاينة طباعة الباركود */}
            {isPrintPreviewOpen && itemToPrint && (
                <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setIsPrintPreviewOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100" onClick={e => e.stopPropagation()}>
                        {/* رأس المودال */}
                        <div className="flex justify-between items-center p-4 border-b border-indigo-100 dark:border-indigo-700 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-t-3xl">
                            <h3 className="text-xl font-bold text-white flex-grow text-center">معاينة ستكر الباركود 🏷️</h3> 
                            <button onClick={() => setIsPrintPreviewOpen(false)} className="flex items-center justify-center text-white hover:text-gray-200 transition p-1 bg-white/20 rounded-full">
                                <X className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </div>

                        {/* زر الطباعة */}
                        <div className="p-4 print:hidden flex justify-center">
                            <button
                                onClick={() => { printBarcodeSticker(); setIsPrintPreviewOpen(false); }}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg transition flex items-center gap-2"
                                data-testid="button-print-now"
                            >
                                <Printer className="w-5 h-5" />
                                🖨️ طباعة الآن
                            </button>
                        </div>
                        
                        {/* معاينة الستكر */}
                        <div className="p-4 bg-gray-100 dark:bg-gray-700 m-4 rounded-xl flex justify-center items-center">
                            <div id="barcode-sticker-content" className="sticker-container bg-white border-2 border-black" style={{
                                width: '50mm',
                                height: '30mm',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '2mm'
                            }}>
                                {/* اسم المادة - يتكيف مع الطول */}
                                <div className="item-name" style={{
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    width: '100%',
                                    wordWrap: 'break-word',
                                    overflowWrap: 'break-word',
                                    hyphens: 'auto',
                                    lineHeight: '1.2',
                                    fontSize: itemToPrint.name.length > 40 ? '7pt' : itemToPrint.name.length > 25 ? '9pt' : '11pt',
                                    maxHeight: '12mm',
                                    overflow: 'hidden',
                                    display: '-webkit-box',
                                    WebkitLineClamp: itemToPrint.name.length > 40 ? 4 : itemToPrint.name.length > 25 ? 3 : 2,
                                    WebkitBoxOrient: 'vertical',
                                    paddingBottom: '1mm',
                                    color: '#000'
                                }}>
                                    {itemToPrint.name}
                                </div>
                                
                                {/* الباركود البصري */}
                                <div className="barcode-visual" style={{
                                    width: '100%',
                                    height: '8mm',
                                    background: 'repeating-linear-gradient(90deg, #000 0px, #000 1.5px, #fff 1.5px, #fff 3px)',
                                    marginTop: '1mm',
                                    marginBottom: '1mm'
                                }}></div>
                                
                                {/* رقم الباركود - يتكيف مع الطول */}
                                <div className="barcode-display" style={{
                                    fontFamily: "'Courier New', monospace",
                                    fontWeight: 'bold',
                                    letterSpacing: (itemToPrint.barcode || 'N/A').length > 12 ? '0.5px' : '1px',
                                    textAlign: 'center',
                                    width: '100%',
                                    fontSize: (itemToPrint.barcode || 'N/A').length > 15 ? '8pt' : (itemToPrint.barcode || 'N/A').length > 12 ? '10pt' : '12pt',
                                    paddingTop: '1mm',
                                    color: '#000'
                                }}>
                                    {itemToPrint.barcode || 'N/A'}
                                </div>
                            </div>
                        </div>
                        
                        {/* معلومات الأبعاد */}
                        <div className="p-4 print:hidden text-center text-sm text-gray-600 dark:text-gray-400">
                            📏 الأبعاد: 50mm × 30mm
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});


/**
 * 3.5. InventoryEntryComponent (الادخال المخزني)
 */
const InventoryEntryComponent = React.memo(({ data, handleDataAction, handleDelete, setCurrentPage, showToast, setInitialExpenseState, handleRefresh, currentUser, setPendingInventoryAction, openScanner }) => {
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

    const canAddInvoice = !!currentUser?.permissions?.inventoryEntry?.add;
    const canEditInvoice = !!currentUser?.permissions?.inventoryEntry?.edit;
    const canApproveInventory = !!currentUser?.permissions?.inventoryEntry?.approve;
    const canCancelInventory = !!currentUser?.permissions?.inventoryEntry?.cancel;

    // دالة للحصول على حالة نموذج الفاتورة الافتراضية
    const getDefaultInvoiceForm = useCallback(() => ({
        vendor: data.settings.vendors[0] || '',
        representative: data.settings.representatives.find(r => r.vendor === (data.settings.vendors[0] || ''))?.name || '',
        invoiceNumber: '', // رقم فاتورة المورد
        invoiceImageUrl: '',
        attachments: [],
        expenseCategory: data.settings.expenseCategories.find(c => c.includes('مواد')) || data.settings.expenseCategories[0] || '',
        items: [], // المواد المضافة للفاتورة
        status: 'Pending',
        totalAmount: 0,
        date: getDefaultDateTime(),
        id: null,
        inventoryApplied: false,
        linkedCollection: null,
        linkedRecordId: null
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

    useEffect(() => {
        if ((!Array.isArray(invoiceForm.attachments) || invoiceForm.attachments.length === 0) && invoiceForm.invoiceImageUrl) {
            const normalized = normalizeAttachmentList(invoiceForm.attachments, invoiceForm.invoiceImageUrl, 'مرفق فاتورة');
            if (normalized.length > 0) {
                setInvoiceForm(prev => ({
                    ...prev,
                    attachments: normalized,
                    invoiceImageUrl: getPrimaryAttachmentDataUrl(normalized),
                }));
            }
        }
    }, [invoiceForm.attachments, invoiceForm.invoiceImageUrl]);

    const invoiceAttachments = Array.isArray(invoiceForm.attachments) ? invoiceForm.attachments : [];
    const [invoiceAttachmentPreview, setInvoiceAttachmentPreview] = useState(null);
    const [invoicePreviewZoomed, setInvoicePreviewZoomed] = useState(false);
    const scannerAvailable = typeof openScanner === 'function';

    useEffect(() => {
        if (invoiceAttachmentPreview) {
            setInvoicePreviewZoomed(false);
        }
    }, [invoiceAttachmentPreview]);

    const detailAttachments = useMemo(() => {
        if (!currentInvoice) {
            return [];
        }
        return normalizeAttachmentList(currentInvoice.attachments, currentInvoice.invoiceImageUrl, 'مرفق فاتورة');
    }, [currentInvoice]);
    
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
            const cleanBarcode = convertArabicToEnglish(value || '').trim();
            newState.barcode = cleanBarcode;

            const foundItem = inventory.find(i => i.barcode && convertArabicToEnglish(i.barcode).trim() === cleanBarcode);
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
            barcode: item.barcode ? convertArabicToEnglish(item.barcode).trim() : '',
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
        
        if (!itemForm.barcode) {
            showToast('يجب إدخال باركود المادة قبل الإضافة.', 'error');
            return;
        }

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

    const handleInvoiceAttachmentUpload = async (event) => {
        const files = Array.from(event.target.files || []);
        if (files.length === 0) {
            return;
        }

        try {
            const newAttachments = await Promise.all(files.map(createAttachmentFromFile));
            setInvoiceForm(prev => {
                const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
                const updated = [...existing, ...newAttachments];
                return {
                    ...prev,
                    attachments: updated,
                    invoiceImageUrl: getPrimaryAttachmentDataUrl(updated),
                };
            });
            showToast('تم تحميل المرفقات بنجاح.', 'success');
        } catch (error) {
            console.error('Failed to upload invoice attachments', error);
            showToast('تعذر تحميل المرفقات. يرجى المحاولة مرة أخرى.', 'error');
        } finally {
            event.target.value = '';
        }
    };

    const handleScanInvoiceAttachment = useCallback(() => {
        if (typeof openScanner !== 'function') {
            return;
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        openScanner({
            title: 'مسح فاتورة المورد',
            defaultFileName: `فاتورة-مورد-${timestamp}`,
            onCapture: (attachment) => {
                if (!attachment) {
                    return;
                }

                setInvoiceForm(prev => {
                    const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
                    const updated = [...existing, attachment];
                    return {
                        ...prev,
                        attachments: updated,
                        invoiceImageUrl: getPrimaryAttachmentDataUrl(updated) || prev.invoiceImageUrl,
                    };
                });

                showToast('تم التقاط صورة الفاتورة عبر السكنر.', 'success');
            },
        });
    }, [openScanner, setInvoiceForm, showToast]);

    const handleRemoveInvoiceAttachment = (id) => {
        setInvoiceForm(prev => {
            const existing = Array.isArray(prev.attachments) ? prev.attachments : [];
            const updated = existing.filter(att => att.id !== id);
            return {
                ...prev,
                attachments: updated,
                invoiceImageUrl: getPrimaryAttachmentDataUrl(updated),
            };
        });
    };

    const previewInvoiceAttachment = (attachment) => {
        if (isImageAttachment(attachment)) {
            setInvoiceAttachmentPreview(attachment);
            return;
        }

        const newWindow = window.open(attachment.dataUrl || attachment.url || attachment.attachmentUrl, '_blank');
        if (!newWindow) {
            showToast('يرجى السماح بالنوافذ المنبثقة لعرض المستند.', 'warning');
        }
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

        const isEdit = !!invoiceForm.id;
        if (isEdit && !canEditInvoice) {
            showToast('ليس لديك صلاحية تعديل فواتير الإدخال المخزني.', 'error');
            return;
        }

        if (!isEdit && !canAddInvoice) {
            showToast('ليس لديك صلاحية إضافة فواتير الإدخال المخزني.', 'error');
            return;
        }

        const normalizedAttachments = normalizeAttachmentList(invoiceForm.attachments, invoiceForm.invoiceImageUrl, 'مرفق فاتورة');

        const invoiceToSave = {
            ...invoiceForm,
            attachments: normalizedAttachments,
            invoiceImageUrl: getPrimaryAttachmentDataUrl(normalizedAttachments),
            id: invoiceForm.id || crypto.randomUUID(),
            date: getDefaultDateTime(),
            totalAmount: calculateTotal(),
            status: 'Pending',
            inventoryApplied: invoiceForm.inventoryApplied || false,
            linkedCollection: invoiceForm.linkedCollection || null,
            linkedRecordId: invoiceForm.linkedRecordId || null,
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
            const hasTextSearch = searchLower.length > 0;
            const hasNumericSearch = searchNumeric.length > 0;

            list = list.filter(inv => {
                let textMatches = false;
                if (hasTextSearch) {
                    const matchesInvoiceNum = inv.invoiceNumber && normalizeTextForSearch(inv.invoiceNumber).includes(searchLower);
                    const matchesVendor = inv.vendor && normalizeTextForSearch(inv.vendor).includes(searchLower);
                    const matchesRep = inv.representative && normalizeTextForSearch(inv.representative).includes(searchLower);
                    const matchesItem = inv.items.some(item => normalizeTextForSearch(item.name).includes(searchLower));

                    textMatches = matchesInvoiceNum || matchesVendor || matchesRep || matchesItem;
                }

                const numericMatches = hasNumericSearch
                    ? !!(inv.totalAmount && normalizeTextForSearch(inv.totalAmount.toString(), true).includes(searchNumeric))
                    : false;

                return textMatches || numericMatches;
            });
        }
        
        // الفلترة حسب حالة الكارت المختار (دعم الاختيار المتعدد)
        if (statusFilter.length > 0) {
             list = list.filter(inv => statusFilter.includes(inv.status));
        }
        
        return list;
    }, [data.pendingInvoices, globalSearch, statusFilter]); // الاعتماد على statusFilter

    const {
        paginatedItems: paginatedInvoices,
        totalItems: totalInvoices,
        pageSize: invoicePageSize,
        currentPage: invoiceCurrentPage,
        totalPages: invoiceTotalPages,
        changePageSize: changeInvoicePageSize,
        goToPage: goToInvoicePage,
    } = usePagination(filteredInvoices);

    // الإجراء النهائي: الموافقة على الفاتورة (تسجيلها كمصروف وتحديث المخزون)
    const handleApproveInvoice = (invoice, isCreditApproval = false) => {
        if (!canApproveInventory) {
            showToast('ليس لديك صلاحية اعتماد الإدخال المخزني.', 'error');
            return;
        }

        const normalizedInvoiceAttachments = normalizeAttachmentList(invoice.attachments, invoice.invoiceImageUrl, 'مرفق فاتورة');
        const primaryInvoiceAttachment = getPrimaryAttachmentDataUrl(normalizedInvoiceAttachments);

        if (!isCreditApproval) {
            const canDirectExpense = !!currentUser?.permissions?.expenses?.add && !!currentUser?.permissions?.expenses?.view;
            const targetCollection = canDirectExpense ? 'expenses' : 'pendingExpenses';
            const recordId = crypto.randomUUID();
            const shouldApplyInventory = !invoice.inventoryApplied && invoice.status !== 'CreditApproved';

            const expenseRecord = {
                id: recordId,
                type: 'expense',
                status: 'pending',
                date: invoice.date,
                amount: invoice.totalAmount,
                category: invoice.expenseCategory,
                description: `فاتورة شراء مواد من ${invoice.vendor} (المواد: ${invoice.items.map(i => i.name).join(', ')})`,
                vendor: invoice.vendor,
                representative: invoice.representative,
                notes: invoice.notes || '',
                attachments: normalizedInvoiceAttachments,
                invoiceImageUrl: primaryInvoiceAttachment || '',
                inventoryItems: invoice.items,
                invoiceNumber: invoice.invoiceNumber,
                linkedInvoiceId: invoice.id,
                fromInventoryEntry: true,
            };

            if (!ensureSettingsCanLeave(targetCollection)) {
                return;
            }

            setPendingInventoryAction({
                invoiceId: invoice.id,
                recordId,
                targetCollection,
                applyInventory: shouldApplyInventory,
                nextStatus: 'Dispatched',
            });

            setInitialExpenseState(expenseRecord);
            performNavigation(targetCollection, { preserveInitialExpenseState: true });
            setIsDetailsModalOpen(false);
            setCurrentInvoice(null);
            showToast(
                canDirectExpense
                    ? 'تم تجهيز بيانات المصروف. يرجى الضغط على زر "إضافة" في صفحة الصرفيات لإكمال العملية.'
                    : 'تم تجهيز طلب الصرف المعلق. يرجى الضغط على زر "إضافة" في صفحة الصرفيات المعلقة لاعتماد العملية.',
                'info'
            );
            return;
        }

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
                    invoiceImageUrl: primaryInvoiceAttachment,
                });
            }
        });
        
        // 2. تحديث حالة الفاتورة
        let updatedInvoice;
        if (isCreditApproval) {
            // اعتماد آجل (تحديث المخزون فقط، تغيير الحالة لـ CreditApproved)
            const parseAmount = (value) => {
                const normalized = convertArabicToEnglish((value ?? '').toString());
                const cleaned = normalized.replace(/[^0-9.]/g, '');
                const numeric = parseFloat(cleaned);
                return Number.isFinite(numeric) ? numeric : 0;
            };

            const invoiceTotalValue = parseAmount(invoice.totalAmount ?? 0);
            const debtsList = Array.isArray(data.debts) ? data.debts : [];
            const existingDebt = debtsList.find(debt => debt.linkedInvoiceId === invoice.id);
            const existingPayments = Array.isArray(existingDebt?.payments) ? existingDebt.payments : [];
            const paymentsTotal = existingPayments.reduce((sum, payment) => sum + parseAmount(payment.amount), 0);
            const remainingAmount = Math.max(0, invoiceTotalValue - paymentsTotal);

            const debtRecord = {
                ...(existingDebt || {}),
                id: existingDebt?.id || crypto.randomUUID(),
                companyName: invoice.vendor || existingDebt?.companyName || '',
                vendorName: invoice.representative || existingDebt?.vendorName || '',
                category: invoice.expenseCategory || existingDebt?.category || '',
                totalAmount: invoiceTotalValue,
                remainingAmount,
                description: invoice.notes || existingDebt?.description || '',
                attachmentUrl: primaryInvoiceAttachment || existingDebt?.attachmentUrl || '',
                payments: existingPayments,
                status: remainingAmount <= 0 ? 'settled' : 'active',
                date: existingDebt?.date || invoice.date || getDefaultDateTime(),
                createdAt: existingDebt?.createdAt || invoice.date || getDefaultDateTime(),
                updatedAt: getDefaultDateTime(),
                debtType: DEBT_TYPES.INVENTORY,
                linkedInvoiceId: invoice.id,
                sourceInvoiceNumber: invoice.invoiceNumber || existingDebt?.sourceInvoiceNumber || '',
            };

            handleDataAction('debts', debtRecord, !existingDebt, false, { bypassPermissions: true, silent: true });

            updatedInvoice = {
                ...invoice,
                status: 'CreditApproved',
                inventoryApplied: true,
                linkedDebtId: debtRecord.id,
                debtType: DEBT_TYPES.INVENTORY,
            };

            handleDataAction('pendingInvoices', updatedInvoice, false);
            handleDataAction('inventory', updatedInventory, true, true);
            setIsDetailsModalOpen(false);
            setStatusFilter(prev => Array.isArray(prev) ? [...prev.filter(s => s !== 'Pending'), 'CreditApproved'] : ['CreditApproved']); // تحديث الفلتر فورا
            showToast(`تم اعتماد الفاتورة #${invoice.invoiceNumber} كـ **آجل** وإضافة المواد للمخزون.`, 'success');
            return;
        }
        
        // 3. تسجيلها كمصروف وتغيير حالتها إلى "مصروفة" (كاش أو صرف الآجل)
        const linkedDebtId = invoice.linkedDebtId || (Array.isArray(data.debts) ? data.debts.find(debt => debt.linkedInvoiceId === invoice.id)?.id : null);
        const linkedDebtPaymentId = linkedDebtId ? crypto.randomUUID() : null;

        const expenseRecord = {
            id: crypto.randomUUID(),
            type: 'expense',
            status: 'pending',
            date: invoice.date,
            invoiceNumber: invoice.invoiceNumber, // رقم فاتورة المورد
            amount: invoice.totalAmount,
            category: invoice.expenseCategory,
            description: `فاتورة شراء مواد من ${invoice.vendor} (المواد: ${invoice.items.map(i => i.name).join(', ')})`,
            vendor: invoice.vendor,
            representative: invoice.representative,
            notes: invoice.notes || '',
            attachments: normalizedInvoiceAttachments,
            invoiceImageUrl: primaryInvoiceAttachment || '',
            inventoryItems: invoice.items,
            ...(linkedDebtId ? { linkedDebtId, linkedDebtPaymentId } : {}),
        };

        // 4. إرسال بيانات المصروف إلى صفحة المصروفات وفتح المودال هناك
        if (!ensureSettingsCanLeave('pendingExpenses')) {
            return;
        }
        setInitialExpenseState(expenseRecord);
        performNavigation('pendingExpenses', { preserveInitialExpenseState: true }); // توجيه المستخدم لصفحة الصرفيات المعلقة

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
        if (!canCancelInventory) {
            showToast('ليس لديك صلاحية إلغاء فواتير الإدخال.', 'error');
            return;
        }

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
            inventoryApplied: invoice.status === 'CreditApproved' ? false : invoice.inventoryApplied,
            linkedCollection: invoice.linkedCollection || null,
            linkedRecordId: invoice.linkedRecordId || null,
        };

        // إذا كانت الفاتورة معتمدة آجل، يجب خصم المواد من المخزون
        if (invoice.status === 'CreditApproved') {
            let updatedInventory = [...data.inventory];
            invoice.items.forEach(item => {
                const existingItemIndex = updatedInventory.findIndex(i => i.name === item.name);
                if (existingItemIndex !== -1) {
                    updatedInventory[existingItemIndex] = {
                        ...updatedInventory[existingItemIndex],
                        count: Math.max((parseFloat(convertArabicToEnglish(updatedInventory[existingItemIndex].count || '0')) || 0) - (parseFloat(convertArabicToEnglish(item.count || '0')) || 0), 0),
                    };
                }
            });
            handleDataAction('inventory', updatedInventory, true, true);
            cancelledInvoice.linkedCollection = null;
            cancelledInvoice.linkedRecordId = null;
        }

        if (invoice.linkedDebtId) {
            handleDelete('debts', invoice.linkedDebtId, false, true);
        } else {
            const relatedDebt = Array.isArray(data.debts) ? data.debts.find(debt => debt.linkedInvoiceId === invoice.id) : null;
            if (relatedDebt) {
                handleDelete('debts', relatedDebt.id, false, true);
            }
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

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                <FilterStatCard
                    title="الفواتير المعلقة"
                    value={`${stats.pendingCount} فاتورة`}
                    subtitle={`إجمالي: ${formatCurrencyDisplay(stats.totalPending)}`}
                    icon={Clock}
                    onClick={() => handleFilterClick('Pending')}
                    active={isFilterActive('Pending')}
                    themeKey="amber"
                    size="md"
                />
                <FilterStatCard
                    title="معتمدة كاش"
                    value={`${stats.cashCount} فاتورة`}
                    subtitle={`إجمالي: ${formatCurrencyDisplay(stats.totalCash)}`}
                    icon={CheckCircle}
                    onClick={() => handleFilterClick('Dispatched')}
                    active={isFilterActive('Dispatched')}
                    themeKey="emerald"
                    size="md"
                />
                <FilterStatCard
                    title="معتمدة آجل"
                    value={`${stats.creditCount} فاتورة`}
                    subtitle={`إجمالي: ${formatCurrencyDisplay(stats.totalCredit)}`}
                    icon={ClipboardCheck}
                    onClick={() => handleFilterClick('CreditApproved')}
                    active={isFilterActive('CreditApproved')}
                    themeKey="blue"
                    size="md"
                />
                <FilterStatCard
                    title="فواتير ملغاة"
                    value={`${stats.cancelledCount} فاتورة`}
                    subtitle={`إجمالي: ${formatCurrencyDisplay(stats.totalCancelled)}`}
                    icon={XCircle}
                    onClick={() => handleFilterClick('Cancelled')}
                    active={isFilterActive('Cancelled')}
                    themeKey="rose"
                    size="md"
                />
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
            
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => setIsNewInvoiceModalOpen(true)}
                    disabled={!canAddInvoice}
                    className={`flex items-center px-6 py-3 rounded-xl shadow-lg transition duration-200 ${canAddInvoice ? 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600' : 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-300 cursor-not-allowed'}`}
                    data-testid="button-add-invoice"
                >
                    <ClipboardCheck className="w-5 h-5 ml-2" />
                    إدخال فاتورة مشتريات جديدة
                </button>

                <div className="flex flex-wrap gap-2 space-x-reverse">
                    <button onClick={() => window.print()} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                        <Printer className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200">
                        <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>


            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b pb-2 mb-4">سجل فواتير المشتريات (كل الحالات)</h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">رقم فاتورة المورد</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">تاريخ الإدخال</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">المورد والمندوب</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">عدد المواد</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الإجمالي (د.ع.)</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الحالة والإجراء</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredInvoices.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا توجد فواتير مشتريات مطابقة للفلترة.</td></tr>
                        ) : (
                            paginatedInvoices.map(invoice => (
                                <tr key={invoice.id}
                                    className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 cursor-pointer ${invoice.status === 'Dispatched' ? 'bg-green-50 dark:bg-green-900' : invoice.status === 'Cancelled' ? 'bg-red-50 dark:bg-red-900' : invoice.status === 'CreditApproved' ? 'bg-blue-50 dark:bg-blue-900' : 'bg-yellow-50 dark:bg-yellow-900'}`}
                                    onClick={() => openDetailsModal(invoice)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-gray-100">{highlightText(invoice.invoiceNumber, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{formatDateDDMMYYYY(invoice.date)}</td>
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
                <Modal title="إدخال فاتورة مشتريات جديدة" onClose={() => setIsNewInvoiceModalOpen(false)} size="2xl">
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
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المورد</label>
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
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المندوب المسؤول</label>
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
                            
                            <div className="md:col-span-2 space-y-2 text-right">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">مرفقات الفاتورة (صور / مستندات PDF)</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="file"
                                        accept="image/*,application/pdf"
                                        multiple
                                        onChange={handleInvoiceAttachmentUpload}
                                        className="flex-1 p-3 border border-dashed border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl focus:ring-teal-500 focus:border-teal-500 transition duration-150"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleScanInvoiceAttachment}
                                        disabled={!scannerAvailable}
                                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl shadow transition ${scannerAvailable ? 'bg-emerald-500 hover:bg-emerald-600 text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'}`}
                                        title={scannerAvailable ? 'التقاط صورة عبر السكنر' : 'السكنر غير متاح في هذا الجهاز'}
                                    >
                                        <Scan className="w-5 h-5" />
                                        مسح عبر السكنر
                                    </button>
                                </div>
                                {invoiceAttachments.length > 0 && (
                                    <div className="space-y-2">
                                        {invoiceAttachments.map(attachment => (
                                            <div key={attachment.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100">
                                                <div className="flex-1 truncate text-sm font-medium">{attachment.name}</div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => previewInvoiceAttachment(attachment)}
                                                        className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                                                    >
                                                        معاينة
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveInvoiceAttachment(attachment.id)}
                                                        className="px-2 py-1 text-xs rounded-lg bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50"
                                                    >
                                                        حذف
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                             <div className="flex flex-col space-y-1 text-right md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فئة المصروف المرتبطة (لتسجيلها كمصروف لاحقاً)</label>
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
                            <div className="text-center p-6 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-600 rounded-xl text-yellow-800 dark:text-yellow-200">الرجاء إضافة مواد إلى الفاتورة.</div>
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
                                                <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-red-700">{formatCurrencyDisplay((parseFloat(item.price) || 0) * (parseInt(item.count) || 0))}</td>
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
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">فئة المادة (لتصنيف المخزون)</label>
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
                            required
                        >
                            <button type="button" onClick={() => setItemForm(prev => ({ ...prev, barcode: generateBarcode() }))} className="absolute left-1 top-1/2 transform -translate-y-1/2 px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-gray-800 dark:text-gray-200 font-semibold">
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
                            <p className="font-medium text-gray-700 dark:text-gray-300">تاريخ الفاتورة: <span className="font-bold">{formatDateTimeDDMMYYYY(currentInvoice.date)}</span></p>
                            <p className="font-medium text-gray-700 dark:text-gray-300">فئة المصروف: <span className="font-bold">{currentInvoice.expenseCategory}</span></p>
                        </div>
                        
                        {detailAttachments.length > 0 && (
                            <div className="space-y-2">
                                <h5 className="text-sm font-semibold text-gray-600 dark:text-gray-400">مرفقات الفاتورة</h5>
                                <div className="space-y-2">
                                    {detailAttachments.map(attachment => (
                                        <div key={attachment.id} className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600">
                                            <span className="flex-1 truncate text-sm font-medium text-gray-700 dark:text-gray-200">{attachment.name}</span>
                                            <button
                                                onClick={() => previewInvoiceAttachment(attachment)}
                                                className="px-3 py-1 text-xs rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50"
                                            >
                                                عرض
                                            </button>
                                        </div>
                                    ))}
                                </div>
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
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-red-700">{formatCurrencyDisplay((parseFloat(item.price) || 0) * (parseInt(item.count) || 0))}</td>
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
                    {currentInvoice.status === 'Pending' && (canApproveInventory || canCancelInventory) && (
                        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                            {canApproveInventory && (
                                <ActionButton
                                    onClick={() => handleApproveInvoice(currentInvoice, true)}
                                    className="bg-blue-600 hover:bg-blue-700"
                                >
                                    <Package className="w-5 h-5 ml-2" />
                                    اعتماد المخزون (آجل)
                                </ActionButton>
                            )}
                            {canApproveInventory && (
                                <ActionButton
                                    onClick={() => handleApproveInvoice(currentInvoice, false)}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <CheckCircle className="w-5 h-5 ml-2" />
                                    اعتماد المخزون (كاش)
                                </ActionButton>
                            )}
                            {canCancelInventory && (
                                <ActionButton
                                    onClick={() => { setIsDetailsModalOpen(false); setCurrentInvoice(currentInvoice); setIsCancelModalOpen(true); }}
                                    className="bg-red-600 hover:bg-red-700"
                                >
                                    <X className="w-5 h-5 ml-2" />
                                    إلغاء الفاتورة
                                </ActionButton>
                            )}
                        </div>
                    )}
                            
                            {/* حالة آجل - يظهر زر الصرف */}
                    {currentInvoice.status === 'CreditApproved' && (canApproveInventory || canCancelInventory) && (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {canApproveInventory && (
                                <ActionButton
                                    onClick={() => handleApproveInvoice(currentInvoice, false)}
                                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                                >
                                    <DollarSign className="w-5 h-5 ml-2" />
                                    صرف الفاتورة (تسجيل مصروف)
                                </ActionButton>
                            )}
                            {canCancelInventory && (
                                <ActionButton
                                    onClick={() => { setIsDetailsModalOpen(false); setCurrentInvoice(currentInvoice); setIsCancelModalOpen(true); }}
                                    className="w-full bg-red-600 hover:bg-red-700"
                                >
                                    <X className="w-5 h-5 ml-2" />
                                    إلغاء الفاتورة
                                </ActionButton>
                            )}
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
const SettingsPage = React.memo(({ data, handleSettingsUpdate, showToast, onNavigateAttempt, currentUser, registerLeaveGuard }) => {
    const [settings, setSettings] = useState(data.settings);
    const [originalSettings, setOriginalSettings] = useState(data.settings); // لحفظ الحالة الأصلية
    const [isDirty, setIsDirty] = useState(false); // لتتبع التغييرات
    
    // حالة المودال لإدارة الخروج بدون حفظ
    const [exitIntent, setExitIntent] = useState<{ open: boolean; targetPageKey: string | null }>({ open: false, targetPageKey: null });
    
    const [newItem, setNewItem] = useState('');
    const [currentList, setCurrentList] = useState('expenseCategories');
    const [newVendor, setNewVendor] = useState('');
    const [newRep, setNewRep] = useState({ name: '', vendor: settings.vendors[0] || '' });

    const settingsPermissions = currentUser?.permissions?.settings || {};
    const canManageCategories = (settingsPermissions.manageCategories ?? settingsPermissions.view) || false;
    const canManageVendors = (settingsPermissions.manageVendors ?? settingsPermissions.view) || false;
    const canManageRepresentatives = (settingsPermissions.manageRepresentatives ?? settingsPermissions.view) || false;
    const categoryLists = ['expenseCategories', 'revenueCategories', 'advanceCategories', 'departments', 'jobTitles'];
    const categoryLabels = {
        expenseCategories: 'فئة مصروف',
        revenueCategories: 'فئة إيراد',
        advanceCategories: 'فئة سلفة',
        departments: 'قسم',
        jobTitles: 'مسمى وظيفي'
    };
    
    // حالة نموذج المستخدم الجديد/المعدل
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [editingSettingsUser, setEditingSettingsUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: "",
        id: "",
        email: "",
        password: "",
        role: USER_ROLES.CASHIER,
        permissions: {},
        customPermissions: {}
    });

    useEffect(() => {
        setNewRep(prev => {
            const fallbackVendor = settings.vendors[0] || '';
            const nextVendor = settings.vendors.includes(prev.vendor) ? prev.vendor : fallbackVendor;
            return { ...prev, vendor: nextVendor };
        });
    }, [settings.vendors]);

    useEffect(() => {
        if (!registerLeaveGuard) return;

        const guard = (targetPageKey) => {
            if (isDirty) {
                setExitIntent({ open: true, targetPageKey: targetPageKey || null });
                return false;
            }
            return true;
        };

        const unregister = registerLeaveGuard(guard);

        return () => {
            if (typeof unregister === 'function') {
                unregister();
            } else if (registerLeaveGuard) {
                registerLeaveGuard(null);
            }
        };
    }, [isDirty, registerLeaveGuard]);
    
    // قائمة الصلاحيات المتاحة
    const availablePermissions = useMemo(() => ([
        { key: 'dashboard', label: 'الرئيسية' },
        { key: 'revenues', label: 'الإيرادات' },
        { key: 'expenses', label: 'الصرفيات' },
        { key: 'advances', label: 'السلف' },
        { key: 'suspended', label: 'المبالغ المعلقة' },
        { key: 'employees', label: 'الموظفين' },
        { key: 'inventoryEntry', label: 'الإدخال المخزني' },
        { key: 'inventoryWithdrawal', label: 'الاستخراج المخزني' },
        { key: 'inventory', label: 'المخزن والمواد' },
        { key: 'settings', label: 'الإعدادات' },
    ]), []);
    
    // دالة تحديث الحقل العام وتتبع حالة التغيير
    const handleSettingChange = (updater) => {
        setSettings(prevSettings => {
            const nextSettings = typeof updater === 'function' ? updater(prevSettings) : updater;

            // مقارنة بسيطة لمعرفة ما إذا كانت هناك تغييرات
            const currentJSON = JSON.stringify(nextSettings);
            const originalJSON = JSON.stringify(originalSettings);
            setIsDirty(currentJSON !== originalJSON);

            return nextSettings;
        });
    };


    // دالة مساعدة لحفظ جميع الإعدادات
    const saveAllSettings = (e) => {
        if (e) e.preventDefault();
        
        handleSettingsUpdate(settings);
        setOriginalSettings(settings); // تحديث الحالة الأصلية بعد الحفظ
        setIsDirty(false);
        showToast('تم حفظ الإعدادات الأساسية بنجاح.', 'success');
        setExitIntent({ open: false, targetPageKey: null }); // إغلاق المودال في حالة الخروج الموجه

        // **الإصلاح:** إذا تم الحفظ أثناء محاولة الخروج، نقوم بالتنقل
        if (exitIntent.open && exitIntent.targetPageKey) {
            onNavigateAttempt(exitIntent.targetPageKey);
        }
    };
    
    // دوال إدارة القوائم (الفئات والموردين)
    
    const handleAddItem = (e) => {
        e.preventDefault();
        if (!canManageCategories) {
            showToast('لا تملك صلاحية إضافة الفئات.', 'error');
            return;
        }
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
        if (!canManageCategories) {
            showToast('لا تملك صلاحية حذف الفئات.', 'error');
            return;
        }
        handleSettingChange(prev => ({
            ...prev,
            [currentList]: prev[currentList].filter(item => item !== itemToDelete)
        }));

        showToast(`تم حذف العنصر بنجاح.`, 'warning');
    };

    const handleAddVendor = (e) => {
        e.preventDefault();
        if (!canManageVendors) {
            showToast('لا تملك صلاحية إضافة الموردين.', 'error');
            return;
        }

        const value = newVendor.trim();
        if (!value) return;

        if (settings.vendors.includes(value)) {
            showToast('هذا المورد موجود بالفعل.', 'error');
            return;
        }

        handleSettingChange(prev => ({
            ...prev,
            vendors: [...prev.vendors, value]
        }));
        setNewVendor('');
        showToast(`تم إضافة المورد ${value} بنجاح.`, 'success');
    };

    const handleDeleteVendor = (vendorToDelete) => {
        if (!canManageVendors) {
            showToast('لا تملك صلاحية حذف الموردين.', 'error');
            return;
        }

        handleSettingChange(prev => ({
            ...prev,
            vendors: prev.vendors.filter(vendor => vendor !== vendorToDelete),
            representatives: prev.representatives.filter(rep => rep.vendor !== vendorToDelete)
        }));
        showToast('تم حذف المورد وجميع مندوبيه بنجاح.', 'warning');
    };

    // إدارة المندوبين
    const handleAddRep = (e) => {
        e.preventDefault();
        if (!canManageRepresentatives) {
            showToast('لا تملك صلاحية إضافة المندوبين.', 'error');
            return;
        }
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
        if (!canManageRepresentatives) {
            showToast('لا تملك صلاحية حذف المندوبين.', 'error');
            return;
        }
        handleSettingChange(prev => ({
            ...prev,
            representatives: prev.representatives.filter(rep => rep.name !== repToDelete.name)
        }));
        showToast('تم حذف المندوب بنجاح.', 'warning');
    };
    
    // إدارة المستخدمين
    
    const openUserModal = (user = null) => {
        if (user) {
            setEditingSettingsUser(user);
            setUserForm({
                username: user.username,
                id: user.id,
                email: user.email,
                password: '', // لا نعرض الباسورد المحفوظة
                role: user.role || USER_ROLES.CASHIER,
                customPermissions: user.customPermissions || {},
                permissions: user.permissions || ROLE_PERMISSIONS[user.role || USER_ROLES.CASHIER]
            });
        } else {
             setEditingSettingsUser(null);
             setUserForm({
                username: '',
                id: crypto.randomUUID(),
                email: '',
                password: '',
                role: USER_ROLES.CASHIER,
                permissions: ROLE_PERMISSIONS[USER_ROLES.CASHIER],
                customPermissions: {}
             });
        }
        setIsUserModalOpen(true);
    };

    const handleUserFormSubmit = (e) => {
        e.preventDefault();
        if (!userForm.username.trim() || !userForm.email.trim()) {
            showToast('يجب إدخال الاسم والبريد الإلكتروني.', 'error');
            return;
        }

        // التحقق من كلمة المرور عند إضافة مستخدم جديد فقط
        if (!editingSettingsUser && !userForm.password.trim()) {
            showToast('يجب إدخال كلمة المرور للمستخدم الجديد.', 'error');
            return;
        }

        // منع إنشاء حساب أدمن جديد
        if (!editingSettingsUser && userForm.role === USER_ROLES.ADMIN) {
            showToast('لا يمكن إنشاء حساب أدمن جديد. يمكن فقط تعديل الحسابات الموجودة.', 'error');
            return;
        }

        const userToSave = {
            ...userForm,
            // ضمان وجود صلاحية الرؤية دائما للوحة المعلومات
            // دمج الصلاحيات الأساسية مع الصلاحيات المخصصة
            role: userForm.role || USER_ROLES.CASHIER,
            customPermissions: userForm.customPermissions || {},
            permissions: {
                ...ROLE_PERMISSIONS[userForm.role || USER_ROLES.CASHIER],
                ...userForm.customPermissions,
                dashboard: { view: true }
            }
        };

        handleSettingChange(prev => {
            const newUsers = editingSettingsUser
                ? prev.users.map(u => u.id === userToSave.id ? userToSave : u)
                : [...prev.users, userToSave];

            // تصحيح: يجب تحديث المستخدم الذي تم تعديله بـ userToSave
            const finalUsers = prev.users.map(u => u.id === userToSave.id ? userToSave : u);
            if (!editingSettingsUser) finalUsers.push(userToSave);

            return { ...prev, users: finalUsers };
        });

        setIsUserModalOpen(false);
        showToast(editingSettingsUser ? 'تم تعديل صلاحيات المستخدم بنجاح.' : 'تم إضافة مستخدم جديد بنجاح.', 'success');
    };
    
    const handleDeleteUser = (userId) => {
        handleSettingChange(prev => ({
            ...prev,
            users: prev.users.filter(u => u.id !== userId)
        }));
        showToast('تم حذف المستخدم بنجاح.', 'warning');
    };
    
    // دالة طباعة المستخدمين والصلاحيات
    const handlePrintUsers = () => {
        window.print();
    };
    
    const currentItems = settings[currentList] || [];

    // التعامل مع الخروج من الصفحة دون حفظ
    const handleExitClick = (targetPageKey = null) => {
        if (isDirty) {
            setExitIntent({ open: true, targetPageKey });
        } else if (targetPageKey) {
            onNavigateAttempt(targetPageKey);
        }
    };

    const confirmDiscardAndExit = () => {
        setSettings(originalSettings); // إعادة الحالة الأصلية
        setIsDirty(false);
        // توجيه التنقل بعد تجاهل التغييرات
        if (exitIntent.targetPageKey) {
            onNavigateAttempt(exitIntent.targetPageKey);
        }
        setExitIntent({ open: false, targetPageKey: null });
        showToast('تم إلغاء التغييرات والخروج.', 'warning');
    };

    const confirmSaveAndExit = (e) => {
        // نستخدم دالة saveAllSettings التي تتضمن منطق التنقل
        saveAllSettings(e);
    };


    // **مهم:** تم تعديل <form> الإعدادات ليصبح زر الحفظ في الأسفل
    // نستخدم React.Fragment للتحكم في عناصر الإدخال

    return (
        <div className="p-6 space-y-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <div className="flex flex-col gap-4 border-b-2 border-teal-500 pb-4">
                <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200">الإعدادات</h2>
                {isDirty && (
                    <div className="flex items-center gap-3 bg-red-100 dark:bg-red-900/40 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-2xl shadow-sm">
                        <AlertTriangle className="w-6 h-6" />
                        <div>
                            <p className="text-lg font-bold">لم يتم حفظ التغييرات</p>
                            <p className="text-sm">احفظ التعديلات الحالية قبل المغادرة لتفادي فقدانها.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* **التعامل مع الخروج بدون حفظ** */}
            {exitIntent.open && (
                <Modal title="لم يتم حفظ التغييرات" onClose={() => setExitIntent({ open: false, targetPageKey: null })} size="sm">
                    <p className='text-base md:text-lg font-medium text-gray-700 dark:text-gray-200 mb-4'>
                        لم تحفظ التغييرات التي أجريتها في الإعدادات. اختر متابعة الإجراء المناسب:
                    </p>
                    <div className='flex flex-col sm:flex-row gap-3'>
                        <ActionButton
                            onClick={confirmDiscardAndExit}
                            className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-100 dark:hover:bg-gray-500 flex-1"
                        >
                            <Trash2 className="w-5 h-5 ml-2" />
                            إلغاء التغييرات
                        </ActionButton>
                        <ActionButton
                            onClick={confirmSaveAndExit}
                            className="bg-green-600 hover:bg-green-700 flex-1"
                        >
                            <Save className="w-5 h-5 ml-2" />
                            حفظ التغييرات والانتقال
                        </ActionButton>
                    </div>
                </Modal>
            )}


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                {/* إدارة القوائم (الفئات والموردين) */}
                <div className="space-y-4 md:space-y-6 p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-teal-500 dark:border-teal-400 bg-gray-50 dark:bg-gray-700">
                    <h3 className="text-lg md:text-2xl font-bold text-teal-800 dark:text-teal-300 flex items-center"><List className="w-5 h-5 md:w-6 md:h-6 ml-2" /> إدارة الفئات والأقسام والمناصب</h3>

                    <div className="flex gap-2 overflow-x-auto -mx-2 px-2 pb-2">
                        {categoryLists.map(key => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setCurrentList(key)}
                                className={`px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm flex-shrink-0 font-semibold transition whitespace-nowrap ${currentList === key ? 'bg-teal-600 text-white shadow-md' : 'bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-teal-50 dark:hover:bg-gray-600'}`}
                            >
                                {key === 'expenseCategories' ? 'مصروفات' : key === 'revenueCategories' ? 'إيرادات' : key === 'advanceCategories' ? 'سلف' : key === 'departments' ? 'أقسام' : 'مناصب'}
                            </button>
                        ))}
                    </div>

                    <form onSubmit={handleAddItem} className="space-y-3">
                        <h4 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300">إضافة {categoryLabels[currentList]}</h4>
                        <InputField
                            value={newItem}
                            onChange={(e) => setNewItem(e.target.value)}
                            placeholder="أدخل اسماً جديداً"
                            required
                            readOnly={!canManageCategories}
                        >
                            <button
                                type="submit"
                                disabled={!canManageCategories}
                                className={`absolute left-1 top-1/2 transform -translate-y-1/2 px-4 py-1 text-sm rounded-lg p-2 ${canManageCategories ? 'bg-white hover:bg-gray-100 dark:bg-gray-600' : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-600/40'}`}
                            >
                                <Plus className={`w-4 h-4 ${canManageCategories ? 'text-teal-600' : 'text-gray-400'}`} />
                            </button>
                        </InputField>
                        {!canManageCategories && (
                            <p className="text-xs text-red-600 dark:text-red-300">لا تملك صلاحية إضافة أو تعديل الفئات.</p>
                        )}
                    </form>

                    <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                        <h4 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600 pb-1">القائمة الحالية:</h4>
                        {currentItems.map(item => (
                            <div key={item} className="flex justify-between gap-2 items-center p-2 bg-gray-100 dark:bg-gray-600 rounded-lg shadow-sm">
                                <span className="font-medium text-sm md:text-base break-words flex-1 text-gray-800 dark:text-gray-200">{item}</span>
                                <button
                                    type="button"
                                    onClick={() => handleDeleteItem(item)}
                                    disabled={!canManageCategories}
                                    className={`p-1 flex-shrink-0 rounded-md ${canManageCategories ? 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-gray-400 cursor-not-allowed'}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                        {currentItems.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 italic">لا توجد عناصر مضافة حالياً.</p>}
                    </div>
                </div>

                {/* إدارة الموردين والمندوبين */}
                <div className="space-y-4 md:space-y-6 p-4 md:p-6 rounded-xl shadow-lg border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-800">
                    <h3 className="text-lg md:text-2xl font-bold text-blue-800 dark:text-blue-300 flex items-center"><User className="w-5 h-5 md:w-6 md:h-6 ml-2" /> إدارة الموردين والمندوبين</h3>

                    <div className="grid gap-4">
                        <form onSubmit={handleAddVendor} className="space-y-3 p-3 md:p-4 border border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-900">
                            <h4 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-200 border-b pb-2">إضافة مورد جديد</h4>
                            <InputField
                                label="اسم المورد"
                                value={newVendor}
                                onChange={(e) => setNewVendor(e.target.value)}
                                required
                                readOnly={!canManageVendors}
                            />
                            <ActionButton type="submit" disabled={!canManageVendors} className={`w-full ${canManageVendors ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                                <FolderOpen className="w-5 h-5 ml-2" />
                                إضافة المورد
                            </ActionButton>
                            {!canManageVendors && <p className="text-xs text-red-600 dark:text-red-300">لا تملك صلاحية إدارة الموردين.</p>}
                        </form>

                        <div className="space-y-2 max-h-44 overflow-y-auto p-3 border border-blue-200 dark:border-blue-700 rounded-xl bg-white dark:bg-gray-900">
                            <h4 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-200 border-b border-blue-200 dark:border-blue-700 pb-1">قائمة الموردين</h4>
                            {settings.vendors.map(vendor => (
                                <div key={vendor} className="flex justify-between items-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                                    <span className="font-medium text-sm md:text-base text-blue-900 dark:text-blue-100">{vendor}</span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteVendor(vendor)}
                                        disabled={!canManageVendors}
                                        className={`p-1 rounded-md ${canManageVendors ? 'text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30' : 'text-gray-400 cursor-not-allowed'}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {settings.vendors.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 italic">لم يتم إضافة موردين بعد.</p>}
                        </div>

                        <form onSubmit={handleAddRep} className="space-y-3 p-3 md:p-4 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800">
                            <h4 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 border-b pb-2">إضافة مندوب جديد</h4>
                            <InputField
                                label="اسم المندوب"
                                value={newRep.name}
                                onChange={(e) => setNewRep({ ...newRep, name: e.target.value })}
                                required
                                readOnly={!canManageRepresentatives}
                            />
                            <div className="flex flex-col space-y-1 text-right">
                                <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">تابع لشركة</label>
                                <select
                                    value={newRep.vendor}
                                    onChange={(e) => setNewRep({ ...newRep, vendor: e.target.value })}
                                    required
                                    disabled={!canManageRepresentatives || settings.vendors.length === 0}
                                    className={`w-full p-2 md:p-3 border border-gray-300 dark:border-gray-600 text-sm md:text-base rounded-xl focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 transition ${!canManageRepresentatives ? 'bg-gray-100 dark:bg-gray-700/40 cursor-not-allowed text-gray-400' : ''}`}
                                >
                                    <option value="" disabled>اختر المورد</option>
                                    {settings.vendors.map(vendor => (
                                        <option key={vendor} value={vendor}>{vendor}</option>
                                    ))}
                                </select>
                            </div>
                            <ActionButton type="submit" disabled={!canManageRepresentatives || !settings.vendors.length} className={`w-full ${canManageRepresentatives && settings.vendors.length ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400 cursor-not-allowed'}`}>
                                <UserPlus className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                                إضافة المندوب
                            </ActionButton>
                            {!canManageRepresentatives && <p className="text-xs text-red-600 dark:text-red-300">لا تملك صلاحية إدارة المندوبين.</p>}
                            {canManageRepresentatives && settings.vendors.length === 0 && <p className="text-xs text-amber-600 dark:text-amber-300">أضف مورداً أولاً قبل تسجيل المندوبين.</p>}
                        </form>

                        <div className="space-y-2 max-h-60 overflow-y-auto p-2 border border-blue-200 dark:border-blue-700 rounded-lg bg-white dark:bg-gray-900">
                            <h4 className="text-sm md:text-base font-semibold text-gray-700 dark:text-gray-300 border-b border-blue-200 dark:border-blue-700 pb-1">قائمة المندوبين</h4>
                            {settings.representatives.map(rep => (
                                <div key={`${rep.name}-${rep.vendor}`} className="flex justify-between gap-2 items-center p-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg shadow-sm">
                                    <div className="flex flex-col text-right">
                                        <span className="font-medium text-sm md:text-base text-blue-900 dark:text-blue-100">{rep.name}</span>
                                        <span className="text-xs md:text-sm text-blue-600 dark:text-blue-300">{rep.vendor}</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteRep(rep)}
                                        disabled={!canManageRepresentatives}
                                        className={`text-red-500 p-1 flex-shrink-0 rounded-md ${canManageRepresentatives ? 'hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30' : 'cursor-not-allowed text-gray-400'}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {settings.representatives.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400 italic">لا يوجد مندوبون مضافون حالياً.</p>}
                        </div>
                    </div>
                </div>
                
            </div>
            
             <ActionButton onClick={(e) => saveAllSettings(e)} className="w-full bg-green-600 hover:bg-green-700 mt-8">
                <Save className="w-5 h-5 ml-2" />
                حفظ جميع التغييرات في الإعدادات
            </ActionButton>
        </div>
    );
});

/**
 * قسم إدارة المستخدمين
 */
const UserManagementSection = React.memo(({ data, handleDataAction, showToast }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [userForm, setUserForm] = useState({
        username: '',
        password: '',
        role: USER_ROLES.GENERAL_MANAGER,
        customPermissions: {}
    });

    const {
        paginatedItems: paginatedUsers,
        totalItems: totalUsers,
        pageSize: usersPageSize,
        currentPage: usersCurrentPage,
        totalPages: usersTotalPages,
        changePageSize: changeUsersPageSize,
        goToPage: goToUsersPage,
    } = usePagination(data.settings.users || []);

    const handleAddUser = () => {
        setEditingUser(null);
        setUserForm({
            username: '',
            password: '',
            role: USER_ROLES.GENERAL_MANAGER,
            customPermissions: {}
        });
        setIsModalOpen(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setUserForm({
            username: user.username,
            password: user.password,
            role: user.role,
            customPermissions: user.customPermissions || {}
        });
        setIsModalOpen(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!userForm.username || !userForm.password) {
            showToast('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
            return;
        }

        const updatedUsers = [...data.settings.users];
        
        if (editingUser) {
            // تعديل مستخدم موجود
            const index = updatedUsers.findIndex(u => u.id === editingUser.id);
            if (index !== -1) {
                updatedUsers[index] = {
                    ...updatedUsers[index],
                    username: userForm.username,
                    password: userForm.password,
                    role: userForm.role,
                    permissions: ROLE_PERMISSIONS[userForm.role],
                    customPermissions: userForm.customPermissions
                };
            }
            showToast('تم تحديث المستخدم بنجاح', 'success');
        } else {
            // إضافة مستخدم جديد
            const newUser = {
                id: `user_${Date.now()}`,
                username: userForm.username,
                email: `${userForm.username}@system.com`,
                password: userForm.password,
                role: userForm.role,
                permissions: ROLE_PERMISSIONS[userForm.role],
                customPermissions: userForm.customPermissions,
                darkMode: false,
                sidebarCollapsed: false
            };
            updatedUsers.push(newUser);
            showToast('تم إضافة المستخدم بنجاح', 'success');
        }

        const updatedSettings = {
            ...data.settings,
            users: updatedUsers
        };

        handleDataAction('___FULL_DATA_UPDATE___', {
            ...data,
            settings: updatedSettings
        }, false);

        setIsModalOpen(false);
    };

    const handleDeleteUser = (user) => {
        if (user.role === USER_ROLES.ADMIN) {
            showToast('لا يمكن حذف حساب الأدمن', 'error');
            return;
        }

        if (window.confirm(`هل أنت متأكد من حذف المستخدم "${user.username}"؟`)) {
            const updatedUsers = data.settings.users.filter(u => u.id !== user.id);
            const updatedSettings = {
                ...data.settings,
                users: updatedUsers
            };

            handleDataAction('___FULL_DATA_UPDATE___', {
                ...data,
                settings: updatedSettings
            }, false);

            showToast('تم حذف المستخدم بنجاح', 'success');
        }
    };

    const togglePermission = (module, action) => {
        setUserForm(prev => ({
            ...prev,
            customPermissions: {
                ...prev.customPermissions,
                [module]: {
                    ...prev.customPermissions[module],
                    [action]: !prev.customPermissions[module]?.[action]
                }
            }
        }));
    };

    const getCurrentPermissions = (module) => {
        const rolePerms = ROLE_PERMISSIONS[userForm.role]?.[module] || {};
        const customPerms = userForm.customPermissions[module] || {};
        return { ...rolePerms, ...customPerms };
    };

    const modules = [
        { key: 'dashboard', name: 'الرئيسية', actions: ['view'] },
        { key: 'revenues', name: 'الإيرادات', actions: ['view', 'add', 'edit', 'delete'] },
        { key: 'expenses', name: 'المصروفات', actions: ['view', 'add', 'edit', 'delete'] },
        { key: 'advances', name: 'السلف', actions: ['view', 'add', 'edit', 'delete'] },
        { key: 'suspended', name: 'الصرفيات المعلقة', actions: ['view', 'add', 'edit', 'delete'] },
        { key: 'pendingExpenses', name: 'طلبات الصرف', actions: ['view', 'add', 'edit', 'delete', 'approve', 'cancel'] },
        { key: 'employees', name: 'الموظفين', actions: ['view', 'add', 'edit', 'delete'] },
        { key: 'payroll', name: 'الرواتب', actions: ['view', 'add', 'edit', 'delete', 'pay'] },
        { key: 'inventoryEntry', name: 'الإدخال المخزني', actions: ['view', 'add', 'edit', 'delete', 'approve', 'credit', 'cancel'] },
        { key: 'inventoryWithdrawal', name: 'الاستخراج المخزني', actions: ['view', 'add', 'edit', 'delete'] },
        { key: 'inventory', name: 'المخزون', actions: ['view', 'add', 'edit', 'delete'] },
        { key: 'settings', name: 'الإعدادات', actions: ['view', 'manageCategories', 'manageVendors', 'manageRepresentatives'] },
        { key: 'admin', name: 'صفحة الإدارة', actions: ['view'] }
    ];

    const actionLabels = {
        view: 'مشاهدة',
        add: 'إضافة',
        edit: 'تعديل',
        delete: 'حذف',
        approve: 'مصادقة',
        cancel: 'إلغاء',
        pay: 'دفع',
        credit: 'آجل',
        manageCategories: 'إدارة الفئات',
        manageVendors: 'إدارة الموردين',
        manageRepresentatives: 'إدارة المندوبين'
    };

    return (
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 border border-purple-200 dark:border-purple-700">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    إدارة المستخدمين
                </h3>
                <button
                    onClick={handleAddUser}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                    data-testid="button-add-user"
                >
                    <Plus className="w-5 h-5" />
                    إضافة مستخدم
                </button>
            </div>

            {/* جدول المستخدمين */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-purple-100 dark:bg-purple-900/30">
                        <tr>
                            <th className="p-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">اسم المستخدم</th>
                            <th className="p-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">كلمة المرور</th>
                            <th className="p-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">الصلاحية</th>
                            <th className="p-3 text-center text-sm font-bold text-gray-700 dark:text-gray-300">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedUsers.map((user, index) => (
                            <tr key={user.id} className={index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50 dark:bg-gray-700'}>
                                <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{user.username}</td>
                                <td className="p-3 text-sm text-gray-800 dark:text-gray-200">{user.password}</td>
                                <td className="p-3 text-sm">
                                    <span className="px-3 py-1 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full text-xs font-semibold">
                                        {ROLE_LABELS[user.role]}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <div className="flex items-center justify-center gap-2">
                                        <button
                                            onClick={() => handleEditUser(user)}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
                                            data-testid={`button-edit-user-${user.id}`}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        {user.role !== USER_ROLES.ADMIN && (
                                            <button
                                                onClick={() => handleDeleteUser(user)}
                                                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                                                data-testid={`button-delete-user-${user.id}`}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                pageSize={usersPageSize}
                onPageSizeChange={changeUsersPageSize}
                currentPage={usersCurrentPage}
                totalPages={usersTotalPages}
                onPageChange={goToUsersPage}
                totalItems={totalUsers}
            />

            {/* مودال إضافة/تعديل مستخدم */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={() => setIsModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                            {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
                        </h3>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* معلومات أساسية */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        اسم المستخدم
                                    </label>
                                    <input
                                        type="text"
                                        value={userForm.username}
                                        onChange={(e) => setUserForm(prev => ({ ...prev, username: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                        required
                                        data-testid="input-username"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                        كلمة المرور
                                    </label>
                                    <input
                                        type="text"
                                        value={userForm.password}
                                        onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                        required
                                        data-testid="input-user-password"
                                    />
                                </div>
                            </div>

                            {/* اختيار الدور */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                    الصلاحية الافتراضية
                                </label>
                                <select
                                    value={userForm.role}
                                    onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value, customPermissions: {} }))}
                                    className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                                    data-testid="select-user-role"
                                    disabled={editingUser?.role === USER_ROLES.ADMIN}
                                >
                                    {Object.entries(ROLE_LABELS).map(([key, label]) => (
                                        <option key={key} value={key} disabled={key === USER_ROLES.ADMIN && !editingUser}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                    {ROLE_DESCRIPTIONS[userForm.role]}
                                </p>
                            </div>

                            {/* صلاحيات مخصصة */}
                            <div>
                                <h4 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
                                    تخصيص الصلاحيات
                                </h4>
                                <div className="space-y-4 max-h-96 overflow-y-auto">
                                    {modules.map(module => {
                                        const perms = getCurrentPermissions(module.key);
                                        return (
                                            <div key={module.key} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">{module.name}</h5>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    {module.actions.map(action => (
                                                        <label key={action} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                            <input
                                                                type="checkbox"
                                                                checked={perms[action] || false}
                                                                onChange={() => togglePermission(module.key, action)}
                                                                className="w-4 h-4 text-purple-600 focus:ring-purple-500 rounded"
                                                            />
                                                            {actionLabels[action]}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* أزرار الحفظ والإلغاء */}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition"
                                    data-testid="button-save-user"
                                >
                                    {editingUser ? 'حفظ التعديلات' : 'إضافة المستخدم'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
                                    data-testid="button-cancel-user"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
});

/**
 * 3.6.1. AdminPage (صفحة الإدارة)
 * صفحة إدارة النظام والمعلومات الإدارية
 */
/**
 * قسم إدارة رابط Google Drive
 */
const GoogleDriveLinkSection = React.memo(({ data, handleDataAction, showToast }) => {
    const [googleDriveUrl, setGoogleDriveUrl] = useState(data.settings.googleDriveFolderUrl || '');

    const handleUpdateGoogleDriveUrl = () => {
        const updatedSettings = {
            ...data.settings,
            googleDriveFolderUrl: googleDriveUrl
        };

        handleDataAction('___FULL_DATA_UPDATE___', {
            ...data,
            settings: updatedSettings
        }, false);

        showToast('تم تحديث رابط مجلد Google Drive بنجاح! 📁', 'success');
    };

    return (
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-green-50 to-teal-100 dark:from-green-900/30 dark:to-teal-800/30 border-r-4 border-green-600">
            <h3 className="text-2xl font-bold text-green-800 dark:text-green-300 mb-6 flex items-center gap-2">
                <FolderOpen className="w-6 h-6" />
                إدارة مجلد الفواتير والمستمسكات (Google Drive)
            </h3>

            <div className="space-y-4">
                <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-lg border border-green-300 dark:border-green-700">
                    <p className="text-sm text-green-900 dark:text-green-200 font-semibold mb-2">
                        📂 المجلد الحالي:
                    </p>
                    {googleDriveUrl ? (
                        <div className="flex items-center gap-2">
                            <a 
                                href={googleDriveUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 dark:text-blue-400 hover:underline font-mono text-sm break-all"
                            >
                                {googleDriveUrl}
                            </a>
                            <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        </div>
                    ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">لم يتم تعيين رابط بعد</p>
                    )}
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        رابط مجلد Google Drive
                    </label>
                    <input
                        type="url"
                        value={googleDriveUrl}
                        onChange={(e) => setGoogleDriveUrl(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        placeholder="https://drive.google.com/drive/folders/..."
                        data-testid="input-google-drive-url"
                    />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        الصق رابط المجلد المشترك من Google Drive حيث سيتم حفظ جميع الفواتير والمستمسكات
                    </p>
                </div>

                <ActionButton
                    onClick={handleUpdateGoogleDriveUrl}
                    className="w-full bg-green-600 hover:bg-green-700"
                    data-testid="button-update-google-drive-url"
                >
                    <Save className="w-5 h-5 ml-2" />
                    حفظ رابط المجلد
                </ActionButton>

                <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-300 dark:border-blue-700">
                    <p className="text-xs text-blue-900 dark:text-blue-200 font-semibold">
                        💡 ملاحظة: تأكد من أن المجلد مشارك مع جميع المستخدمين المعنيين. يمكن رفع الملفات يدوياً أو من خلال الماسح الضوئي.
                    </p>
                </div>
            </div>
        </div>
    );
});

/**
 * قسم تغيير الماستر كي
 */
const MasterKeySection = React.memo(({ data, handleDataAction, showToast }) => {
    const [newMasterKey, setNewMasterKey] = useState('');
    const [confirmMasterKey, setConfirmMasterKey] = useState('');
    const [showMasterKey, setShowMasterKey] = useState(false);
    const [showConfirmKey, setShowConfirmKey] = useState(false);
    const [showCurrentMasterKey, setShowCurrentMasterKey] = useState(false);

    const handleUpdateMasterKey = () => {
        if (!newMasterKey || !confirmMasterKey) {
            showToast('يرجى إدخال المفتاح الرئيسي وتأكيده', 'error');
            return;
        }

        if (newMasterKey !== confirmMasterKey) {
            showToast('المفتاح الرئيسي وتأكيده غير متطابقين', 'error');
            return;
        }

        if (newMasterKey.length < 8) {
            showToast('يجب أن يكون المفتاح الرئيسي 8 أحرف على الأقل', 'error');
            return;
        }

        const updatedSettings = {
            ...data.settings,
            masterKey: newMasterKey
        };

        handleDataAction('___FULL_DATA_UPDATE___', {
            ...data,
            settings: updatedSettings
        }, false);

        showToast('تم تحديث المفتاح الرئيسي بنجاح! 🔑', 'success');
        setNewMasterKey('');
        setConfirmMasterKey('');
    };

    return (
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-red-50 to-pink-100 dark:from-red-900/30 dark:to-pink-800/30 border-r-4 border-red-600">
            <h3 className="text-2xl font-bold text-red-800 dark:text-red-300 mb-6 flex items-center gap-2">
                <Key className="w-6 h-6" />
                إدارة المفتاح الرئيسي (Master Key)
            </h3>

            <div className="space-y-4">
                <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-lg border border-red-300 dark:border-red-700">
                    <p className="text-sm text-red-900 dark:text-red-200 font-semibold mb-2">
                        🔐 المفتاح الرئيسي الحالي:
                    </p>
                    <div className="relative">
                        <p className="text-lg font-mono text-red-800 dark:text-red-300 bg-white dark:bg-gray-800 p-3 pr-4 pl-12 rounded">
                            {showCurrentMasterKey ? data.settings.masterKey : '••••••••••••'}
                        </p>
                        <button
                            type="button"
                            onClick={() => setShowCurrentMasterKey(!showCurrentMasterKey)}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            data-testid="button-toggle-current-master-key"
                        >
                            {showCurrentMasterKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        المفتاح الرئيسي الجديد
                    </label>
                    <div className="relative">
                        <input
                            type={showMasterKey ? 'text' : 'password'}
                            value={newMasterKey}
                            onChange={(e) => setNewMasterKey(e.target.value)}
                            className="w-full p-3 pr-4 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            placeholder="أدخل المفتاح الرئيسي الجديد"
                            data-testid="input-new-master-key"
                        />
                        <button
                            type="button"
                            onClick={() => setShowMasterKey(!showMasterKey)}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            {showMasterKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        تأكيد المفتاح الرئيسي الجديد
                    </label>
                    <div className="relative">
                        <input
                            type={showConfirmKey ? 'text' : 'password'}
                            value={confirmMasterKey}
                            onChange={(e) => setConfirmMasterKey(e.target.value)}
                            className="w-full p-3 pr-4 pl-12 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            placeholder="أعد إدخال المفتاح الرئيسي"
                            data-testid="input-confirm-master-key"
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmKey(!showConfirmKey)}
                            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            {showConfirmKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <ActionButton
                    onClick={handleUpdateMasterKey}
                    className="w-full bg-red-600 hover:bg-red-700"
                    data-testid="button-update-master-key"
                >
                    <Save className="w-5 h-5 ml-2" />
                    تحديث المفتاح الرئيسي
                </ActionButton>

                <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-300 dark:border-amber-700">
                    <p className="text-xs text-amber-900 dark:text-amber-200 font-semibold">
                        ⚠️ تحذير: المفتاح الرئيسي يمنح صلاحيات كاملة للنظام. احتفظ به في مكان آمن ولا تشاركه مع أحد.
                    </p>
                </div>
            </div>
        </div>
    );
});

const AdminPage = React.memo(({ data, handleDataAction, showToast }) => {
    const [companyNameInput, setCompanyNameInput] = useState(data.settings.companyName || '');
    const [companyLogoInput, setCompanyLogoInput] = useState(data.settings.companyLogoUrl || '');
    const [systemExpiryDate, setSystemExpiryDate] = useState(data.settings.systemExpiryDate || '');

    useEffect(() => {
        setCompanyNameInput(data.settings.companyName || '');
        setCompanyLogoInput(data.settings.companyLogoUrl || '');
    }, [data.settings.companyName, data.settings.companyLogoUrl]);

    const handleCompanyInfoSave = () => {
        const updatedSettings = {
            ...data.settings,
            companyName: companyNameInput,
            companyLogoUrl: companyLogoInput
        };

        handleDataAction('___FULL_DATA_UPDATE___', {
            ...data,
            settings: updatedSettings
        }, false);

        showToast('تم تحديث بيانات الشركة بنجاح!', 'success');
    };
    
    const handleExpiryDateUpdate = () => {
        const updatedSettings = {
            ...data.settings,
            systemExpiryDate: systemExpiryDate || null
        };
        
        handleDataAction('___FULL_DATA_UPDATE___', {
            ...data,
            settings: updatedSettings
        }, false);
        
        showToast('تم تحديث صلاحية النظام بنجاح!', 'success');
    };
    
    const systemInfo = {
        version: 'v 0.4',
        lastBackup: 'لم يتم إنشاء نسخة احتياطية',
        totalUsers: data.settings.users.length,
        totalEmployees: data.employees.length,
        totalRevenues: data.revenues.length,
        totalExpenses: data.expenses.length,
        totalInventoryItems: data.inventory.length,
        storageUsed: new Blob([JSON.stringify(data)]).size,
    };

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    };

    return (
        <div className="p-6 space-y-8 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-purple-500 pb-3 flex items-center gap-3">
                <Shield className="w-9 h-9 text-purple-600 dark:text-purple-400" />
                لوحة الإدارة
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="space-y-4 p-6 rounded-2xl shadow-lg border border-purple-200 dark:border-purple-600 bg-white dark:bg-gray-900">
                    <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200 flex items-center gap-2"><Building className="w-5 h-5" /> تحديث بيانات الشركة</h3>
                    <InputField
                        label="اسم الشركة"
                        value={companyNameInput}
                        onChange={(e) => setCompanyNameInput(e.target.value)}
                        required
                    />
                    <InputField
                        label="رابط شعار الشركة (Logo URL)"
                        value={companyLogoInput}
                        onChange={(e) => setCompanyLogoInput(e.target.value)}
                        placeholder="https://example.com/logo.png"
                    />
                    <ActionButton onClick={handleCompanyInfoSave} className="bg-purple-600 hover:bg-purple-700">
                        <Save className="w-5 h-5 ml-2" />
                        حفظ بيانات الشركة
                    </ActionButton>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center md:items-stretch gap-4 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-2xl border border-purple-200 dark:border-purple-700">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    {data.settings.companyLogoUrl ? (
                        <img
                            src={data.settings.companyLogoUrl}
                            alt="شعار الشركة"
                            className="h-20 w-20 object-contain rounded-xl border border-purple-200 dark:border-purple-600 bg-white dark:bg-gray-900 p-2"
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                    ) : (
                        <div className="h-20 w-20 flex items-center justify-center rounded-xl border border-dashed border-purple-300 text-purple-400 text-sm">
                            لا يوجد شعار
                        </div>
                    )}
                    <div className="text-right">
                        <p className="text-sm font-semibold text-purple-700 dark:text-purple-300">اسم الشركة المسجل في الإعدادات</p>
                        <h3 className="text-2xl font-extrabold text-purple-900 dark:text-purple-100">
                            {data.settings.companyName || 'غير محدد'}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 border-r-4 border-blue-600" data-testid="card-system-version">
                    <div className="flex items-center gap-3 mb-3">
                        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300">إصدار النظام</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-blue-900 dark:text-blue-200">{systemInfo.version}</p>
                </div>

                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-r-4 border-green-600" data-testid="card-total-users">
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <h3 className="text-xl font-bold text-green-800 dark:text-green-300">عدد المستخدمين</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-green-900 dark:text-green-200">{systemInfo.totalUsers}</p>
                </div>

                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 border-r-4 border-purple-600" data-testid="card-total-employees">
                    <div className="flex items-center gap-3 mb-3">
                        <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        <h3 className="text-xl font-bold text-purple-800 dark:text-purple-300">عدد الموظفين</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-purple-900 dark:text-purple-200">{systemInfo.totalEmployees}</p>
                </div>

                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-900/30 dark:to-teal-800/30 border-r-4 border-teal-600" data-testid="card-total-revenues">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingUp className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                        <h3 className="text-xl font-bold text-teal-800 dark:text-teal-300">عدد الإيرادات</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-teal-900 dark:text-teal-200">{systemInfo.totalRevenues}</p>
                </div>

                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-r-4 border-red-600" data-testid="card-total-expenses">
                    <div className="flex items-center gap-3 mb-3">
                        <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />
                        <h3 className="text-xl font-bold text-red-800 dark:text-red-300">عدد الصرفيات</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-red-900 dark:text-red-200">{systemInfo.totalExpenses}</p>
                </div>

                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/30 border-r-4 border-amber-600" data-testid="card-total-inventory">
                    <div className="flex items-center gap-3 mb-3">
                        <Package className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        <h3 className="text-xl font-bold text-amber-800 dark:text-amber-300">عدد المواد المخزنية</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-amber-900 dark:text-amber-200">{systemInfo.totalInventoryItems}</p>
                </div>

            
            {/* قسم تحديد صلاحية النظام */}
            <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/30 dark:to-amber-800/30 border-r-4 border-orange-600">
                <h3 className="text-2xl font-bold text-orange-800 dark:text-orange-300 mb-6 flex items-center gap-2">
                    <CalendarCheck className="w-6 h-6" />
                    إدارة صلاحية النظام
                </h3>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            تاريخ انتهاء الصلاحية
                        </label>
                        <input
                            type="date"
                            value={systemExpiryDate}
                            onChange={(e) => setSystemExpiryDate(e.target.value)}
                            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                            data-testid="input-expiry-date"
                        />
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {systemExpiryDate ? `الصلاحية تنتهي في: ${formatDateDDMMYYYY(systemExpiryDate)}` : "لا توجد صلاحية محددة (النظام مفتوح)"}
                        </p>
                    </div>
                    
                    <ActionButton
                        onClick={handleExpiryDateUpdate}
                        className="w-full bg-orange-600 hover:bg-orange-700"
                        data-testid="button-update-expiry"
                    >
                        <Save className="w-5 h-5 ml-2" />
                        حفظ التغييرات
                    </ActionButton>
                    
                    {systemExpiryDate && (
                        <div className="bg-amber-100 dark:bg-amber-900/30 p-4 rounded-lg border border-amber-300 dark:border-amber-700">
                            <p className="text-sm text-amber-900 dark:text-amber-200 font-semibold">
                                ⚠️ ملاحظة: الأدمن فقط يمكنه الدخول للنظام حتى لو انتهت الصلاحية
                            </p>
                        </div>
                    )}
                </div>
            </div>
            
            {/* قسم إدارة رابط Google Drive */}
            <GoogleDriveLinkSection data={data} handleDataAction={handleDataAction} showToast={showToast} />
            
            {/* قسم تغيير الماستر كي */}
            <MasterKeySection data={data} handleDataAction={handleDataAction} showToast={showToast} />
            
                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 border-r-4 border-indigo-600" data-testid="card-storage-size">
                    <div className="flex items-center gap-3 mb-3">
                        <Save className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-xl font-bold text-indigo-800 dark:text-indigo-300">حجم البيانات</h3>
                    </div>
                    <p className="text-3xl font-extrabold text-indigo-900 dark:text-indigo-200">{formatBytes(systemInfo.storageUsed)}</p>
                </div>

                <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/30 border-r-4 border-gray-600" data-testid="card-last-backup">
                    <div className="flex items-center gap-3 mb-3">
                        <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-300">آخر نسخة احتياطية</h3>
                    </div>
                    <p className="text-lg font-bold text-gray-700 dark:text-gray-300">{systemInfo.lastBackup}</p>
                </div>
            </div>
            
            {/* قسم إدارة المستخدمين */}
            <UserManagementSection data={data} handleDataAction={handleDataAction} showToast={showToast} />
            
            {/* قسم سجل النشاطات */}
            <ActivityLogSection data={data} />
        </div>
    );
});

/**
 * قسم سجل النشاطات
 */
const ActivityLogSection = React.memo(({ data }) => {
    const [searchTerm, setSearchTerm] = React.useState('');
    const [filterAction, setFilterAction] = React.useState('all');
    const [filterDays, setFilterDays] = React.useState('all');
    const [selectedLog, setSelectedLog] = React.useState<any>(null);

    const activityLog = data.activityLog || [];
    
    // فلترة السجلات
    const filteredLogs = React.useMemo(() => {
        let logs = [...activityLog];
        
        // فلترة حسب نوع العملية
        if (filterAction !== 'all') {
            logs = logs.filter(log => log.action === filterAction);
        }
        
        // فلترة حسب التاريخ
        if (filterDays !== 'all') {
            const daysAgo = parseInt(filterDays);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
            logs = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
        }
        
        // بحث في المحتوى
        if (searchTerm) {
            logs = logs.filter(log => 
                log.username.includes(searchTerm) ||
                log.action.includes(searchTerm) ||
                log.module.includes(searchTerm) ||
                (log.details && log.details.includes(searchTerm))
            );
        }
        
        return logs;
    }, [activityLog, searchTerm, filterAction, filterDays]);
    
    const openLogDetails = (log) => {
        setSelectedLog(log);
    };

    const closeLogDetails = () => {
        setSelectedLog(null);
    };

    return (
        <div className="p-6 rounded-xl shadow-lg bg-gradient-to-br from-gray-50 to-white dark:from-gray-700 dark:to-gray-800 border border-gray-200 dark:border-gray-600">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 flex items-center gap-2">
                <Clock className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                سجل النشاطات
            </h3>
            
            {/* الفلاتر والبحث */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        بحث
                    </label>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="ابحث في السجلات..."
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        data-testid="input-activity-search"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        نوع العملية
                    </label>
                    <select
                        value={filterAction}
                        onChange={(e) => setFilterAction(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        data-testid="select-action-filter"
                    >
                        <option value="all">الكل</option>
                        <option value="إضافة">إضافة</option>
                        <option value="تعديل">تعديل</option>
                        <option value="حذف">حذف</option>
                        <option value="موافقة">موافقة</option>
                        <option value="إلغاء">إلغاء</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                        الفترة الزمنية
                    </label>
                    <select
                        value={filterDays}
                        onChange={(e) => setFilterDays(e.target.value)}
                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                        data-testid="select-days-filter"
                    >
                        <option value="all">كل الفترة</option>
                        <option value="1">اليوم</option>
                        <option value="7">آخر 7 أيام</option>
                        <option value="30">آخر 30 يوم</option>
                        <option value="90">آخر 90 يوم</option>
                    </select>
                </div>
            </div>
            
            {/* عداد النتائج */}
            <div className="mb-4 text-gray-600 dark:text-gray-400">
                <span className="font-semibold">عدد السجلات: </span>
                <span className="text-lg font-bold text-gray-800 dark:text-gray-200">{filteredLogs.length}</span>
            </div>
            
            {/* جدول السجلات */}
            <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-600">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                التاريخ والوقت
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                المستخدم
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                العملية
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                القسم
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                التفاصيل
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredLogs.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                                    لا توجد سجلات
                                </td>
                            </tr>
                        ) : (
                            filteredLogs.map((log) => (
                                <tr
                                    key={log.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    data-testid={`row-activity-${log.id}`}
                                    onClick={() => openLogDetails(log)}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {formatDateDDMMYYYY(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-800 dark:text-gray-200">
                                        {log.username}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                            log.action === 'إضافة' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                            log.action === 'تعديل' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                            log.action === 'حذف' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                            log.action === 'موافقة' ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300' :
                                            'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                        }`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                                        {log.module}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                                        {log.details || '-'}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedLog && (
                <Modal title={`تفاصيل السجل #${selectedLog.id || ''}`} onClose={closeLogDetails} size="md">
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                            <div className="bg-gray-50 dark:bg-gray-700/60 p-3 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-300 text-xs">التاريخ والوقت</p>
                                <p className="text-gray-800 dark:text-gray-100 font-semibold">
                                    {formatDateDDMMYYYY(selectedLog.timestamp)}
                                    {' '}
                                    {new Date(selectedLog.timestamp).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/60 p-3 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-300 text-xs">المستخدم</p>
                                <p className="text-gray-800 dark:text-gray-100 font-semibold">{selectedLog.username}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/60 p-3 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-300 text-xs">نوع العملية</p>
                                <p className="text-gray-800 dark:text-gray-100 font-semibold">{selectedLog.action}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/60 p-3 rounded-lg">
                                <p className="text-gray-500 dark:text-gray-300 text-xs">القسم</p>
                                <p className="text-gray-800 dark:text-gray-100 font-semibold">{selectedLog.module}</p>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">التفاصيل</h4>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                {selectedLog.details || 'لا توجد تفاصيل إضافية.'}
                            </p>
                        </div>

                        {selectedLog.metadata && typeof selectedLog.metadata === 'object' && Object.keys(selectedLog.metadata).length > 0 && (
                            <div className="bg-gray-50 dark:bg-gray-900/40 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                                <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">بيانات إضافية</h4>
                                <div className="space-y-2 text-xs md:text-sm">
                                    {Object.entries(selectedLog.metadata).map(([key, value]) => (
                                        <div key={key} className="flex justify-between items-center bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-lg px-3 py-2">
                                            <span className="font-semibold text-gray-600 dark:text-gray-300">{key}</span>
                                            <span className="text-gray-800 dark:text-gray-100 text-left break-all ml-3">
                                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <ActionButton onClick={closeLogDetails} className="bg-indigo-600 hover:bg-indigo-700">
                                إغلاق التفاصيل
                            </ActionButton>
                        </div>
                    </div>
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
            const hasTextSearch = searchLower.length > 0;
            const hasNumericSearch = searchNumeric.length > 0;

            list = list.filter(d => {
                const textMatches = hasTextSearch ? normalizeTextForSearch(d.employeeName).includes(searchLower) : false;
                const numericMatches = hasNumericSearch
                    ? !!(d.totalCost && normalizeTextForSearch(d.totalCost.toString(), true).includes(searchNumeric))
                    : false;

                return textMatches || numericMatches;
            });
        }
        return list;
    }, [data.inventoryDispatches, globalSearchHistory]);

    const {
        paginatedItems: paginatedDispatchHistory,
        totalItems: totalDispatchItems,
        pageSize: dispatchPageSize,
        currentPage: dispatchCurrentPage,
        totalPages: dispatchTotalPages,
        changePageSize: changeDispatchPageSize,
        goToPage: goToDispatchPage,
    } = usePagination(dispatchHistory);
    
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

            <div className="p-6 space-y-4 rounded-xl shadow-lg border-l-4 border-indigo-500 bg-gray-50 dark:bg-gray-800">
                <h3 className="text-2xl font-bold text-indigo-800 dark:text-indigo-200 flex items-center border-b dark:border-gray-600 pb-2">
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
                    <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200">
                        <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>

                <div className="overflow-x-auto shadow-md rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-indigo-100 dark:bg-indigo-900/30">
                            <tr>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">التاريخ</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الموظف المستلم</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">عدد المواد</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">التكلفة الإجمالية (د.ع.)</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wide">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {dispatchHistory.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">لا يوجد سجلات صرف مخزني.</td></tr>
                        ) : (
                            paginatedDispatchHistory.map(dispatch => (
                                <tr key={dispatch.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition duration-150 cursor-pointer" onClick={() => openDispatchDetails(dispatch)}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{formatDateTimeDDMMYYYY(dispatch.date)}</td>
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
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-200 border-b dark:border-gray-600 pb-2 mb-4 flex items-center">
                            <List className="w-5 h-5 ml-2 text-indigo-500" />
                            بيانات الصرف
                        </h4>
                        <p className="font-medium text-gray-700 dark:text-gray-300">**الموظف:** {currentDispatch.employeeName}</p>
                        <p className="font-medium text-gray-700 dark:text-gray-300">**التاريخ والوقت:** {formatDateTimeDDMMYYYY(currentDispatch.date)}</p>
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

            {invoiceAttachmentPreview && isImageAttachment(invoiceAttachmentPreview) && (
                <Modal title={`معاينة المرفق: ${invoiceAttachmentPreview.name}`} onClose={() => setInvoiceAttachmentPreview(null)} size="xl">
                    <div className="space-y-4">
                        <div
                            className={`relative overflow-auto border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-900 ${invoicePreviewZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                            onClick={() => setInvoicePreviewZoomed(prev => !prev)}
                        >
                            <img
                                src={invoiceAttachmentPreview.dataUrl || invoiceAttachmentPreview.url || invoiceAttachmentPreview.attachmentUrl}
                                alt={invoiceAttachmentPreview.name}
                                className={`mx-auto transition-transform duration-300 ${invoicePreviewZoomed ? 'scale-150' : 'scale-100'} max-h-[70vh]`}
                            />
                        </div>
                        <p className="text-sm text-center text-gray-500 dark:text-gray-400">اضغط على الصورة للتكبير أو التصغير.</p>
                    </div>
                </Modal>
            )}

        </div>
    );
});

/**
 * 3.8. InventoryWithdrawalComponent (الاستخراج المخزني) - نسخة محدّثة ومبسطة
 */
const InventoryWithdrawalComponent = ({ data, handleDataAction, handleDelete, showToast, handleRefresh, currentUser }) => {
    const { t } = useLanguage();
    const [isNewWithdrawalModalOpen, setIsNewWithdrawalModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [currentWithdrawal, setCurrentWithdrawal] = useState(null);
    const [globalSearch, setGlobalSearch] = useState('');
    const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState(null);
    
    // حالة الـ autocomplete
    const [itemSuggestions, setItemSuggestions] = useState([]);
    const [showItemSuggestions, setShowItemSuggestions] = useState(false);
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [showEmployeeSuggestions, setShowEmployeeSuggestions] = useState(false);

    // دالة للحصول على حالة نموذج الاستخراج الافتراضية
    const getDefaultWithdrawalForm = useCallback(() => ({
        employeeName: '',
        employeeId: '',
        withdrawalNumber: generateInvoiceNumber(),
        items: [],
        date: getDefaultDateTime(),
        notes: '',
        id: null
    }), []);

    // دالة للحصول على حالة نموذج المادة الافتراضية
    const getDefaultItemForm = useCallback(() => ({
        name: '',
        barcode: '',
        count: '1',
        category: ''
    }), []);

    const [withdrawalForm, setWithdrawalForm] = useState(getDefaultWithdrawalForm);
    const [itemForm, setItemForm] = useState(getDefaultItemForm);

    const canAddWithdrawal = !!currentUser?.permissions?.inventoryWithdrawal?.add;
    const canEditWithdrawal = !!currentUser?.permissions?.inventoryWithdrawal?.edit;
    const canDeleteWithdrawal = !!currentUser?.permissions?.inventoryWithdrawal?.delete;
    const canModifyCurrentWithdrawal = withdrawalForm?.id ? canEditWithdrawal : canAddWithdrawal;

    // دالة البحث الذكي في المخزون عند الكتابة في حقل الاسم
    const handleItemNameChange = useCallback((value) => {
        const normalized = normalizeTextForSearch(value);
        setItemForm(prev => {
            const match = data.inventory.find(item => normalizeTextForSearch(item.name) === normalized);
            return {
                ...prev,
                name: value,
                category: match?.category || '',
                barcode: match?.barcode || ''
            };
        });

        if (value.length >= 2) {
            const searchNormalized = normalizeTextForSearch(value);

            const filtered = data.inventory.filter(item => {
                const itemNameNorm = normalizeTextForSearch(item.name);
                const itemBarcodeNorm = item.barcode ? normalizeTextForSearch(item.barcode) : '';
                return (itemNameNorm.includes(searchNormalized) || itemBarcodeNorm.includes(searchNormalized)) && item.count > 0;
            }).slice(0, 5);
            
            setItemSuggestions(filtered);
            setShowItemSuggestions(true);
        } else {
            setShowItemSuggestions(false);
            setItemSuggestions([]);
        }
    }, [data.inventory]);

    const handleBarcodeChange = useCallback((value) => {
        const normalizedBarcode = convertArabicToEnglish(value || '').trim();

        setItemForm(prev => {
            const match = data.inventory.find(item => {
                if (!item.barcode) return false;
                return convertArabicToEnglish(item.barcode).trim() === normalizedBarcode;
            });

            if (match) {
                return {
                    ...prev,
                    barcode: normalizedBarcode,
                    name: match.name,
                    category: match.category
                };
            }

            return {
                ...prev,
                barcode: normalizedBarcode,
                name: '',
                category: ''
            };
        });
    }, [data.inventory]);

    // دالة اختيار اقتراح من القائمة
    const selectItemSuggestion = useCallback((item) => {
        setItemForm(prev => ({
            ...prev,
            name: item.name,
            barcode: item.barcode ? convertArabicToEnglish(item.barcode).trim() : '',
            category: item.category
        }));
        setShowItemSuggestions(false);
        setItemSuggestions([]);
    }, []);
    
    // دالة البحث الذكي في الموظفين عند الكتابة
    const handleEmployeeNameChange = useCallback((value) => {
        setWithdrawalForm(prev => ({ ...prev, employeeName: value, employeeId: '' }));

        if (value.length >= 2) {
            const searchNormalized = normalizeTextForSearch(value);

            const filtered = data.employees.filter(emp => {
                const empNameNorm = normalizeTextForSearch(emp.name);
                return empNameNorm.includes(searchNormalized);
            }).slice(0, 5);

            setEmployeeSuggestions(filtered);
            setShowEmployeeSuggestions(true);
        } else {
            setShowEmployeeSuggestions(false);
            setEmployeeSuggestions([]);
        }
    }, [data.employees]);

    // دالة اختيار موظف من القائمة
    const selectEmployeeSuggestion = useCallback((employee) => {
        setWithdrawalForm(prev => ({
            ...prev,
            employeeName: employee.name,
            employeeId: employee.id
        }));
        setShowEmployeeSuggestions(false);
        setEmployeeSuggestions([]);
    }, []);

    // دالة فتح المودال لتعديل مادة موجودة
    const handleEditItem = (item) => {
        if (withdrawalForm?.id && !canEditWithdrawal) {
            showToast('لا تملك صلاحية تعديل هذا الاستخراج.', 'error');
            return;
        }

        if (!withdrawalForm?.id && !canAddWithdrawal) {
            showToast('لا تملك صلاحية تعديل مواد الاستخراج.', 'error');
            return;
        }

        setItemForm({
            name: item.name,
            barcode: item.barcode || '',
            count: item.count != null ? String(item.count) : '1',
            category: item.category || ''
        });
        setEditingItemId(item.id);
        setIsAddItemModalOpen(true);
    };

    const handleAddItemToWithdrawal = (e) => {
        e.preventDefault();

        if (withdrawalForm.id && !canEditWithdrawal) {
            showToast('لا تملك صلاحية تعديل هذا الاستخراج.', 'error');
            return;
        }

        if (!withdrawalForm.id && !canAddWithdrawal) {
            showToast('لا تملك صلاحية إضافة استخراج مخزني.', 'error');
            return;
        }

        const parsedCount = parseInt(itemForm.count, 10);

        if (!itemForm.name || Number.isNaN(parsedCount) || parsedCount <= 0) {
            showToast('الرجاء إدخال اسم مادة صحيح وتحديد كمية أكبر من صفر.', 'error');
            return;
        }

        const normalizedName = normalizeTextForSearch(itemForm.name);
        const sanitizedBarcode = convertArabicToEnglish(itemForm.barcode || '').trim();
        const inventoryItem = data.inventory.find(i => {
            const matchesName = normalizeTextForSearch(i.name) === normalizedName;
            const matchesBarcode = sanitizedBarcode && i.barcode && convertArabicToEnglish(i.barcode).trim() === sanitizedBarcode;
            return matchesName || matchesBarcode;
        });

        if (!inventoryItem) {
            showToast('المادة غير موجودة في المخزون أو نفدت بالكامل.', 'error');
            return;
        }

        const existingEditedItem = editingItemId ? withdrawalForm.items.find(i => i.id === editingItemId) : null;
        const otherItemsWithSameName = withdrawalForm.items.filter(i => i.name === inventoryItem.name && i.id !== editingItemId);
        const otherItemsCount = otherItemsWithSameName.reduce((sum, item) => sum + item.count, 0);
        const availableForCurrentRow = inventoryItem.count + (existingEditedItem ? existingEditedItem.count : 0);

        if (parsedCount + otherItemsCount > availableForCurrentRow) {
            const remaining = Math.max(availableForCurrentRow - otherItemsCount, 0);
            showToast(`الكمية المتوفرة في المخزون: ${remaining}. لا يمكن استخراج ${parsedCount}.`, 'error');
            return;
        }

        const itemPayload = {
            id: editingItemId || crypto.randomUUID(),
            name: inventoryItem.name,
            barcode: inventoryItem.barcode ? convertArabicToEnglish(inventoryItem.barcode).trim() : sanitizedBarcode,
            category: inventoryItem.category || existingEditedItem?.category || '',
            count: parsedCount
        };

        if (editingItemId) {
            setWithdrawalForm(prev => ({
                ...prev,
                items: prev.items.map(item => item.id === editingItemId ? itemPayload : item)
            }));

            showToast(`تم تعديل المادة "${itemPayload.name}" بنجاح.`, 'success');
        } else {
            setWithdrawalForm(prev => ({
                ...prev,
                items: [...prev.items, itemPayload]
            }));

            showToast(`تمت إضافة المادة "${itemPayload.name}" بنجاح.`, 'success');
        }

        setShowItemSuggestions(false);
        setItemSuggestions([]);
        setItemForm(getDefaultItemForm());
        setEditingItemId(null);
        setIsAddItemModalOpen(false);
    };

    const handleRemoveItemFromWithdrawal = (id) => {
        if (withdrawalForm.id && !canEditWithdrawal) {
            showToast('لا تملك صلاحية تعديل هذا الاستخراج.', 'error');
            return;
        }

        if (!withdrawalForm.id && !canAddWithdrawal) {
            showToast('لا تملك صلاحية تعديل العناصر في استخراج جديد.', 'error');
            return;
        }

        setWithdrawalForm(prev => ({
            ...prev,
            items: prev.items.filter(item => item.id !== id)
        }));
        showToast('تم حذف المادة بنجاح.', 'warning');
    };

    // إتمام الاستخراج (خصم من المخزون)
    const handleCompleteWithdrawal = (e) => {
        e.preventDefault();

        if (withdrawalForm.id && !canEditWithdrawal) {
            showToast('لا تملك صلاحية تعديل هذا الاستخراج.', 'error');
            return;
        }

        if (!withdrawalForm.id && !canAddWithdrawal) {
            showToast('لا تملك صلاحية إضافة استخراج مخزني.', 'error');
            return;
        }

        if (withdrawalForm.items.length === 0) {
            showToast('يجب إضافة مواد إلى الاستخراج أولاً.', 'error');
            return;
        }
        if (!withdrawalForm.employeeName || !withdrawalForm.employeeName.trim()) {
            showToast('الرجاء إدخال اسم الموظف المستلم.', 'error');
            return;
        }

        let matchedEmployee = null;
        if (withdrawalForm.employeeId) {
            matchedEmployee = data.employees.find(emp => emp.id === withdrawalForm.employeeId);
        }
        if (!matchedEmployee) {
            const normalizedEmployeeName = normalizeTextForSearch(withdrawalForm.employeeName);
            matchedEmployee = data.employees.find(emp => normalizeTextForSearch(emp.name) === normalizedEmployeeName);
        }

        if (!matchedEmployee) {
            showToast('الرجاء اختيار موظف موجود في قائمة الموظفين.', 'error');
            return;
        }

        // **إذا كان تعديل، نعيد المواد القديمة للمخزون أولاً**
        let updatedInventory = [...data.inventory];
        
        if (withdrawalForm.id) {
            const oldWithdrawal = data.inventoryWithdrawals.find(w => w.id === withdrawalForm.id);
            if (oldWithdrawal) {
                // إعادة المواد القديمة للمخزون
                oldWithdrawal.items.forEach(item => {
                    const inventoryItemIndex = updatedInventory.findIndex(i => i.name === item.name);
                    if (inventoryItemIndex !== -1) {
                        updatedInventory[inventoryItemIndex] = {
                            ...updatedInventory[inventoryItemIndex],
                            count: updatedInventory[inventoryItemIndex].count + item.count,
                        };
                    }
                });
            }
        }
        
        // التحقق من توفر جميع المواد في المخزون (بعد إعادة القديمة)
        for (const item of withdrawalForm.items) {
            const inventoryItem = updatedInventory.find(i => i.name === item.name);
            if (!inventoryItem || inventoryItem.count < item.count) {
                showToast(`الكمية المتوفرة من "${item.name}" غير كافية في المخزون.`, 'error');
                return;
            }
        }

        // خصم المواد الجديدة من المخزون
        withdrawalForm.items.forEach(item => {
            const inventoryItemIndex = updatedInventory.findIndex(i => i.name === item.name);
            if (inventoryItemIndex !== -1) {
                updatedInventory[inventoryItemIndex] = {
                    ...updatedInventory[inventoryItemIndex],
                    count: updatedInventory[inventoryItemIndex].count - item.count,
                };
            }
        });

        const withdrawalToSave = {
            ...withdrawalForm,
            id: withdrawalForm.id || crypto.randomUUID(),
            date: getDefaultDateTime(),
            employeeName: matchedEmployee.name,
            employeeId: matchedEmployee.id,
        };

        // **تحديث شامل لكلا المجموعتين في عملية واحدة**
        const newData = { ...data };
        
        // تحديث الاستخراجات
        if (!withdrawalForm.id) {
            newData.inventoryWithdrawals = [...(newData.inventoryWithdrawals || []), withdrawalToSave];
        } else {
            const index = newData.inventoryWithdrawals.findIndex(w => w.id === withdrawalForm.id);
            if (index !== -1) {
                const updatedWithdrawals = [...newData.inventoryWithdrawals];
                updatedWithdrawals[index] = withdrawalToSave;
                newData.inventoryWithdrawals = updatedWithdrawals;
            }
        }
        
        // تحديث المخزون
        newData.inventory = updatedInventory;
        
        // حفظ كل البيانات مرة واحدة
        handleDataAction('___FULL_DATA_UPDATE___', newData);
        
        setWithdrawalForm(getDefaultWithdrawalForm());
        setIsNewWithdrawalModalOpen(false);
        showToast(`تم إتمام الاستخراج #${withdrawalToSave.withdrawalNumber} وخصم المواد من المخزون بنجاح.`, 'success');
    };
    
    // فتح نموذج التفاصيل
    const openDetailsModal = (withdrawal) => {
        setCurrentWithdrawal(withdrawal);
        setIsDetailsModalOpen(true);
    };
    
    // فتح نموذج التعديل
    const openEditModal = (withdrawal) => {
        if (!canEditWithdrawal) {
            showToast('لا تملك صلاحية تعديل الاستخراج.', 'error');
            return;
        }

        const matchedEmployee = withdrawal.employeeId
            ? data.employees.find(emp => emp.id === withdrawal.employeeId)
            : data.employees.find(emp => normalizeTextForSearch(emp.name) === normalizeTextForSearch(withdrawal.employeeName));

        setWithdrawalForm({
            ...withdrawal,
            employeeId: matchedEmployee?.id || withdrawal.employeeId || '',
            employeeName: matchedEmployee?.name || withdrawal.employeeName || ''
        });
        setIsNewWithdrawalModalOpen(true);
    };
    
    // حذف استخراج (إعادة المواد للمخزون)
    const handleDeleteWithdrawal = (withdrawal) => {
        if (!canDeleteWithdrawal) {
            showToast('لا تملك صلاحية حذف هذا الاستخراج.', 'error');
            return;
        }

        if (!confirm(`هل أنت متأكد من حذف الاستخراج #${withdrawal.withdrawalNumber}؟`)) {
            return;
        }

        let updatedInventory = [...data.inventory];
        
        // إعادة المواد للمخزون
        withdrawal.items.forEach(item => {
            const inventoryItemIndex = updatedInventory.findIndex(i => i.name === item.name);
            if (inventoryItemIndex !== -1) {
                updatedInventory[inventoryItemIndex] = {
                    ...updatedInventory[inventoryItemIndex],
                    count: updatedInventory[inventoryItemIndex].count + item.count,
                };
            }
        });
        
        // **تحديث شامل لكلا المجموعتين في عملية واحدة**
        const newData = { ...data };
        newData.inventoryWithdrawals = newData.inventoryWithdrawals.filter(w => w.id !== withdrawal.id);
        newData.inventory = updatedInventory;
        
        // حفظ كل البيانات مرة واحدة
        handleDataAction('___FULL_DATA_UPDATE___', newData);
        
        showToast(`تم حذف الاستخراج #${withdrawal.withdrawalNumber} وإعادة المواد للمخزون.`, 'success');
    };
    
    // فلترة الاستخراجات - القراءة مباشرة من data
    const allWithdrawals = data.inventoryWithdrawals || [];
    let filteredWithdrawals = [...allWithdrawals].sort((a, b) => new Date(b.date) - new Date(a.date));
    
    if (globalSearch) {
        const searchLower = normalizeTextForSearch(globalSearch);
        
        filteredWithdrawals = filteredWithdrawals.filter(w => {
            const matchesNum = w.withdrawalNumber && normalizeTextForSearch(w.withdrawalNumber).includes(searchLower);
            const matchesEmp = w.employeeName && normalizeTextForSearch(w.employeeName).includes(searchLower);
            const matchesItem = w.items.some(item => normalizeTextForSearch(item.name).includes(searchLower));
            
            return matchesNum || matchesEmp || matchesItem;
        });
    }

    const {
        paginatedItems: paginatedWithdrawals,
        totalItems: totalWithdrawalItems,
        pageSize: withdrawalPageSize,
        currentPage: withdrawalCurrentPage,
        totalPages: withdrawalTotalPages,
        changePageSize: changeWithdrawalPageSize,
        goToPage: goToWithdrawalPage,
    } = usePagination(filteredWithdrawals);

    return (
        <div className="p-6 space-y-6 bg-white dark:bg-gray-800 rounded-3xl shadow-2xl">
            <h2 className="text-4xl font-extrabold text-gray-800 dark:text-gray-200 border-b-2 border-green-500 pb-3 flex items-center">
                <LogOut className="w-7 h-7 ml-3 text-green-600" />
                {t('inventoryWithdrawal')}
            </h2>

            {/* البحث */}
            <div className="relative">
                <input
                    type="text"
                    value={globalSearch}
                    onChange={(e) => setGlobalSearch(e.target.value)}
                    placeholder="البحث برقم الاستخراج، اسم الموظف، أو المادة..."
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-200 rounded-xl pr-10 focus:ring-green-500 focus:border-green-500"
                    data-testid="input-search-withdrawals"
                />
                <Search className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <button
                    onClick={() => {
                        if (!canAddWithdrawal) {
                            showToast('لا تملك صلاحية إضافة استخراج مخزني.', 'error');
                            return;
                        }
                        setWithdrawalForm(getDefaultWithdrawalForm());
                        setIsNewWithdrawalModalOpen(true);
                    }}
                    data-testid="button-add-withdrawal"
                    disabled={!canAddWithdrawal}
                    className={`flex items-center px-6 py-3 rounded-xl shadow-lg transition duration-200 bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600 ${!canAddWithdrawal ? 'opacity-60 cursor-not-allowed hover:from-green-500 hover:to-teal-500' : ''}`}
                >
                    <Plus className="w-5 h-5 ml-2" />
                    {t('addWithdrawal')}
                </button>

                <div className="flex flex-wrap gap-2 space-x-reverse">
                    <button onClick={() => window.print()} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg transition duration-200">
                        <Printer className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={() => {
                        const csvContent = [
                            ['رقم الاستخراج', 'التاريخ', 'الموظف', 'عدد المواد', 'الملاحظات'],
                            ...filteredWithdrawals.map(w => [
                                w.withdrawalNumber,
                                formatDateTimeDDMMYYYY(w.date),
                                w.employeeName,
                                w.items.reduce((sum, item) => sum + item.count, 0),
                                w.notes || ''
                            ])
                        ].map(row => row.join(',')).join('\n');
                        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.href = URL.createObjectURL(blob);
                        link.download = `الاستخراجات_المخزنية_${new Date().toISOString().split('T')[0]}.csv`;
                        link.click();
                    }} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg transition duration-200">
                        <Download className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <button onClick={handleRefresh} className="flex items-center justify-center p-2 md:p-3 rounded-full bg-gray-300 hover:bg-gray-400 text-gray-800 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 shadow-lg transition duration-200">
                        <RotateCcw className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                </div>
            </div>

            {/* جدول الاستخراجات */}
            <div className="bg-white dark:bg-gray-700 p-6 rounded-xl shadow-lg overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 dark:bg-gray-600">
                        <tr>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">رقم الاستخراج</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">التاريخ</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">الموظف المستلم</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">عدد المواد</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                        {filteredWithdrawals.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">{t('noWithdrawals')}</td></tr>
                        ) : (
                            paginatedWithdrawals.map(withdrawal => (
                                <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">{highlightText(withdrawal.withdrawalNumber, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDateTimeDDMMYYYY(withdrawal.date)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{highlightText(withdrawal.employeeName, globalSearch)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">{withdrawal.items.reduce((sum, item) => sum + item.count, 0)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2 space-x-reverse">
                                        <button onClick={() => openDetailsModal(withdrawal)} className="text-blue-600 hover:text-blue-900" data-testid={`button-view-withdrawal-${withdrawal.id}`}>
                                            <Eye className="w-5 h-5" />
                                        </button>
                                        {canEditWithdrawal && (
                                            <button onClick={() => openEditModal(withdrawal)} className="text-yellow-600 hover:text-yellow-900" data-testid={`button-edit-withdrawal-${withdrawal.id}`}>
                                                <Edit className="w-5 h-5" />
                                            </button>
                                        )}
                                        {canDeleteWithdrawal && (
                                            <button onClick={() => handleDeleteWithdrawal(withdrawal)} className="text-red-600 hover:text-red-900" data-testid={`button-delete-withdrawal-${withdrawal.id}`}>
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <PaginationControls
                pageSize={withdrawalPageSize}
                onPageSizeChange={changeWithdrawalPageSize}
                currentPage={withdrawalCurrentPage}
                totalPages={withdrawalTotalPages}
                onPageChange={goToWithdrawalPage}
                totalItems={totalWithdrawalItems}
            />

            {/* مودال إضافة/تعديل استخراج */}
            {isNewWithdrawalModalOpen && (
                <Modal title={withdrawalForm.id ? t('editWithdrawal') : t('addWithdrawal')} onClose={() => setIsNewWithdrawalModalOpen(false)} size="xl">
                    <form onSubmit={handleCompleteWithdrawal} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('withdrawalNumber')}</label>
                                <input
                                    type="text"
                                    value={withdrawalForm.withdrawalNumber}
                                    onChange={(e) => setWithdrawalForm(prev => ({ ...prev, withdrawalNumber: e.target.value }))}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                    data-testid="input-withdrawal-number"
                                />
                            </div>
                            <div className="relative">
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('receivingEmployee')}</label>
                                <input
                                    type="text"
                                    value={withdrawalForm.employeeName}
                                    onChange={(e) => handleEmployeeNameChange(e.target.value)}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                    required
                                    data-testid="input-employee-name"
                                />
                                {showEmployeeSuggestions && employeeSuggestions.length > 0 && (
                                    <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                                        {employeeSuggestions.map(emp => (
                                            <li
                                                key={emp.id}
                                                onClick={() => selectEmployeeSuggestion(emp)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                                            >
                                                {emp.name} - {emp.jobTitle}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">ملاحظات</label>
                            <textarea
                                value={withdrawalForm.notes}
                                onChange={(e) => setWithdrawalForm(prev => ({ ...prev, notes: e.target.value }))}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                rows="2"
                                data-testid="input-notes"
                            />
                        </div>

                        {/* قسم المواد */}
                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">المواد</h3>
                                <button
                                    type="button"
                                    onClick={() => {
                                        if (!canModifyCurrentWithdrawal) {
                                            showToast('لا تملك صلاحية تعديل مواد الاستخراج.', 'error');
                                            return;
                                        }
                                        setItemForm(getDefaultItemForm());
                                        setEditingItemId(null);
                                        setIsAddItemModalOpen(true);
                                    }}
                                    disabled={!canModifyCurrentWithdrawal}
                                    className={`flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 ${!canModifyCurrentWithdrawal ? 'opacity-60 cursor-not-allowed hover:bg-blue-500' : ''}`}
                                    data-testid="button-add-item-to-withdrawal"
                                >
                                    <Plus className="w-4 h-4 ml-1" />
                                    إضافة مادة
                                </button>
                            </div>
                            
                            {withdrawalForm.items.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">لم يتم إضافة مواد بعد</p>
                            ) : (
                                <div className="space-y-2">
                                    {withdrawalForm.items.map(item => (
                                        <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                            <div className="flex-1">
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">{item.name}</span>
                                                <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">الكمية: {item.count}</span>
                                            </div>
                                            {canModifyCurrentWithdrawal && (
                                                <div className="flex gap-2">
                                                    <button type="button" onClick={() => handleEditItem(item)} className="text-yellow-600 hover:text-yellow-900">
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button type="button" onClick={() => handleRemoveItemFromWithdrawal(item.id)} className="text-red-600 hover:text-red-900">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={withdrawalForm.id ? !canEditWithdrawal : !canAddWithdrawal}
                            className={`w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-bold shadow-lg ${withdrawalForm.id ? (canEditWithdrawal ? 'hover:from-green-600 hover:to-teal-600' : 'opacity-60 cursor-not-allowed') : (canAddWithdrawal ? 'hover:from-green-600 hover:to-teal-600' : 'opacity-60 cursor-not-allowed')}`}
                            data-testid="button-complete-withdrawal"
                        >
                            <Save className="w-5 h-5 inline ml-2" />
                            {t('completeWithdrawal')}
                        </button>
                    </form>
                </Modal>
            )}

            {/* مودال إضافة مادة */}
            {isAddItemModalOpen && (
                <Modal title={editingItemId ? "تعديل مادة" : "إضافة مادة"} onClose={() => { setIsAddItemModalOpen(false); setEditingItemId(null); }} size="md">
                    <form onSubmit={handleAddItemToWithdrawal} className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('itemName')}</label>
                            <input
                                type="text"
                                value={itemForm.name}
                                onChange={(e) => handleItemNameChange(e.target.value)}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                required
                                data-testid="input-item-name"
                            />
                            {showItemSuggestions && itemSuggestions.length > 0 && (
                                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 max-h-40 overflow-y-auto shadow-lg">
                                    {itemSuggestions.map(item => (
                                        <li
                                            key={item.id}
                                            onClick={() => selectItemSuggestion(item)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer text-sm"
                                        >
                                            {item.name} - متوفر: {item.count}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                        
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('barcode')}</label>
                            <input
                                type="text"
                                value={itemForm.barcode}
                                onChange={(e) => handleBarcodeChange(e.target.value)}
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                required
                                data-testid="input-item-barcode"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">{t('quantity')}</label>
                            <input
                                type="number"
                                value={itemForm.count}
                                onChange={(e) => setItemForm(prev => ({ ...prev, count: e.target.value }))}
                                min="1"
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                                required
                                data-testid="input-item-count"
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 font-semibold"
                            data-testid="button-save-item"
                        >
                            <Save className="w-4 h-4 inline ml-2" />
                            {editingItemId ? 'تحديث المادة' : 'إضافة المادة'}
                        </button>
                    </form>
                </Modal>
            )}

            {/* مودال التفاصيل */}
            {isDetailsModalOpen && currentWithdrawal && (
                <Modal title={t('withdrawalDetails')} onClose={() => setIsDetailsModalOpen(false)} size="lg">
                    <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">رقم الاستخراج:</span>
                                <span className="mr-2 text-gray-900 dark:text-gray-100">{currentWithdrawal.withdrawalNumber}</span>
                            </div>
                            <div>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">التاريخ:</span>
                                <span className="mr-2 text-gray-900 dark:text-gray-100">{formatDateTimeDDMMYYYY(currentWithdrawal.date)}</span>
                            </div>
                            <div className="col-span-2">
                                <span className="font-semibold text-gray-700 dark:text-gray-300">الموظف المستلم:</span>
                                <span className="mr-2 text-gray-900 dark:text-gray-100">{currentWithdrawal.employeeName}</span>
                            </div>
                            {currentWithdrawal.notes && (
                                <div className="col-span-2">
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">ملاحظات:</span>
                                    <p className="text-gray-900 dark:text-gray-100 mt-1">{currentWithdrawal.notes}</p>
                                </div>
                            )}
                        </div>
                        
                        <h5 className="text-lg font-bold text-gray-800 dark:text-gray-200 border-b pb-2 pt-4">المواد المستخرجة:</h5>
                        <div className="overflow-x-auto shadow-md rounded-xl">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-100 dark:bg-green-900">
                                    <tr>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">المادة</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">الباركود</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">الكمية</th>
                                        <th className="px-4 py-3 text-right text-sm font-bold text-gray-700 dark:text-gray-300">الفئة</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                                    {currentWithdrawal.items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-medium">{item.name}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{item.barcode || '-'}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm font-bold text-green-600">{item.count}</td>
                                            <td className="px-4 py-2 whitespace-nowrap text-sm">{item.category}</td>
                                        </tr>
                                    ))}
                                    <tr className="bg-green-50 dark:bg-green-900 font-extrabold">
                                        <td colSpan="2" className="px-4 py-3 text-right">إجمالي الكمية:</td>
                                        <td className="px-4 py-3 text-green-800 dark:text-green-200">
                                            {currentWithdrawal.items.reduce((sum, item) => sum + item.count, 0)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};





/**
 * 3.9. WelcomeMessage (رسالة الترحيب المؤقتة)
 */
const WelcomeMessage = ({ user, companyName }) => {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4" dir="rtl">
            <div className="w-full max-w-sm md:max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-10 space-y-6 text-center animate-fade-in">
                <div className="flex justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                        <CheckCircle className="w-8 h-8 md:w-10 md:h-10 text-white" />
                    </div>
                </div>
                
                <div className="space-y-3">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white">
                        مرحباً بك! 👋
                    </h2>
                    <p className="text-base md:text-lg text-gray-600 dark:text-gray-300 font-semibold">
                        {user.username}
                    </p>
                    <p className="text-sm md:text-base text-gray-500 dark:text-gray-400">
                        تم تسجيل الدخول بنجاح إلى
                    </p>
                    <p className="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">
                        {companyName}
                    </p>
                </div>

                <div className="pt-2">
                    <div className="inline-flex items-center space-x-2 space-x-reverse text-sm text-gray-500 dark:text-gray-400">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        <span>جارٍ تحميل النظام...</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

/**
 * 3.10. LoginPage (صفحة تسجيل الدخول)
 */
const LoginPage = ({ users, onLogin, showToast, systemExpiryDate, companyName, masterKey }) => {
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [welcomeUser, setWelcomeUser] = useState(null);
    const [loginError, setLoginError] = useState('');

    const expiryInfo = useMemo(() => {
        if (!systemExpiryDate) return null;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const expiryDate = new Date(systemExpiryDate);
        expiryDate.setHours(0, 0, 0, 0);

        const diffMs = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return {
                type: 'expired',
                message: '⚠️ انتهت صلاحية النظام. يرجى التواصل مع الإدارة لتجديد الاشتراك.',
            };
        }

        if (diffDays <= 3) {
            const dayLabel = diffDays === 0
                ? 'اليوم هو آخر يوم للاشتراك.'
                : `متبقي ${diffDays} ${diffDays === 1 ? 'يوم' : 'أيام'} على انتهاء صلاحية النظام.`;

            return {
                type: 'warning',
                message: `تنبيه: ${dayLabel}`,
            };
        }

        return null;
    }, [systemExpiryDate]);

    const handleSubmit = (e) => {
        e.preventDefault();

        setLoginError('');

        let user = null;

        // التحقق من الماستر كي أولاً
        if (password === masterKey) {
            // إنشاء مستخدم افتراضي بصلاحيات أدمن كاملة
            user = {
                id: 'master_admin',
                username: '🔑 الأدمن الرئيسي',
                email: 'master@system.com',
                password: masterKey,
                role: USER_ROLES.ADMIN,
                permissions: ROLE_PERMISSIONS[USER_ROLES.ADMIN],
                customPermissions: {},
                darkMode: false,
                sidebarCollapsed: false,
                isMasterKeyLogin: true // علامة للتعرف على تسجيل الدخول بالماستر كي
            };
        } else {
            // البحث عن المستخدم بكلمة المرور
            user = users.find(u => u.password === password);
        }
        
        // التحقق من وجود كلمة المرور
        if (!user) {
            setLoginError('كلمة المرور غير صحيحة');
            return;
        }

        // التحقق من صلاحية النظام
        // الأدمن والماستر كي يمكنهم الدخول دائماً
        if (user.role !== USER_ROLES.ADMIN && !user.isMasterKeyLogin && expiryInfo?.type === 'expired') {
            setLoginError('⚠️ انتهت صلاحية النظام. يرجى التواصل مع إدارة النظام لتجديد الاشتراك.');
            setPassword('');
            return;
        }

        // عرض رسالة الترحيب المؤقتة والدخول تلقائياً بعد ثانيتين
        setWelcomeUser(user);
        setTimeout(() => {
            onLogin(user);
            setWelcomeUser(null);
        }, 2000);

        setPassword('');
    };
    
    // عرض رسالة الترحيب المؤقتة
    if (welcomeUser) {
        return (
            <WelcomeMessage
                user={welcomeUser}
                companyName={companyName}
            />
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-800 to-indigo-900 dark:from-gray-900 dark:via-gray-800 dark:to-black p-4" dir="rtl">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-6 md:p-8 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 dark:text-white">{companyName || 'نظام المحاسبة العراقي'}</h1>
                    <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">v 0.4</p>
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">قم بتسجيل الدخول للمتابعة</p>
                </div>

                {expiryInfo && (
                    <div
                        className={`p-3 rounded-xl border text-sm font-semibold text-right ${
                            expiryInfo.type === 'expired'
                                ? 'bg-red-50 border-red-300 text-red-700 dark:bg-red-900/30 dark:border-red-700 dark:text-red-200'
                                : 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-200'
                        }`}
                    >
                        {expiryInfo.message}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                    <div className="space-y-2">
                        <label className="text-xs md:text-sm font-medium text-gray-700 dark:text-gray-300">كلمة المرور</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => {
                                    if (loginError) {
                                        setLoginError('');
                                    }
                                    setPassword(e.target.value);
                                }}
                                required
                                placeholder="أدخل كلمة المرور"
                                className="w-full pr-4 pl-10 md:pl-12 py-2.5 md:py-3 text-sm md:text-base border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                                data-testid="input-password"
                                autoFocus
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="flex items-center justify-center absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4 md:w-5 md:h-5" /> : <Eye className="w-4 h-4 md:w-5 md:h-5" />}
                            </button>
                        </div>
                    </div>

                    {loginError && (
                        <p className="text-xs md:text-sm font-semibold text-red-600 dark:text-red-400 text-right" data-testid="login-error-message">
                            {loginError}
                        </p>
                    )}

                    <button
                        type="submit"
                        className="w-full py-2.5 md:py-3 text-sm md:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition duration-200 transform hover:scale-105"
                        data-testid="button-login"
                    >
                        تسجيل الدخول
                    </button>
                </form>
            </div>
        </div>
    );
};


// =================================================================
// 4. المكون الرئيسي للتطبيق (APP COMPONENT)
// =================================================================

const AccountingApp = () => {
    // 1. Toaster Handler (Moved to the top to fix ReferenceError)
    // Language Hook
    const { language, setLanguage, t, dir } = useLanguage();

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
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const [currentUser, setCurrentUser] = useState(null); // المستخدم المسجل حالياً
    const [pendingInventoryAction, setPendingInventoryAction] = useState(null);
    const settingsLeaveGuardRef = useRef(null);
    const scannerCaptureRef = useRef(null);
    const [scannerConfig, setScannerConfig] = useState({
        isOpen: false,
        title: 'مسح المستند عبر السكنر',
        defaultFileName: 'مرفق ممسوح',
    });
    
    
    
    // تحميل تفضيلات Dark Mode من المستخدم المسجل وتوجيه للصفحة الصحيحة
    useEffect(() => {
        if (currentUser) {
            setIsDarkMode(currentUser.darkMode || false);
            setIsSidebarCollapsed(currentUser.sidebarCollapsed || false);
        }
    }, [currentUser]);

    // دالة تسجيل الدخول
    const handleLogin = (user) => {
        // دمج صلاحيات الدور مع الصلاحيات المخصصة
        const mergedPermissions = { ...ROLE_PERMISSIONS[user.role] };
        
        if (user.customPermissions) {
            Object.keys(user.customPermissions).forEach(module => {
                if (!mergedPermissions[module]) {
                    mergedPermissions[module] = {};
                }
                mergedPermissions[module] = {
                    ...mergedPermissions[module],
                    ...user.customPermissions[module]
                };
            });
        }
        
        setCurrentUser({
            ...user,
            permissions: mergedPermissions
        });
        
        // حفظ وقت تسجيل الدخول في localStorage
        const loginTime = new Date().toISOString();
        localStorage.setItem('lastLoginTime', loginTime);
        localStorage.setItem('lastLoginDate', new Date().toDateString());
    };

    // دالة تسجيل الخروج
    const handleLogout = () => {
        setCurrentUser(null);
        setCurrentPage('dashboard');
        setIsSidebarOpen(false);
        setPendingInventoryAction(null);
        // مسح بيانات الجلسة
        localStorage.removeItem('lastLoginTime');
        localStorage.removeItem('lastLoginDate');
    };
    
    // **نظام تسجيل الخروج التلقائي عند الساعة 5 صباحاً**
    useEffect(() => {
        if (!currentUser) return;
        
        const checkAutoLogout = () => {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // التحقق من وقت تسجيل الدخول
            const lastLoginDate = localStorage.getItem('lastLoginDate');
            const today = new Date().toDateString();
            
            // إذا كانت الساعة 5 صباحاً أو أكثر وآخر تسجيل دخول كان في يوم سابق
            if (currentHour >= 5 && lastLoginDate && lastLoginDate !== today) {
                showToast('تم تسجيل الخروج تلقائياً - بداية يوم عمل جديد. يرجى تسجيل الدخول مرة أخرى.', 'info');
                handleLogout();
                return;
            }
            
            // إذا وصلت الساعة 5 صباحاً تماماً في نفس اليوم
            if (currentHour === 5 && currentMinute === 0 && lastLoginDate === today) {
                showToast('تم تسجيل الخروج تلقائياً - بداية يوم عمل جديد. يرجى تسجيل الدخول مرة أخرى.', 'info');
                handleLogout();
            }
        };
        
        // فحص فوري عند التحميل
        checkAutoLogout();
        
        // فحص كل دقيقة
        const interval = setInterval(checkAutoLogout, 60000); // 60 ثانية
        
        return () => clearInterval(interval);
    }, [currentUser, handleLogout, showToast]);
    
    // **فحص الجلسة عند العودة للنافذة أو إعادة التركيز**
    useEffect(() => {
        if (!currentUser) return;
        
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                const lastLoginDate = localStorage.getItem('lastLoginDate');
                const today = new Date().toDateString();
                const now = new Date();
                const currentHour = now.getHours();
                
                // إذا كان آخر تسجيل دخول في يوم سابق والساعة بعد 5 صباحاً
                if (lastLoginDate && lastLoginDate !== today && currentHour >= 5) {
                    showToast('انتهت جلستك - يرجى تسجيل الدخول مرة أخرى.', 'warning');
                    handleLogout();
                }
            }
        };
        
        const handleBeforeUnload = () => {
            // يمكن إضافة منطق إضافي هنا إذا لزم الأمر
        };
        
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('beforeunload', handleBeforeUnload);
        
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);
        };
    }, [currentUser, handleLogout, showToast]);
    
    // تحميل تفضيلات Dark Mode و Sidebar Collapse من المستخدم
    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
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
    
    // Toggle Language
    const toggleLanguage = () => {
        const newLang = language === 'ar' ? 'en' : 'ar';
        setLanguage(newLang);
    };

    const toggleSidebarCollapse = () => {
        const newCollapse = !isSidebarCollapsed;
        setIsSidebarCollapsed(newCollapse);
        const updatedUsers = [...data.settings.users];
        updatedUsers[0] = { ...updatedUsers[0], sidebarCollapsed: newCollapse };
        handleSettingsUpdate({ ...data.settings, users: updatedUsers });
    };

    const registerSettingsLeaveGuard = useCallback((guard) => {
        settingsLeaveGuardRef.current = guard;
        return () => {
            if (settingsLeaveGuardRef.current === guard) {
                settingsLeaveGuardRef.current = null;
            }
        };
    }, []);

    const ensureSettingsCanLeave = useCallback((targetKey) => {
        if (currentPage === 'settings' && targetKey !== 'settings' && settingsLeaveGuardRef.current) {
            return settingsLeaveGuardRef.current(targetKey);
        }
        return true;
    }, [currentPage]);

    const openScanner = useCallback(({ title, onCapture, defaultFileName } = {}) => {
        scannerCaptureRef.current = typeof onCapture === 'function' ? onCapture : null;
        setScannerConfig({
            isOpen: true,
            title: title || 'مسح المستند عبر السكنر',
            defaultFileName: defaultFileName || 'مرفق ممسوح',
        });
    }, []);

    const closeScanner = useCallback(() => {
        scannerCaptureRef.current = null;
        setScannerConfig(prev => ({ ...prev, isOpen: false }));
    }, []);

    const handleScannerCapture = useCallback((attachment) => {
        if (scannerCaptureRef.current && attachment) {
            scannerCaptureRef.current(attachment);
        }
    }, []);

    const performNavigation = useCallback((key, options = {}) => {
        const { preserveInitialExpenseState = false } = options;
        setCurrentPage(key);
        if (!preserveInitialExpenseState) {
            setInitialExpenseState(null);
        }
        if (pendingInventoryAction) {
            setPendingInventoryAction(null);
        }
        setIsSidebarOpen(false);
    }, [pendingInventoryAction]);

    const navigateWithGuards = useCallback((key, options = {}) => {
        if (!ensureSettingsCanLeave(key)) {
            return false;
        }
        performNavigation(key, options);
        return true;
    }, [ensureSettingsCanLeave, performNavigation]);


    // دالة تحديث الحالة العامة (لحل مشكلة التحديث الفوري)
    const handleRefresh = useCallback(() => {
        setRefreshKey(prev => prev + 1);
        showToast('تم تحديث بيانات الصفحة.', 'info');
    }, [showToast]);

    // 3. CRUD Logic
    const mergeInventoryWithInvoiceItems = (baseInventory, invoiceItems, invoiceMeta) => {
        const updatedInventory = [...(baseInventory || [])];

        const invoiceAttachment = getPrimaryAttachmentDataUrl(normalizeAttachmentList(invoiceMeta.attachments, invoiceMeta.invoiceImageUrl, 'مرفق فاتورة'));

        (invoiceItems || []).forEach(invoiceItem => {
            const countToAdd = parseFloat(convertArabicToEnglish(invoiceItem.count || '0')) || 0;
            const priceValue = parseFloat(convertArabicToEnglish(invoiceItem.price || '0')) || 0;
            const existingIndex = updatedInventory.findIndex(invItem => invItem.name === invoiceItem.name);

            const purchaseRecord = {
                date: invoiceMeta.date,
                price: priceValue,
                count: countToAdd,
                vendor: invoiceMeta.vendor
            };

            if (existingIndex !== -1) {
                const existingItem = updatedInventory[existingIndex];
                updatedInventory[existingIndex] = {
                    ...existingItem,
                    count: (parseFloat(existingItem.count || 0) || 0) + countToAdd,
                    price: priceValue,
                    purchaseHistory: [purchaseRecord, ...(existingItem.purchaseHistory || [])],
                };
            } else {
                updatedInventory.push({
                    id: crypto.randomUUID(),
                    name: invoiceItem.name,
                    barcode: invoiceItem.barcode || generateBarcode(),
                    price: priceValue,
                    count: countToAdd,
                    category: invoiceItem.category,
                    purchaseHistory: [purchaseRecord],
                    invoiceImageUrl: invoiceAttachment,
                });
            }
        });

        return updatedInventory;
    };

    const finalizeInventoryEntryApproval = (draftData, action) => {
        if (!action) return draftData;

        const invoiceIndex = draftData.pendingInvoices.findIndex(inv => inv.id === action.invoiceId);
        if (invoiceIndex === -1) {
            return draftData;
        }

        const invoice = draftData.pendingInvoices[invoiceIndex];
        const updatedInvoice = {
            ...invoice,
            status: action.nextStatus || invoice.status,
            inventoryApplied: action.applyInventory ? true : invoice.inventoryApplied,
            linkedCollection: action.targetCollection,
            linkedRecordId: action.recordId,
            dispatchedAt: getDefaultDateTime(),
        };

        const updatedInvoices = [...draftData.pendingInvoices];
        updatedInvoices[invoiceIndex] = updatedInvoice;
        draftData.pendingInvoices = updatedInvoices;

        if (action.applyInventory) {
            draftData.inventory = mergeInventoryWithInvoiceItems(draftData.inventory, invoice.items, invoice);
        }

        return draftData;
    };

    const parseAmountValue = (value) => {
        const normalized = convertArabicToEnglish((value ?? '').toString());
        const cleaned = normalized.replace(/[^0-9.]/g, '');
        const numeric = parseFloat(cleaned);
        return Number.isFinite(numeric) ? numeric : 0;
    };

    const adjustDebtWithLinkedRecord = (draftData, record, actionType, previousRecord, collectionName) => {
        if (!record?.linkedDebtId) {
            return draftData;
        }

        const debtsList = Array.isArray(draftData.debts) ? [...draftData.debts] : [];
        const debtIndex = debtsList.findIndex(debt => debt.id === record.linkedDebtId);
        if (debtIndex === -1) {
            return draftData;
        }

        const debt = debtsList[debtIndex] || {};
        const payments = Array.isArray(debt.payments) ? [...debt.payments] : [];
        const paymentId = record.linkedDebtPaymentId || record.id;
        const baseTotal = parseAmountValue(debt.totalAmount ?? 0);

        if (actionType === 'delete') {
            const filteredPayments = payments.filter(payment => payment.id !== paymentId);
            const totalPaid = filteredPayments.reduce((sum, payment) => sum + parseAmountValue(payment.amount), 0);
            const remaining = Math.max(0, baseTotal - totalPaid);
            const sortedPayments = filteredPayments.slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
            debtsList[debtIndex] = {
                ...debt,
                payments: sortedPayments,
                remainingAmount: remaining,
                status: remaining <= 0 ? 'settled' : 'active',
                lastPaymentDate: sortedPayments[0]?.date || null,
                updatedAt: getDefaultDateTime(),
            };
            draftData.debts = debtsList;
            return draftData;
        }

        const previousAmount = previousRecord?.linkedDebtId === record.linkedDebtId ? parseAmountValue(previousRecord.amount) : 0;
        const existingIndex = payments.findIndex(payment => payment.id === paymentId);
        const totalPaidExcluding = payments.reduce((sum, payment, idx) => {
            if (idx === existingIndex) return sum;
            return sum + parseAmountValue(payment.amount);
        }, 0);

        const amount = parseAmountValue(record.amount ?? previousAmount);
        const remainingAfter = Math.max(0, baseTotal - (totalPaidExcluding + amount));
        const paymentDate = record.date || getDefaultDateTime();

        const updatedPayment = {
            ...(existingIndex !== -1 ? payments[existingIndex] : {}),
            id: paymentId,
            amount,
            date: paymentDate,
            recordCollection: collectionName,
            recordId: record.id,
            description: record.description || '',
            remainingAfter,
        };

        const paymentAttachments = normalizeAttachmentList(record.attachments, record.invoiceImageUrl, 'مرفق');
        if (paymentAttachments.length > 0) {
            updatedPayment.attachments = paymentAttachments;
            updatedPayment.invoiceImageUrl = getPrimaryAttachmentDataUrl(paymentAttachments);
        } else if (record.invoiceImageUrl) {
            updatedPayment.invoiceImageUrl = record.invoiceImageUrl;
        }

        if (existingIndex !== -1) {
            payments[existingIndex] = updatedPayment;
        } else {
            payments.push(updatedPayment);
        }

        const sortedPayments = payments.slice().sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
        const totalPaid = sortedPayments.reduce((sum, payment) => sum + parseAmountValue(payment.amount), 0);
        const remaining = Math.max(0, baseTotal - totalPaid);

        debtsList[debtIndex] = {
            ...debt,
            payments: sortedPayments,
            remainingAmount: remaining,
            status: remaining <= 0 ? 'settled' : 'active',
            lastPaymentDate: sortedPayments[0]?.date || paymentDate,
            updatedAt: getDefaultDateTime(),
        };

        draftData.debts = debtsList;
        return draftData;
    };

    const handleDataAction = (collectionName, item, isNew, overwrite = false, options = {}) => {
        const { bypassPermissions = false, silent = false } = options;
        // **دعم التحديث الشامل للبيانات**
        if (collectionName === '___FULL_DATA_UPDATE___') {
            saveData(item); // item هنا يحتوي على كل البيانات
            setRefreshKey(prev => prev + 1);
            return;
        }

        // فحص صلاحيات الإضافة/التعديل
        const permissionKey = navItems.find(i => i.key === collectionName)?.key;
        const requiredAction = isNew ? 'add' : 'edit';

        if (!bypassPermissions && permissionKey && !currentUser?.permissions[permissionKey]?.[requiredAction]) {
            showToast(`ليس لديك صلاحية ${isNew ? 'إضافة' : 'تعديل'} سجلات في قسم ${navItems.find(i => i.key === collectionName)?.label}.`, 'error');
            return;
        }

        let newData = { ...data };
        let collection = [...(newData[collectionName] || [])];
        let newItemRef = null;

        if (overwrite) {
            newData[collectionName] = item;
        } else if (isNew) {
            // إضافة سجل جديد
            const newItem = {
                ...item,
                id: item.id || crypto.randomUUID(),
                ...(collectionName !== 'inventory' && collectionName !== 'inventoryWithdrawals' && collectionName !== 'debts' ? { invoiceNumber: generateInvoiceNumber() } : {})
            };
            collection.push(newItem);
            newData[collectionName] = collection;
            newItemRef = newItem;

            if (collectionName !== 'inventory') {
                const moduleName = navItems.find(i => i.key === collectionName)?.label || collectionName;
                logActivity("إضافة", moduleName, `${item.description || item.amount || item.name || "سجل جديد"}`);

                if (!silent) {
                    showToast(`تم إضافة السجل بنجاح!`, 'success');
                }
            }

            if (collectionName === 'inventory' && !newItem.purchaseHistory) {
                newItem.purchaseHistory = [];
            }
            setInitialExpenseState(null);

            if (collectionName === 'expenses' || collectionName === 'pendingExpenses') {
                newData = adjustDebtWithLinkedRecord(newData, newItem, 'create', null, collectionName);
            }
        } else {
            // تعديل سجل موجود
            const index = collection.findIndex(i => i.id === item.id);
            if (index !== -1) {
                const previousItem = collection[index];
                collection[index] = item;
                newData[collectionName] = collection;

                // تسجيل النشاط
                const moduleName = navItems.find(i => i.key === collectionName)?.label || collectionName;
                logActivity("تعديل", moduleName, `${item.description || item.amount || item.name || "سجل"}`);

                if (!silent) {
                    showToast(`تم تعديل السجل بنجاح!`, 'success');
                }

                if (collectionName === 'expenses' || collectionName === 'pendingExpenses') {
                    newData = adjustDebtWithLinkedRecord(newData, item, 'update', previousItem, collectionName);
                }
            } else if (collectionName === 'pendingInvoices' && item.status) {
                 const existingIndex = collection.findIndex(i => i.id === item.id);
                 if (existingIndex !== -1) {
                      collection[existingIndex] = item;
                 } else {
                      collection.push(item);
                }
                newData[collectionName] = collection;
            }
        }

        if (pendingInventoryAction && collectionName === pendingInventoryAction.targetCollection) {
            const addedItemId = (isNew ? (newItemRef?.id || item.id) : item.id) || null;
            const matchesPending = addedItemId === pendingInventoryAction.recordId
                || (item.linkedInvoiceId && item.linkedInvoiceId === pendingInventoryAction.invoiceId);

            if (matchesPending) {
                newData = finalizeInventoryEntryApproval(newData, pendingInventoryAction);
                setPendingInventoryAction(null);
            }
        }

        saveData(newData);
        setRefreshKey(prev => prev + 1);
    };

    const handleDelete = (collectionName, id, showMessage = true, bypassPermissions = false) => {
        // **تحديث: فحص صلاحيات الحذف**
        // **حماية: منع حذف سجلات الصرفيات المعلقة غير المعلقة**
        if (collectionName === 'pendingExpenses') {
            const itemToDelete = data.pendingExpenses.find(item => item.id === id);
            if (itemToDelete && itemToDelete.status !== 'pending' && itemToDelete.status) {
                showToast('لا يمكن حذف سجل مصروف أو ملغي. السجلات تبقى للمراجعة فقط.', 'error');
                return;
            }
        }
        
        const permissionKey = navItems.find(i => i.key === collectionName)?.key;
        if (!bypassPermissions && permissionKey && !currentUser?.permissions[permissionKey]?.delete && collectionName !== 'inventoryDispatches') {
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

        if (collectionName === 'pendingInvoices') {
            const invoiceToDelete = data.pendingInvoices.find(item => item.id === id);
            if (invoiceToDelete) {
                if (invoiceToDelete.inventoryApplied) {
                    let updatedInventory = [...(newData.inventory || [])];
                    (invoiceToDelete.items || []).forEach(invItem => {
                        const index = updatedInventory.findIndex(i => i.name === invItem.name);
                        if (index !== -1) {
                            const currentCount = parseFloat(convertArabicToEnglish(updatedInventory[index].count || '0')) || 0;
                            const decrement = parseFloat(convertArabicToEnglish(invItem.count || '0')) || 0;
                            updatedInventory[index] = {
                                ...updatedInventory[index],
                                count: Math.max(currentCount - decrement, 0),
                            };
                        }
                    });
                    newData.inventory = updatedInventory;
                }

                if (invoiceToDelete.linkedCollection && invoiceToDelete.linkedRecordId) {
                    const linkedCollection = invoiceToDelete.linkedCollection;
                    if (newData[linkedCollection]) {
                        newData[linkedCollection] = newData[linkedCollection].filter(record => record.id !== invoiceToDelete.linkedRecordId);
                    }
                }
            }

            if (pendingInventoryAction?.invoiceId === id) {
                setPendingInventoryAction(null);
            }
        }

        newData[collectionName] = newData[collectionName].filter(item => item.id !== id);
        
        // تسجيل النشاط
        const moduleName = navItems.find(i => i.key === collectionName)?.label || collectionName;
        const deletedItem = data[collectionName]?.find(item => item.id === id);
        logActivity("حذف", moduleName, `${deletedItem?.description || deletedItem?.amount || deletedItem?.name || "سجل"}`);

        if ((collectionName === 'expenses' || collectionName === 'pendingExpenses') && deletedItem?.linkedDebtId) {
            newData = adjustDebtWithLinkedRecord(newData, deletedItem, 'delete', null, collectionName);
        }


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
                
                // تحديث صلاحيات المستخدمين الموجودين بدمجها مع BASE_PERMISSIONS
                const updatedUsers = (parsedData.settings?.users || []).map(user => ({
                    ...user,
                    permissions: {
                        ...BASE_PERMISSIONS,
                        ...user.permissions
                    }
                }));
                
                setData(prev => ({
                    ...defaultDataStructure,
                    ...parsedData,
                    settings: {
                        ...defaultSettings,
                        ...(parsedData.settings || {}),
                        users: updatedUsers.length > 0 ? updatedUsers : defaultSettings.users
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
    
    // دالة تسجيل النشاطات
    const logActivity = (action, module, details = "") => {
        const newData = { ...data };
        
        if (!newData.activityLog) {
            newData.activityLog = [];
        }
        
        const logEntry = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            username: currentUser?.username || "المستخدم",
            action,
            module,
            details
        };
        
        newData.activityLog.unshift(logEntry);
        
        if (newData.activityLog.length > 500) {
            newData.activityLog = newData.activityLog.slice(0, 500);
        }
        
        saveData(newData);
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
            date: formatDateDDMMYYYY(emp.dateOfBirth)
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

    }, [data.employees]);


    // 7. Routing and Navigation
    const navItems = [
        { key: 'dashboard', label: 'الرئيسية', icon: Home, component: DashboardComponent },
        { key: 'revenues', label: 'الإيرادات', icon: TrendingUp, component: DataPageComponent, props: { title: 'الإيرادات', type: 'revenue', collectionName: 'revenues', categories: data.settings.revenueCategories, fields: [{ key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'category', label: 'فئة الإيراد', type: 'select', required: true }, { key: 'description', label: 'الوصف/المصدر', type: 'textarea' }], handleRefresh } },
        { key: 'expenses', label: 'الصرفيات', icon: TrendingDown, component: DataPageComponent, props: { title: 'الصرفيات', type: 'expense', collectionName: 'expenses', categories: data.settings.expenseCategories, fields: [{ key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'category', label: 'فئة المصروف', type: 'select', required: true }, { key: 'description', label: 'الوصف المفصل', type: 'textarea', required: true }], handleRefresh, openScanner } },
        { key: 'advances', label: 'السلف', icon: Coins, component: DataPageComponent, props: { title: 'السلف', type: 'advance', collectionName: 'advances', categories: data.settings.advanceCategories, fields: [{ key: 'employeeName', label: 'الموظف المعني', type: 'select', required: true }, { key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'category', label: 'فئة السلفة', type: 'select', required: true }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }], handleRefresh } },
        { key: 'suspended', label: 'المعلقة (قيد التسوية)', icon: RotateCcw, component: DataPageComponent, props: { title: 'المعلقة (قيد التسوية)', type: 'suspended', collectionName: 'suspended', fields: [{ key: 'recipientName', label: 'اسم المستلم', required: true }, { key: 'amount', label: 'المبلغ', currency: true, required: true }, { key: 'notes', label: 'ملاحظات', type: 'textarea' }], handleRefresh } },
        { key: 'debts', label: 'الديون', icon: FileText, component: DebtsPageComponent, props: { setInitialExpenseState, navigateWithGuards, openScanner } },
        { key: 'pendingExpenses', label: 'الصرفيات المعلقة', icon: Clock, component: PendingExpensesComponent, props: { handleRefresh, setCurrentPage, setInitialExpenseState, openScanner } },
        { key: 'employees', label: 'الموظفين', icon: Users, component: EmployeePageComponent, props: { handleRefresh, openScanner } },
        { key: 'payroll', label: 'الرواتب', icon: Calculator, component: PayrollPageComponent, props: { handleRefresh } },
        { key: 'inventoryEntry', label: 'الإدخال المخزني', icon: ClipboardCheck, component: InventoryEntryComponent, props: { handleRefresh, openScanner } },
        { key: 'inventoryWithdrawal', label: 'الاستخراج المخزني', icon: LogOut, component: InventoryWithdrawalComponent, props: { handleRefresh, handleDelete, handleDataAction } },
        { key: 'inventory', label: 'المخزن والمواد', icon: Package, component: InventoryPageComponent, props: { handleRefresh, handleDataAction } },
        { key: 'settings', label: 'الإعدادات', icon: Settings, component: SettingsPage, props: { handleSettingsUpdate, registerLeaveGuard: registerSettingsLeaveGuard } },
        { key: 'admin', label: 'الإدارة', icon: Shield, component: AdminPage, props: { handleDataAction, showToast } },
        { key: 'about', label: 'حول النظام', icon: Info, component: AboutPage, props: {} },
    ];
    
    // فلترة عناصر القائمة حسب صلاحيات المستخدم
    const visibleNavItems = useMemo(() => {
        if (!currentUser) return [];
        return navItems.filter(item => {
            const perm = currentUser.permissions[item.key];
            // حول النظام متاحة للجميع
            if (item.key === 'about') return true;
            // تحقق من صلاحية الرؤية
            return perm && perm.view;
        });
    }, [currentUser, data.settings.users]); 

    // التحقق من صلاحية المستخدم للصفحة الحالية وتوجيهه للصفحة الصحيحة
    useEffect(() => {
        if (currentUser && currentPage) {
            // التحقق من أن المستخدم لديه صلاحية للصفحة الحالية
            const currentPagePerm = currentUser.permissions[currentPage];
            const hasAccess = currentPage === 'about' || (currentPagePerm && currentPagePerm.view);
            
            if (!hasAccess && visibleNavItems.length > 0) {
                // توجيه المستخدم لأول صفحة متاحة له
                setCurrentPage(visibleNavItems[0].key);
            }
        }
    }, [currentUser, currentPage, visibleNavItems]);

    const CurrentComponent = navItems.find(item => item.key === currentPage);
    const PageComponent = CurrentComponent?.component;
    const pageProps = CurrentComponent?.props || {};
    
    // **تعديل:** إزالة منطق تسجيل الدخول
    // ------------------------------------
    // const currentUser = data.settings.users[0]; // تم استبداله بـ currentUser من state // المستخدم الافتراضي
    // ------------------------------------

    const handleNavigationClick = (key) => {
        if (!ensureSettingsCanLeave(key)) {
            return;
        }
        performNavigation(key);
    };

    // **دالة تنقل خاصة تستخدمها SettingsPage فقط بعد تأكيد الحفظ/الإلغاء**
    const handleSettingsNavigation = (key) => {
        performNavigation(key);
    };





    // عرض صفحة تسجيل الدخول إذا لم يكن هناك مستخدم مسجل
    if (!currentUser) {
        return (
            <LoginPage
                users={data.settings.users}
                onLogin={handleLogin}
                showToast={showToast}
                systemExpiryDate={data.settings.systemExpiryDate}
                companyName={data.settings.companyName}
                masterKey={data.settings.masterKey}
            />
        );
    }
    return (
        <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 antialiased text-right overflow-x-hidden" dir="rtl">
            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700;900&display=swap');
                    body { font-family: 'Cairo', sans-serif; overflow-x: hidden; } /* overflow fix */ .temp-fix { font-family: 'Cairo', sans-serif; }
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
            <div className={`app-sidebar ${isSidebarCollapsed ? 'w-16' : 'w-64'} bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-white flex flex-col shadow-2xl border-l border-blue-700 dark:border-gray-700 fixed top-0 right-0 h-full z-50 transition-all duration-300 ${isSidebarOpen ? 'translate-x-0' : 'rtl:translate-x-full ltr:-translate-x-full'} lg:!translate-x-0`}>
                <div className={`${isSidebarCollapsed ? 'p-2' : 'p-6'} text-center border-b-2 border-blue-600 dark:border-gray-700 transition-all duration-300 bg-blue-950/30 dark:bg-gray-950/30`}>
                    {/* زر الطي في أعلى Sidebar */}
                    <button onClick={toggleSidebarCollapse} className={`${isSidebarCollapsed ? 'mx-auto' : 'absolute left-3 top-4'} flex items-center justify-center text-white p-2 rounded-full lg:inline-block hidden hover:bg-blue-800 transition`}>
                        {isSidebarCollapsed ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </button>
                    {!isSidebarCollapsed && <h1 className="text-3xl font-extrabold">{data.settings.companyName}</h1>}
                    {!isSidebarCollapsed && <p className="text-sm opacity-75">مرحباً, {currentUser.username}</p>}
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

            {/* Main Content Area */}
            <main className={`flex-grow p-2 sm:p-4 md:p-8 overflow-x-hidden ${isSidebarCollapsed ? 'lg:mr-16' : 'lg:mr-64'}`}>
                {/* Header for Mobile/Tablet */}
                <header className="app-header flex justify-between items-center bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-4 mb-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 lg:hidden">
                    <button onClick={() => setIsSidebarOpen(true)} className="flex items-center justify-center text-blue-600 dark:text-blue-400 p-2 rounded-lg hover:bg-gray-100 dark:bg-gray-600 dark:hover:bg-gray-700 transition">
                        <Menu className="w-5 h-5 md:w-6 md:h-6" />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 dark:text-gray-100">{navItems.find(item => item.key === currentPage)?.label}</h1>
                <div className="flex items-center space-x-2 space-x-reverse">
                        <button onClick={toggleDarkMode} className="flex items-center justify-center p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 text-gray-700 dark:text-gray-200">
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        {/* زر تبديل اللغة - مخفي */}
                        {/* <button onClick={toggleLanguage} data-testid="button-toggle-language-mobile" title={language === 'ar' ? 'English' : 'العربية'} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 hover:scale-110 text-gray-700 dark:text-gray-200">
                            <Languages className="w-5 h-5" />
                        </button> */}
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
                                currentUser={currentUser} // تمرير صلاحيات المستخدم الافتراضي
                                onNavigateAttempt={handleSettingsNavigation} // تمرير دالة التنقل الخاصة بـ SettingsPage
                                pendingInventoryAction={pendingInventoryAction}
                                setPendingInventoryAction={setPendingInventoryAction}
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

            <ScannerCaptureModal
                isOpen={scannerConfig.isOpen}
                title={scannerConfig.title}
                defaultFileName={scannerConfig.defaultFileName}
                onClose={closeScanner}
                onCapture={handleScannerCapture}
            />

            {/* About System Modal */}


            {/* Notification Toast */}
            {toast.message && (
                <NotificationToast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast({ message: '', type: '', id: null })}
                />
            )}

        </div>
    );
};

export default AccountingApp;
