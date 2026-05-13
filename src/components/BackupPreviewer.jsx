import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
    FaUserGraduate, FaClipboardList, FaBullhorn, FaMedal, FaTimes,
    FaCheckCircle, FaFileDownload, FaGraduationCap, FaComments, FaBook,
    FaFilter, FaSearch, FaChevronLeft, FaChevronRight, FaUserAlt,
    FaCalendarTimes, FaStickyNote, FaQuestionCircle, FaStar, FaQrcode,
    FaQuran, FaBookOpen, FaHandPaper, FaPencilAlt, FaMicrophone, FaCommentDots, FaClock, FaCheck,
    FaPaperPlane, FaUserCircle, FaInfoCircle
} from 'react-icons/fa';
import { QRCodeSVG } from 'qrcode.react';

// --- مساعدات التنسيق ---
const formatHijriDate = (date) => {
    try {
        return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-uma', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(new Date(date));
    } catch (e) {
        return new Date(date).toLocaleDateString('ar-SA');
    }
};

// --- مكونات واجهة العرض ---
const SectionHeader = ({ title, icon: Icon, color, status, score, total }) => (
    <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
        <h4 className="flex items-center gap-2 font-bold text-lg" style={{ color }}>
            <Icon /> {title}
        </h4>
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-gray-500 font-bold uppercase">{status}</span>
            <span className="font-bold text-sm" style={{ color }}>{score} / {total}</span>
        </div>
    </div>
);

const GradeBox = ({ value, color, size = 'md' }) => (
    <div className={`
        bg-gray-950/60 rounded-xl border border-gray-700 flex items-center justify-center font-bold text-white transition-all
        ${size === 'lg' ? 'h-14 text-xl' : 'h-10 text-sm'}
        ${value !== null && value !== undefined && value !== '' ? `border-${color}-500/50 shadow-[0_0_10px_rgba(0,0,0,0.3)]` : 'opacity-20'}
    `}>
        {value !== null && value !== undefined && value !== '' ? value : '--'}
    </div>
);

const BackupPreviewer = ({ data, onConfirm, onCancel }) => {
    const [activeTab, setActiveTab] = useState('summary');
    const [selectedGrade, setSelectedGrade] = useState('all');
    const [selectedSection, setSelectedSection] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewingStudent, setViewingStudent] = useState(null);

    // حالات التنقل والتبديل
    const [viewSemester, setViewSemester] = useState('semester1');
    const [viewPeriod, setViewPeriod] = useState('period1');

    // حالات المحادثة
    const [selectedChatStudent, setSelectedChatStudent] = useState(null);
    const chatEndRef = useRef(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedChatStudent]);

    if (!data) return null;

    // --- منطق الفلترة الموحد ---
    const gradesList = ['all', ...new Set(data.students?.map(s => s.grade_level || s.grade).filter(Boolean))];
    const sectionsList = ['all', ...new Set(data.students?.map(s => s.section || s.className).filter(Boolean))];

    const filteredStudents = useMemo(() => {
        return (data.students || [])
            .filter(s => {
                const matchesGrade = selectedGrade === 'all' || s.grade_level === selectedGrade || s.grade === selectedGrade;
                const matchesSection = selectedSection === 'all' || s.section === selectedSection || s.className === selectedSection;
                const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesGrade && matchesSection && matchesSearch;
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }, [data.students, selectedGrade, selectedSection, searchQuery]);

    const filteredCurriculum = useMemo(() => {
        const semesterKey = viewSemester; // 'semester1' or 'semester2'
        const periodKey = viewPeriod;     // 'period1' or 'period2'

        let allStandardItems = [];
        let allHomeworkItems = [];

        (data.curriculum || []).forEach(row => {
            // فلترة الصف
            const rowGrade = String(row.grade_id || row.grade || '').trim();
            if (selectedGrade !== 'all' && rowGrade !== String(selectedGrade).trim()) return;

            // 1. استخراج التلاوة والحفظ
            const recTree = row.recitation || {};
            const recItems = recTree[semesterKey]?.[periodKey] || [];
            // دعم الهياكل القديمة
            const legacyRec = (!recTree[semesterKey] && semesterKey === 'semester1') ? (recTree[periodKey] || []) : [];

            allStandardItems = [...allStandardItems, ...(Array.isArray(recItems) ? recItems : []), ...(Array.isArray(legacyRec) ? legacyRec : [])];

            // 2. استخراج الواجبات والمهام
            const hwTree = row.homework || {};
            const hwItems = hwTree[semesterKey]?.[periodKey] || [];
            // دعم الهياكل القديمة
            const legacyHw = (!hwTree[semesterKey] && semesterKey === 'semester1') ? (hwTree[periodKey] || []) : [];

            allHomeworkItems = [...allHomeworkItems, ...(Array.isArray(hwItems) ? hwItems : []), ...(Array.isArray(legacyHw) ? legacyHw : [])];
        });

        // إضافة بيانات الصف للعناصر للتسهيل
        const standard = allStandardItems.map(item => ({ ...item, surah_name: item.surah_name || item.start || item.name }));
        const homework = allHomeworkItems.map(item => ({ ...item, name: item.name || item.title }));

        return { standard, homework };
    }, [data.curriculum, selectedGrade, viewSemester, viewPeriod]);

    // --- جلب البيانات بذكاء ---
    const getActiveGrades = (student) => {
        let finalGrades = {};
        const externalGrades = data.grades?.find(g =>
            g.student_id === student.id &&
            g.semester === (viewSemester === 'semester1' ? 1 : 2) &&
            g.period === (viewPeriod === 'period1' ? 1 : 2)
        );
        if (externalGrades?.grades_data) finalGrades = { ...externalGrades.grades_data };

        const semesterData = student.grades?.[viewSemester] || {};
        const periodData = semesterData[viewPeriod] || {};

        finalGrades = { ...semesterData, ...finalGrades, ...periodData };

        return {
            ...finalGrades,
            tests: finalGrades.tests || finalGrades.period_tests || [],
            homework: finalGrades.homework || finalGrades.period_homework || [],
            performanceTasks: finalGrades.performanceTasks || finalGrades.performance_tasks || [],
            participation: finalGrades.participation || finalGrades.period_participation || [],
            quranRecitation: finalGrades.quranRecitation || finalGrades.quran_recitation || [],
            quranMemorization: finalGrades.quranMemorization || finalGrades.quran_memorization || [],
            classInteraction: finalGrades.classInteraction || finalGrades.class_interaction || [],
            weeklyNotes: finalGrades.weeklyNotes || finalGrades.weekly_notes || []
        };
    };

    const calculateTotal = (grades, category, type = 'sum') => {
        const vals = grades?.[category];
        if (!Array.isArray(vals)) return parseFloat(vals || 0);
        const validVals = vals.filter(v => v !== null && v !== undefined && v !== '');
        if (validVals.length === 0) return 0;
        if (type === 'sum') return validVals.reduce((a, b) => a + parseFloat(b), 0);
        if (type === 'average') return (validVals.reduce((a, b) => a + parseFloat(b), 0) / validVals.length).toFixed(2);
        if (type === 'best') return Math.max(...validVals.map(v => parseFloat(v)));
        return 0;
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center md:p-4 bg-gray-950/98 backdrop-blur-3xl font-['Noto_Sans_Arabic',sans-serif]">
            <div className="bg-[#111827] border border-white/10 w-full max-w-7xl h-full md:h-[96vh] md:rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">

                {/* Header Container */}
                <div className="p-3 md:p-6 border-b border-white/5 flex justify-between items-center bg-[#1f2937]/30">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 md:w-12 md:h-12 bg-blue-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <FaFileDownload className="text-white text-sm md:text-xl" />
                        </div>
                        <div>
                            <h2 className="text-base md:text-2xl font-black text-white">مستعرض النسخة</h2>
                            <p className="text-gray-400 text-[9px] font-bold uppercase tracking-[0.15em] mt-0.5 hidden md:block">Full Data Inspection Mode</p>
                        </div>
                    </div>
                    <div className="flex gap-2 md:gap-4">
                        <div className="hidden md:flex bg-gray-900 p-1 rounded-xl border border-white/5 shadow-inner">
                            <button onClick={() => setViewSemester('semester1')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewSemester === 'semester1' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>الفصل الأول</button>
                            <button onClick={() => setViewSemester('semester2')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewSemester === 'semester2' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>الفصل الثاني</button>
                        </div>
                        {/* فلتر الفصل على الجوال */}
                        <div className="flex md:hidden bg-gray-900 p-0.5 rounded-lg border border-white/5">
                            <button onClick={() => setViewSemester('semester1')} className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${viewSemester === 'semester1' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>١</button>
                            <button onClick={() => setViewSemester('semester2')} className={`px-2 py-1 rounded-md text-[9px] font-black transition-all ${viewSemester === 'semester2' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}>٢</button>
                        </div>
                        <button onClick={onCancel} className="text-gray-500 hover:text-white transition p-2 hover:bg-white/5 rounded-xl border border-white/5">
                            <FaTimes size={20} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Sidebar Nav - horizontal on mobile, vertical on desktop */}
                    <div className="md:w-64 bg-gray-950/50 md:border-l border-b md:border-b-0 border-white/5 md:p-4 md:space-y-2 md:overflow-y-auto flex md:flex-col flex-row overflow-x-auto" dir="rtl">
                        {[
                            { id: 'summary', label: 'إحصائيات', icon: <FaFilter /> },
                            { id: 'students', label: 'الطلاب', icon: <FaUserGraduate /> },
                            { id: 'curriculum', label: 'المناهج', icon: <FaBook /> },
                            { id: 'messages', label: 'المحادثات', icon: <FaComments /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 md:py-4 md:rounded-2xl transition-all font-bold md:w-full ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white md:shadow-xl md:shadow-blue-600/20 border-b-2 md:border-b-0 border-blue-500'
                                        : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'
                                }`}
                            >
                                <span className="text-base md:text-lg">{tab.icon}</span>
                                <span className="text-xs md:text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 flex flex-col bg-[#111827]/40 overflow-hidden" dir="rtl">
                        {/* شريط الأدوات العلوي للفلاتر */}
                        {activeTab !== 'summary' && (
                            <div className="p-2 md:p-4 border-b border-white/5 bg-[#1f2937]/10 flex flex-wrap gap-2 items-center">
                                <div className="flex items-center gap-2 bg-gray-900/80 border border-white/5 rounded-xl px-3 py-2 flex-1 min-w-[120px] shadow-inner">
                                    <FaSearch className="text-gray-500 text-xs" />
                                    <input
                                        type="text"
                                        placeholder="بحث..."
                                        className="bg-transparent border-none outline-none text-white text-xs md:text-sm w-full font-bold"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="bg-gray-800 text-white px-2 md:px-5 py-2 rounded-xl border border-white/5 outline-none text-xs font-bold"
                                    value={selectedGrade}
                                    onChange={(e) => setSelectedGrade(e.target.value)}
                                >
                                    {gradesList.map(g => <option key={g} value={g}>{g === 'all' ? 'كل الصفوف' : `${g}`}</option>)}
                                </select>
                                <select
                                    className="bg-gray-800 text-white px-2 md:px-5 py-2 rounded-xl border border-white/5 outline-none text-xs font-bold"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    {sectionsList.map(s => <option key={s} value={s}>{s === 'all' ? 'كل الفصول' : `${s}`}</option>)}
                                </select>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                            {/* --- شاشة الطلاب --- */}
                            {activeTab === 'students' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredStudents.map((student, idx) => (
                                        <div
                                            key={idx}
                                            onClick={() => setViewingStudent(student)}
                                            className="bg-[#1f2937]/30 border border-white/5 rounded-2xl p-4 flex justify-between items-center hover:bg-blue-600/10 hover:border-blue-500/30 transition-all cursor-pointer group"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                                    {(student.photo || student.image_url) ? <img src={student.photo || student.image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-blue-400 font-black text-xl">{idx + 1}</div>}
                                                </div>
                                                <div>
                                                    <p className="text-base font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{student.name}</p>
                                                    <p className="text-[10px] text-gray-500 font-bold mt-1">فصل {student.section || student.className} - الصف {student.grade_level || student.grade}</p>
                                                </div>
                                            </div>
                                            <FaChevronLeft className="text-gray-700 group-hover:text-blue-400 group-hover:translate-x-[-5px] transition-all" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* --- شاشة المناهج --- */}
                            {activeTab === 'curriculum' && (
                                <div className="space-y-8">
                                    {/* أزرار التبديل بين الفترات للمناهج */}
                                    <div className="flex justify-center mb-6">
                                        <div className="flex bg-gray-900 p-1 rounded-2xl border border-white/5 shadow-2xl">
                                            <button onClick={() => setViewPeriod('period1')} className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${viewPeriod === 'period1' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-gray-300'}`}>الفترة الأولى</button>
                                            <button onClick={() => setViewPeriod('period2')} className={`px-8 py-2 rounded-xl text-xs font-black transition-all ${viewPeriod === 'period2' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-gray-300'}`}>الفترة الثانية</button>
                                        </div>
                                    </div>

                                    {/* القرآن الكريم */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-blue-400 flex items-center gap-3"><FaQuran /> منهج القرآن الكريم</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {filteredCurriculum.standard.length > 0 ? filteredCurriculum.standard.map((item, idx) => (
                                                <div key={idx} className="bg-gray-800/40 p-5 rounded-2xl border border-white/5 shadow-xl hover:border-blue-500/30 transition-all">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-1 rounded-lg font-black uppercase">{item.type === 'recitation' ? 'تلاوة' : 'حفظ'}</span>
                                                        <span className="text-gray-500 text-[10px] font-bold italic">أسبوع {item.week_number}</span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-sm mb-2">{item.surah_name || item.name}</h4>
                                                    <p className="text-[10px] text-gray-500 line-clamp-2">الآيات: {item.verses || 'محدد في الخطة'}</p>
                                                </div>
                                            )) : <div className="col-span-full py-10 text-center text-gray-600 italic">لا توجد دروس مضافة لهذا الصف في هذه الفترة.</div>}
                                        </div>
                                    </div>

                                    {/* الواجبات والمهام */}
                                    <div className="space-y-4">
                                        <h3 className="text-xl font-black text-green-400 flex items-center gap-3"><FaClipboardList /> الواجبات والمهام والأدائية</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {filteredCurriculum.homework.length > 0 ? filteredCurriculum.homework.map((item, idx) => (
                                                <div key={idx} className="bg-gray-800/40 p-5 rounded-2xl border border-white/5 shadow-xl hover:border-green-500/30 transition-all">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <span className={`text-[10px] px-2 py-1 rounded-lg font-black uppercase ${item.type === 'homework' ? 'bg-green-600/20 text-green-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                                            {item.type === 'homework' ? 'واجب' : item.type === 'performanceTask' ? 'مهمة أدائية' : 'اختبار'}
                                                        </span>
                                                        <span className="text-gray-500 text-[10px] font-bold italic">الفترة {item.period}</span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-sm mb-2">{item.name}</h4>
                                                    <div className="flex gap-2 mt-3">
                                                        <span className="bg-gray-900 text-gray-500 text-[9px] px-2 py-1 rounded border border-white/5">الدرجة: {item.max_score || 10}</span>
                                                        <span className="bg-gray-900 text-gray-500 text-[9px] px-2 py-1 rounded border border-white/5">الصف: {item.grade_level}</span>
                                                    </div>
                                                </div>
                                            )) : <div className="col-span-full py-10 text-center text-gray-600 italic">لا توجد واجبات أو مهام مضافة.</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- شاشة المحادثات المؤرشفة --- */}
                            {activeTab === 'messages' && (
                                <div className="flex h-full rounded-xl md:rounded-[2rem] overflow-hidden border border-white/5 bg-gray-900/50 shadow-2xl">
                                    {/* قائمة الطلاب الجانبية في الشات */}
                                    <div className={`${selectedChatStudent ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 border-l border-white/5 bg-gray-950/30 flex-col`}>
                                        <div className="p-4 border-b border-white/5">
                                            <h4 className="text-white font-black text-sm mb-3">طلاب الصف</h4>
                                            <div className="bg-gray-900 rounded-xl px-3 py-2 border border-white/5 flex items-center gap-2">
                                                <FaSearch className="text-gray-600 size-3" />
                                                <input type="text" placeholder="بحث سريع..." className="bg-transparent border-none outline-none text-xs text-white w-full" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                            {filteredStudents.map((student, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setSelectedChatStudent(student)}
                                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${selectedChatStudent?.id === student.id ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-white/5 text-gray-400'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                                        {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-800 flex items-center justify-center text-[10px]">{student.name[0]}</div>}
                                                    </div>
                                                    <div className="text-right flex-1 truncate">
                                                        <p className={`text-xs font-bold truncate ${selectedChatStudent?.id === student.id ? 'text-white' : 'text-gray-200'}`}>{student.name}</p>
                                                        <p className="text-[9px] opacity-60 mt-0.5">فصل: {student.section || student.className}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* منطقة الرسائل */}
                                    <div className={`${selectedChatStudent ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-[#0f172a]/80 relative`}>
                                        {selectedChatStudent ? (
                                            <>
                                                {/* Header الشات */}
                                                <div className="p-3 md:p-4 bg-gray-800/60 border-b border-white/5 flex items-center gap-3">
                                                    <button onClick={() => setSelectedChatStudent(null)} className="md:hidden text-gray-400 hover:text-white p-1.5 bg-gray-700 rounded-lg mr-1">
                                                        <FaChevronRight size={12} />
                                                    </button>
                                                    <div className="w-9 h-9 rounded-full border border-white/10 overflow-hidden flex-shrink-0">
                                                        <img src={selectedChatStudent.photo || '/images/1.webp'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black text-sm">{selectedChatStudent.name}</h4>
                                                        <p className="text-[9px] text-green-400 font-bold">محادثة مؤرشفة</p>
                                                    </div>
                                                </div>
                                                {/* سجل الرسائل */}
                                                <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#0b1120]">
                                                    {(data.messages || [])
                                                        .filter(m => m.student_id === selectedChatStudent.id)
                                                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                                                        .map((msg, idx) => {
                                                            const isTeacher = msg.sender_type === 'teacher';
                                                            return (
                                                                <div key={idx} className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
                                                                    <div className={`max-w-[80%] p-3.5 rounded-2xl relative shadow-xl border ${isTeacher ? 'bg-blue-600 text-white rounded-tl-sm border-blue-500' : 'bg-gray-800 text-gray-200 rounded-tr-sm border-white/5'}`}>
                                                                        <p className="text-xs leading-relaxed">{msg.content}</p>
                                                                        <div className="flex items-center justify-end gap-2 mt-2 opacity-60 text-[8px] font-bold">
                                                                            <span>{formatHijriDate(msg.created_at)}</span>
                                                                            <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                    {(!data.messages || !data.messages.some(m => m.student_id === selectedChatStudent.id)) && (
                                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 opacity-30">
                                                            <FaComments size={64} />
                                                            <p className="text-sm italic">لا توجد رسائل مؤرشفة لهذا الطالب.</p>
                                                        </div>
                                                    )}
                                                    <div ref={chatEndRef} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-4 opacity-20">
                                                <FaComments size={80} />
                                                <p className="text-xl font-black">اختر طالباً لاستعراض المحادثة</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- شاشة الملخص --- */}
                            {activeTab === 'summary' && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'الطلاب المؤرشفين', count: data.students?.length || 0, icon: <FaUserGraduate />, color: 'text-blue-400' },
                                        { label: 'دروس المنهج', count: (data.curriculum?.length || 0) + (data.homework_curriculum?.length || 0), icon: <FaQuran />, color: 'text-purple-400' },
                                        { label: 'رسائل المحادثة', count: data.messages?.length || 0, icon: <FaComments />, color: 'text-teal-400' },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-gray-800/40 border border-white/5 p-8 rounded-[2.5rem] text-center shadow-2xl hover:bg-white/5 transition-colors">
                                            <div className={`text-5xl ${stat.color} mb-4 flex justify-center`}>{stat.icon}</div>
                                            <div className="text-4xl font-black text-white mb-1">{stat.count}</div>
                                            <div className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* نافذة ملف الطالب الشامل (Grades View) */}
                {viewingStudent && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center md:p-10 bg-black/95 backdrop-blur-3xl" dir="rtl">
                        <div className="bg-[#1a2332] border border-white/10 w-full max-w-6xl h-full md:h-[94vh] md:rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">

                            {/* Header */}
                            <div className="p-4 md:p-8 bg-gray-900 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-3 md:gap-6">
                                    <div className="relative">
                                        <img src={viewingStudent.photo || viewingStudent.image_url || '/images/1.webp'} alt="" className="w-14 h-14 md:w-28 md:h-28 rounded-xl md:rounded-[2rem] object-cover border-2 md:border-4 border-gray-700 shadow-2xl" />
                                        <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-10 md:h-10 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white shadow-xl border-2 md:border-4 border-[#1a2332]"><FaCheck size={10} /></div>
                                    </div>
                                    <div className="text-white">
                                        <h3 className="text-lg md:text-3xl font-black mb-1 tracking-tight">{viewingStudent.name}</h3>
                                        <div className="flex flex-wrap gap-2 text-[9px] md:text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            <span className="bg-gray-800 px-2 py-0.5 rounded-lg">السجل: {viewingStudent.nationalId || viewingStudent.national_id || '---'}</span>
                                            <span>{viewingStudent.grade_level || viewingStudent.grade} - {viewingStudent.section || viewingStudent.className}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setViewingStudent(null)} className="p-2 md:p-4 bg-gray-800 hover:bg-red-500/20 text-white rounded-xl md:rounded-2xl transition border border-white/5"><FaTimes size={18} /></button>
                            </div>

                            {/* التبديل بين الفترات */}
                            <div className="bg-gray-950/50 p-3 border-b border-white/5 flex justify-center gap-6">
                                <div className="flex bg-gray-900 p-1 rounded-xl border border-white/5 shadow-inner">
                                    <button onClick={() => setViewPeriod('period1')} className={`px-5 py-1.5 rounded-lg text-xs font-black transition-all ${viewPeriod === 'period1' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>الفترة الأولى</button>
                                    <button onClick={() => setViewPeriod('period2')} className={`px-5 py-1.5 rounded-lg text-xs font-black transition-all ${viewPeriod === 'period2' ? 'bg-orange-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}>الفترة الثانية</button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar bg-[#0f172a]">

                                {/* البطاقة الرقمية */}
                                <div className="bg-gray-800/40 p-4 md:p-6 rounded-2xl md:rounded-[2.5rem] border border-white/5 mb-6 md:mb-10 flex flex-col items-center justify-center gap-4">
                                    <div className="bg-white p-4 rounded-xl flex items-center justify-between gap-6 w-full max-w-md shadow-2xl border border-gray-300" style={{ direction: 'rtl' }}>
                                        <div className="flex flex-col items-start flex-grow text-right">
                                            <h2 className="text-xl font-bold text-black mb-1 line-clamp-1">{viewingStudent.name}</h2>
                                            <p className="text-sm font-bold text-gray-800 mb-2">السجل: {viewingStudent.nationalId || viewingStudent.national_id}</p>
                                            <p className="text-[10px] text-gray-600 font-semibold">{viewingStudent.grade_level || viewingStudent.grade} - {viewingStudent.section || viewingStudent.className}</p>
                                        </div>
                                        <div className="border-r pr-4 border-gray-200">
                                            <QRCodeSVG value={`${window.location.origin}/grades/${viewingStudent.grade_level}/sections/${viewingStudent.section}/students/${viewingStudent.id}`} size={100} level="M" />
                                        </div>
                                    </div>
                                </div>

                                {(() => {
                                    const activeGrades = getActiveGrades(viewingStudent);
                                    const tests = calculateTotal(activeGrades, 'tests', 'sum');
                                    const recitation = calculateTotal(activeGrades, 'quranRecitation', 'average');
                                    const memorization = calculateTotal(activeGrades, 'quranMemorization', 'average');
                                    const homework = calculateTotal(activeGrades, 'homework', 'sum');
                                    const participation = calculateTotal(activeGrades, 'participation', 'sum');
                                    const classInteraction = calculateTotal(activeGrades, 'classInteraction', 'best');
                                    const performanceTasks = calculateTotal(activeGrades, 'performanceTasks', 'best');

                                    const totalOral = (parseFloat(recitation) + parseFloat(memorization) + parseFloat(tests)).toFixed(2);
                                    const totalTasks = (parseFloat(homework) + parseFloat(participation) + parseFloat(classInteraction) + parseFloat(performanceTasks)).toFixed(2);
                                    const grandTotal = (parseFloat(totalOral) + parseFloat(totalTasks)).toFixed(2);

                                    return (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                                                <div className="bg-gray-800/40 p-8 rounded-3xl border-b-8 border-green-500 shadow-2xl text-center">
                                                    <p className="text-gray-500 text-[10px] font-black mb-2 uppercase">المجموع النهائي</p>
                                                    <div className="text-4xl font-black text-green-400 flex justify-center items-end gap-1">{grandTotal} <span className="text-xs text-gray-600 font-bold">/ 100</span></div>
                                                </div>
                                                <div className="bg-gray-800/40 p-8 rounded-3xl border-b-8 border-yellow-500 shadow-2xl text-center">
                                                    <p className="text-gray-500 text-[10px] font-black mb-2 uppercase">المهام والمشاركة والتفاعل والواجبات</p>
                                                    <div className="text-4xl font-black text-yellow-500 flex justify-center items-end gap-1">{totalTasks} <span className="text-xs text-gray-600 font-bold">/ 40</span></div>
                                                </div>
                                                <div className="bg-gray-800/40 p-8 rounded-3xl border-b-8 border-blue-500 shadow-2xl text-center">
                                                    <p className="text-gray-500 text-[10px] font-black mb-2 uppercase">تقويمات شفهية وتحريرية</p>
                                                    <div className="text-4xl font-black text-blue-400 flex justify-center items-end gap-1">{totalOral} <span className="text-xs text-gray-600 font-bold">/ 60</span></div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                                                <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/5">
                                                    <SectionHeader title="الاختبارات" icon={FaBookOpen} color="#f87171" status="✓ سجل الدرجات" score={tests} total="40" />
                                                    <div className="flex gap-4">{(activeGrades.tests || [null, null]).slice(0, 2).map((g, i) => <div key={i} className="flex-1"><GradeBox value={g} color="red" size="lg" /></div>)}</div>
                                                </div>
                                                <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/5">
                                                    <h4 className="flex items-center gap-3 font-black text-blue-400 mb-6 text-xl border-b border-gray-700 pb-3"><FaQuran /> القرآن الكريم</h4>
                                                    <div className="space-y-6">
                                                        <div>
                                                            <div className="flex justify-between text-[10px] mb-2 font-bold"><span className="text-gray-500 uppercase">التلاوة</span> <span className="text-blue-400">{recitation} / 10</span></div>
                                                            <div className="flex gap-2">{(activeGrades.quranRecitation || [null, null, null, null, null]).slice(0, 5).map((g, i) => <div key={i} className="flex-1"><GradeBox value={g} color="blue" size="sm" /></div>)}</div>
                                                        </div>
                                                        <div>
                                                            <div className="flex justify-between text-[10px] mb-2 font-bold"><span className="text-green-500 uppercase">الحفظ</span> <span className="text-blue-400">{memorization} / 10</span></div>
                                                            <div className="flex gap-2">{(activeGrades.quranMemorization || [null, null, null, null, null]).slice(0, 5).map((g, i) => <div key={i} className="flex-1"><GradeBox value={g} color="blue" size="sm" /></div>)}</div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/5">
                                                    <SectionHeader title="التفاعل الصفي" icon={FaMicrophone} color="#fbbf24" status="المشاركة النشطة" score={classInteraction} total="10" />
                                                    <div className="grid grid-cols-4 gap-4">{(activeGrades.classInteraction || [null, null, null, null]).slice(0, 4).map((g, i) => <GradeBox key={i} value={g} color="yellow" size="lg" />)}</div>
                                                </div>
                                                <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/5">
                                                    <SectionHeader title="الواجبات" icon={FaClipboardList} color="#4ade80" status="سجل المتابعة" score={homework} total="10" />
                                                    <div className="grid grid-cols-5 gap-3">{(activeGrades.homework || [null, null, null, null, null, null, null, null, null, null]).slice(0, 10).map((g, i) => <GradeBox key={i} value={g} color="green" size="sm" />)}</div>
                                                </div>
                                                <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/5">
                                                    <SectionHeader title="المهام الأدائية" icon={FaPencilAlt} color="#a855f7" status="التقويم المستمر" score={performanceTasks} total="10" />
                                                    <div className="grid grid-cols-4 gap-4">{(activeGrades.performanceTasks || [null, null, null, null]).slice(0, 4).map((g, i) => <GradeBox key={i} value={g} color="purple" size="lg" />)}</div>
                                                </div>
                                                <div className="bg-gray-800/20 p-6 rounded-3xl border border-white/5">
                                                    <SectionHeader title="المشاركة" icon={FaCommentDots} color="#06b6d4" status="سجل الحضور" score={participation} total="10" />
                                                    <div className="grid grid-cols-5 gap-3">{(activeGrades.participation || [null, null, null, null, null, null, null, null, null, null]).slice(0, 10).map((g, i) => <GradeBox key={i} value={g} color="cyan" size="sm" />)}</div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-800/40 p-8 rounded-[3rem] border border-white/5">
                                                <h4 className="text-yellow-500 font-black mb-8 flex items-center gap-4 text-2xl"><FaStickyNote /> سجل الملاحظات الأسبوعي</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-h-80 overflow-y-auto custom-scrollbar p-2">
                                                    {(activeGrades.weeklyNotes || []).map((notes, wIndex) => {
                                                        if (!notes || notes.length === 0) return null;
                                                        return (
                                                            <div key={wIndex} className="bg-gray-900/60 border border-gray-700 rounded-2xl p-4 shadow-xl">
                                                                <h5 className="text-blue-400 font-black text-xs mb-3 border-b border-gray-700 pb-2 text-center uppercase tracking-widest">الأسبوع {wIndex + 1}</h5>
                                                                <ul className="space-y-2">{notes.map((note, nIndex) => (<li key={nIndex} className="text-xs text-gray-300 bg-gray-800/50 p-3 rounded-xl border-r-4 border-blue-500 border border-gray-700 italic">"{note}"</li>))}</ul>
                                                            </div>
                                                        );
                                                    })}
                                                    {(!activeGrades.weeklyNotes || !activeGrades.weeklyNotes.some(n => n && n.length > 0)) && (<div className="col-span-full text-center text-gray-600 py-10 italic">لا توجد ملاحظات مسجلة لهذه الفترة.</div>)}
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}

                            </div>

                            <div className="p-4 md:p-8 border-t border-white/5 bg-gray-900 flex justify-center">
                                <button onClick={() => setViewingStudent(null)} className="w-full md:w-auto px-8 md:px-24 py-3 md:py-5 bg-blue-600 text-white rounded-2xl md:rounded-3xl font-black hover:bg-blue-500 transition shadow-2xl shadow-blue-600/40 uppercase tracking-widest text-sm md:text-base">إغلاق المستعرض</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Main */}
                <div className="p-3 md:p-10 border-t border-white/5 bg-gray-950/80 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-10">
                    <div className="hidden md:block text-orange-400 bg-orange-400/5 px-10 py-6 rounded-[3rem] border border-orange-500/10 text-xs font-bold leading-relaxed flex-1">
                        تنبيه: يمكنك الآن استعراض المناهج والمحادثات مع فلاتر الصف والفصل.
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                        <button onClick={onCancel} className="flex-1 md:flex-none px-6 md:px-12 py-3 md:py-6 bg-gray-800 text-gray-300 rounded-xl md:rounded-[2rem] font-bold hover:bg-gray-700 transition text-sm">إلغاء</button>
                        <button onClick={onConfirm} className="flex-1 md:flex-none px-8 md:px-16 py-3 md:py-6 bg-blue-600 text-white rounded-xl md:rounded-[2rem] font-black hover:bg-blue-500 transition shadow-2xl text-sm">تأكيد الاسترجاع</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupPreviewer;