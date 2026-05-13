import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    FaUserGraduate, FaClipboardList, FaBullhorn, FaMedal, FaTimes, 
    FaCheckCircle, FaFileDownload, FaGraduationCap, FaComments, FaBook,
    FaFilter, FaSearch, FaChevronLeft, FaChevronRight, FaUserAlt,
    FaCalendarTimes, FaStickyNote, FaQuestionCircle, FaStar, FaQrcode,
    FaQuran, FaBookOpen, FaHandPaper, FaPencilAlt, FaMicrophone, FaCommentDots, FaClock, FaCheck,
    FaPaperPlane, FaUserCircle, FaInfoCircle, FaFolderOpen, FaLock, FaFolder, FaFilePdf, FaFileAlt, FaEye,
    FaArrowRight, FaBoxOpen, FaSpinner, FaCloudUploadAlt, FaTrash, FaExclamationTriangle, FaFileImage, FaExternalLinkAlt, FaHome, FaCog, FaUnlock, FaFileExport, FaFolderPlus
} from 'react-icons/fa';

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

    // حالات التصفح الفرعي (للمجلدات)
    const [selectedSolutionFolder, setSelectedSolutionFolder] = useState(null);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [selectedChatStudent]);

    if (!data) return null;

    // --- منطق الفلترة الموحد ---
    const gradesList = ['all', ...new Set((Array.isArray(data.students) ? data.students : []).map(s => s.grade_level || s.grade).filter(Boolean))];
    const sectionsList = ['all', ...new Set((Array.isArray(data.students) ? data.students : []).map(s => s.section || s.className).filter(Boolean))];

    const filteredStudents = useMemo(() => {
        return (Array.isArray(data.students) ? data.students : [])
            .filter(s => {
                const matchesGrade = selectedGrade === 'all' || s.grade_level === selectedGrade || s.grade === selectedGrade;
                const matchesSection = selectedSection === 'all' || s.section === selectedSection || s.className === selectedSection;
                const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesGrade && matchesSection && matchesSearch;
            })
            .sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }, [data.students, selectedGrade, selectedSection, searchQuery]);

    const filteredCurriculum = useMemo(() => {
        const semesterKey = viewSemester; 
        const periodKey = viewPeriod;     
        
        let allStandardItems = [];
        let allHomeworkItems = [];

        (Array.isArray(data.curriculum) ? data.curriculum : []).forEach(row => {
            const rowGrade = String(row.grade_id || row.grade || '').trim();
            if (selectedGrade !== 'all' && rowGrade !== String(selectedGrade).trim()) return;

            const recTree = row.recitation || {};
            const recItems = recTree[semesterKey]?.[periodKey] || [];
            const legacyRec = (!recTree[semesterKey] && semesterKey === 'semester1') ? (recTree[periodKey] || []) : [];
            allStandardItems = [...allStandardItems, ...(Array.isArray(recItems) ? recItems : []), ...(Array.isArray(legacyRec) ? legacyRec : [])];

            const hwTree = row.homework || {};
            const hwItems = hwTree[semesterKey]?.[periodKey] || [];
            const legacyHw = (!hwTree[semesterKey] && semesterKey === 'semester1') ? (hwTree[periodKey] || []) : [];
            allHomeworkItems = [...allHomeworkItems, ...(Array.isArray(hwItems) ? hwItems : []), ...(Array.isArray(legacyHw) ? legacyHw : [])];
        });

        const standard = allStandardItems.map(item => ({ ...item, surah_name: item.surah_name || item.start || item.name }));
        const homework = allHomeworkItems.map(item => ({ ...item, name: item.name || item.title }));
        
        return { standard, homework };
    }, [data.curriculum, selectedGrade, viewSemester, viewPeriod]);

    // --- جلب البيانات بذكاء ---
    const getActiveGrades = (student) => {
        let finalGrades = {};
        const gradesArr = Array.isArray(data.grades) ? data.grades : [];
        const externalGrades = gradesArr.find(g => 
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

    const getStudentPortfolioItems = () => {
        const items = Array.isArray(data.portfolio_files) ? data.portfolio_files : [];
        return items.filter(f => {
            const matchesSearch = (f.file_name || f.name || "").toLowerCase().includes(searchQuery.toLowerCase());
            const s = Array.isArray(data.students) ? data.students.find(st => st.id === f.student_id) : null;
            if (s) {
                const matchesGrade = selectedGrade === 'all' || s.grade_level === selectedGrade || s.grade === selectedGrade;
                const matchesSection = selectedSection === 'all' || s.section === selectedSection || s.className === selectedSection;
                return matchesGrade && matchesSection && matchesSearch;
            }
            return matchesSearch;
        });
    };

    const getBookSolutionFolders = () => {
        const assignments = Array.isArray(data.folder_assignments) ? data.folder_assignments : [];
        const folders = Array.isArray(data.course_folders) ? data.course_folders : [];
        
        // تصفية المجلدات المرتبطة بالفصل المختار
        let filteredFolders = folders;
        if (selectedGrade !== 'all' || selectedSection !== 'all') {
            const validFolderIds = assignments
                .filter(a => (selectedGrade === 'all' || a.grade_id === selectedGrade) && (selectedSection === 'all' || a.section_id === selectedSection))
                .map(a => a.folder_id);
            filteredFolders = folders.filter(f => validFolderIds.includes(f.id));
        }

        return filteredFolders.map(f => ({
            ...f,
            files: (Array.isArray(data.folder_contents) ? data.folder_contents : [])
                .filter(c => c.folder_id === f.id)
                .map(c => {
                    const libFile = (Array.isArray(data.library_files) ? data.library_files : []).find(lf => lf.id === c.file_id);
                    return libFile ? { ...libFile, name: libFile.file_name, url: libFile.file_data } : null;
                })
                .filter(Boolean)
        })).filter(f => !f.is_hidden);
    };

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-gray-950/98 backdrop-blur-3xl font-['Noto_Sans_Arabic',sans-serif]">
            <div className="bg-[#0f172a] border border-white/10 w-full max-w-7xl h-[96vh] rounded-[3rem] overflow-hidden shadow-2xl flex flex-col">
                
                {/* Header Container */}
                <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-900/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <FaFileDownload className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-white">مستعرض النسخة الشامل</h2>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Full Data Inspection Mode</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="hidden md:flex bg-gray-950 p-1 rounded-xl border border-white/5 shadow-inner">
                            <button onClick={() => setViewSemester('semester1')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewSemester === 'semester1' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-400'}`}>الفصل الأول</button>
                            <button onClick={() => setViewSemester('semester2')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all ${viewSemester === 'semester2' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-400'}`}>الفصل الثاني</button>
                        </div>
                        <button onClick={onCancel} className="text-gray-500 hover:text-white transition p-2 hover:bg-white/5 rounded-xl border border-white/5">
                            <FaTimes size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                    {/* Sidebar Nav - Responsive */}
                    <div className="w-full md:w-72 bg-slate-900/40 border-l border-white/5 p-4 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto whitespace-nowrap custom-scrollbar" dir="rtl">
                        {[
                            { id: 'summary', label: 'إحصائيات', icon: <FaFilter /> },
                            { id: 'students', label: 'الطلاب', icon: <FaUserGraduate /> },
                            { id: 'curriculum', label: 'المناهج', icon: <FaBook /> },
                            { id: 'studentPortfolio', label: 'ملفات إنجاز الطلاب', icon: <FaGraduationCap /> },
                            { id: 'bookSolutions', label: 'حلول الكتب', icon: <FaBookOpen /> },
                            { id: 'teacherPortfolio', label: 'ملف إنجاز المعلم', icon: <FaUserAlt /> },
                            { id: 'messages', label: 'المحادثات', icon: <FaComments /> },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedSolutionFolder(null); }}
                                className={`flex items-center gap-3 px-4 py-3 md:py-4 rounded-2xl transition-all font-bold flex-shrink-0 md:flex-shrink-1 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'text-gray-500 hover:bg-white/5 hover:text-gray-300'}`}
                            >
                                <span className="text-lg">{tab.icon}</span> 
                                <span className="text-xs md:text-sm">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Main Workspace */}
                    <div className="flex-1 flex flex-col bg-[#0f172a]/20 overflow-hidden" dir="rtl">
                        {!['summary', 'teacherPortfolio'].includes(activeTab) && (
                            <div className="p-4 border-b border-white/5 bg-slate-900/20 flex flex-wrap gap-3 items-center">
                                <div className="flex items-center gap-3 bg-gray-950/80 border border-white/5 rounded-xl px-5 py-2 flex-1 min-w-[150px] shadow-inner">
                                    <FaSearch className="text-gray-500" />
                                    <input 
                                        type="text" 
                                        placeholder="بحث..." 
                                        className="bg-transparent border-none outline-none text-white text-sm w-full font-bold"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
                                    <select 
                                        className="bg-gray-800 text-white px-4 py-2 rounded-xl border border-white/5 outline-none text-[10px] font-bold min-w-[100px]"
                                        value={selectedGrade}
                                        onChange={(e) => setSelectedGrade(e.target.value)}
                                    >
                                        {gradesList.map(g => <option key={g} value={g}>{g === 'all' ? 'كل الصفوف' : `الصف: ${g}`}</option>)}
                                    </select>
                                    <select 
                                        className="bg-gray-800 text-white px-4 py-2 rounded-xl border border-white/5 outline-none text-[10px] font-bold min-w-[100px]"
                                        value={selectedSection}
                                        onChange={(e) => setSelectedSection(e.target.value)}
                                    >
                                        {sectionsList.map(s => <option key={s} value={s}>{s === 'all' ? 'كل الفصول' : `فصل: ${s}`}</option>)}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar">
                            
                            {/* --- شاشة ملفات إنجاز الطلاب (مجمعة حسب الطالب) --- */}
                            {activeTab === 'studentPortfolio' && (
                                <div className="space-y-12">
                                    {filteredStudents.map(student => {
                                        const studentFiles = (Array.isArray(data.portfolio_files) ? data.portfolio_files : [])
                                            .filter(f => f.student_id === student.id);
                                        
                                        const performanceTasks = studentFiles.filter(f => f.category === 'performance_tasks');
                                        const others = studentFiles.filter(f => f.category !== 'performance_tasks');

                                        if (studentFiles.length === 0) return null;

                                        return (
                                            <div key={student.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] shadow-xl animate-fade-in-up">
                                                {/* رأس الطالب */}
                                                <div className="flex items-center gap-4 mb-8 border-b border-white/5 pb-6">
                                                    <div className="w-16 h-16 rounded-full p-1 bg-gradient-to-tr from-blue-500 to-purple-600">
                                                        <img 
                                                            src={student.photo || '/default-avatar.png'} 
                                                            className="w-full h-full rounded-full object-cover bg-slate-800" 
                                                            alt="" 
                                                            onError={(e) => e.target.src = '/default-avatar.png'}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-white">{student.name}</h3>
                                                        <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-white/5">{studentFiles.length} ملفات مؤرشفة</span>
                                                    </div>
                                                </div>

                                                <div className="space-y-8">
                                                    {/* المهام الأدائية */}
                                                    <div>
                                                        <h4 className="text-blue-400 font-bold mb-4 flex items-center gap-2 text-sm border-r-2 border-blue-500 pr-3"><FaClipboardList /> المهام الأدائية</h4>
                                                        {performanceTasks.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                {performanceTasks.map((file, idx) => (
                                                                    <div key={idx} className="group bg-slate-800/60 border border-slate-700 rounded-2xl p-3 transition-all hover:border-blue-500 shadow-lg">
                                                                        <div className="aspect-video bg-slate-950 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-800 relative">
                                                                            <img src={file.file_url || file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <a href={file.file_url || file.url} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md p-2.5 rounded-full text-white border border-white/20 shadow-lg"><FaEye /></a>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[10px] font-bold text-gray-300 truncate text-center px-1">{file.file_name || file.name}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : <p className="text-[10px] text-gray-600 italic pr-4">لا توجد مهام أدائية.</p>}
                                                    </div>

                                                    {/* أعمال أخرى */}
                                                    <div>
                                                        <h4 className="text-purple-400 font-bold mb-4 flex items-center gap-2 text-sm border-r-2 border-purple-500 pr-3"><FaFolderOpen /> أعمال أخرى</h4>
                                                        {others.length > 0 ? (
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                                                {others.map((file, idx) => (
                                                                    <div key={idx} className="group bg-slate-800/60 border border-slate-700 rounded-2xl p-3 transition-all hover:border-purple-500 shadow-lg">
                                                                        <div className="aspect-video bg-slate-950 rounded-xl mb-3 flex items-center justify-center overflow-hidden border border-slate-800 relative">
                                                                            <img src={file.file_url || file.url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt="" />
                                                                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                <a href={file.file_url || file.url} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md p-2.5 rounded-full text-white border border-white/20 shadow-lg"><FaEye /></a>
                                                                            </div>
                                                                        </div>
                                                                        <p className="text-[10px] font-bold text-gray-300 truncate text-center px-1">{file.file_name || file.name}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ) : <p className="text-[10px] text-gray-600 italic pr-4">لا توجد ملفات أخرى.</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {filteredStudents.every(s => !(Array.isArray(data.portfolio_files) ? data.portfolio_files : []).some(f => f.student_id === s.id)) && (
                                        <div className="py-20 text-center text-gray-600 italic bg-slate-800/10 rounded-[3rem] border border-dashed border-white/5">لا توجد ملفات إنجاز مرتبطة بهؤلاء الطلاب في هذه النسخة.</div>
                                    )}
                                </div>
                            )}

                            {/* --- شاشة حلول الكتب (تصميم المجلدات) --- */}
                            {activeTab === 'bookSolutions' && (
                                <div className="space-y-8">
                                    {selectedSolutionFolder ? (
                                        <div className="space-y-6 animate-slideUp">
                                            <button onClick={() => setSelectedSolutionFolder(null)} className="flex items-center gap-2 text-blue-400 font-black text-sm hover:text-blue-300 transition-colors">
                                                <FaArrowRight /> العودة للمجلدات
                                            </button>
                                            <div className="flex items-center gap-4 border-b border-white/5 pb-4">
                                                {selectedSolutionFolder.cover_image ? <img src={selectedSolutionFolder.cover_image} className="w-14 h-14 rounded-xl object-cover border border-white/10" alt="" /> : <FaFolder className="text-4xl text-yellow-500" />}
                                                <h3 className="text-2xl font-black text-white">{selectedSolutionFolder.title}</h3>
                                            </div>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                                {(() => {
                                                    // تصحيح منطق استرجاع الملفات من النسخة
                                                    const folderId = selectedSolutionFolder.id;
                                                    const contents = (Array.isArray(data.folder_contents) ? data.folder_contents : []).filter(c => c.folder_id === folderId);
                                                    const libFiles = (Array.isArray(data.library_files) ? data.library_files : []);
                                                    
                                                    const folderFiles = contents.map(c => {
                                                        const f = libFiles.find(lf => lf.id === c.file_id);
                                                        return f ? { ...f, name: f.file_name, url: f.file_data } : null;
                                                    }).filter(Boolean);

                                                    return folderFiles.length > 0 ? folderFiles.map((file, idx) => (
                                                        <div key={idx} className="group bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden hover:border-blue-500 shadow-xl transition-all">
                                                            <div className="aspect-video bg-slate-950 flex items-center justify-center relative">
                                                                {file.file_type?.includes('pdf') || file.name?.toLowerCase().endsWith('.pdf') ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <FaFilePdf size={40} className="text-red-500" />
                                                                        <span className="text-[10px] text-gray-500 mt-2 font-bold uppercase">PDF DOCUMENT</span>
                                                                    </div>
                                                                ) : (
                                                                    <img src={file.url} className="w-full h-full object-cover" alt="" />
                                                                )}
                                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <a href={file.url} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md p-3 rounded-full text-white border border-white/20 shadow-lg"><FaEye /></a>
                                                                </div>
                                                            </div>
                                                            <div className="p-4">
                                                                <p className="text-xs font-bold text-gray-200 truncate">{file.name}</p>
                                                            </div>
                                                        </div>
                                                    )) : <div className="col-span-full py-20 text-center text-gray-600 italic">لا توجد ملفات في هذا المجلد.</div>;
                                                })()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {getBookSolutionFolders().map((folder, idx) => (
                                                <div 
                                                    key={idx}
                                                    onClick={() => setSelectedSolutionFolder(folder)}
                                                    className="bg-slate-800/40 border border-slate-700 rounded-[2rem] p-6 hover:border-blue-500 cursor-pointer transition-all shadow-xl group"
                                                >
                                                    <div className="flex justify-between items-start mb-6">
                                                        {folder.cover_image ? <img src={folder.cover_image} className="w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-lg" alt="" /> : <FaFolder className="text-5xl text-yellow-500 group-hover:text-yellow-400 transition-colors" />}
                                                        <span className="bg-slate-950 text-gray-500 text-[10px] px-3 py-1 rounded-full border border-white/5 font-bold uppercase tracking-widest">مجلد حلول</span>
                                                    </div>
                                                    <h3 className="text-lg font-black text-white group-hover:text-blue-400 transition-colors">{folder.title}</h3>
                                                </div>
                                            ))}
                                            {getBookSolutionFolders().length === 0 && <div className="col-span-full py-20 text-center text-gray-600 italic">لا توجد مجلدات حلول متاحة لهذا الفصل/الصف.</div>}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- شاشة ملف إنجاز المعلم (تصميم المجلدات مع أيقونات PDF) --- */}
                            {activeTab === 'teacherPortfolio' && (
                                <div className="space-y-10">
                                    {Array.isArray(data.categories) && data.categories.length > 0 ? (
                                        data.categories.map((cat, cIdx) => (
                                            <div key={cIdx} className="space-y-6">
                                                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                                    <FaFolderOpen className="text-blue-400 text-2xl" />
                                                    <h2 className="text-xl md:text-2xl font-black text-white">{cat.name}</h2>
                                                </div>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    {(Array.isArray(data.files) ? data.files : []).filter(f => f.category_id === cat.id).map((file, fIdx) => (
                                                        <div key={fIdx} className="group bg-slate-800/40 border border-slate-700 rounded-3xl overflow-hidden hover:border-blue-500 shadow-xl transition-all">
                                                            <div className="aspect-square bg-slate-950 flex items-center justify-center relative">
                                                                {(file.type?.includes('pdf') || (file.name || file.file_name || "").toLowerCase().endsWith('.pdf')) ? (
                                                                    <div className="flex flex-col items-center">
                                                                        <FaFilePdf size={60} className="text-red-500/80 drop-shadow-[0_0_15px_rgba(239,68,68,0.3)]" />
                                                                        <span className="text-[10px] text-slate-500 mt-3 font-black tracking-widest uppercase">PDF DOCUMENT</span>
                                                                    </div>
                                                                ) : (
                                                                    <img src={file.url || file.file_url} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" alt="" />
                                                                )}
                                                                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                    <a href={file.url || file.file_url} target="_blank" rel="noreferrer" className="bg-white/10 backdrop-blur-md p-4 rounded-full text-white border border-white/20 shadow-lg scale-75 group-hover:scale-100 transition-all"><FaEye size={20} /></a>
                                                                </div>
                                                            </div>
                                                            <div className="p-4 bg-slate-900/80 border-t border-white/5">
                                                                <p className="text-xs font-bold text-gray-200 truncate text-center">{file.name || file.file_name}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {(!Array.isArray(data.files) || !data.files.some(f => f.category_id === cat.id)) && (
                                                        <div className="col-span-full py-12 text-center bg-slate-800/20 rounded-2xl border border-dashed border-white/5 text-gray-600 italic">هذا القسم فارغ حالياً.</div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : <div className="text-center py-20 text-gray-600 italic">لا توجد تصنيفات في ملف إنجاز المعلم.</div>}
                                </div>
                            )}

                            {/* --- شاشة المناهج --- */}
                            {activeTab === 'curriculum' && (
                                <div className="space-y-8">
                                    <div className="flex justify-center mb-6">
                                        <div className="flex bg-gray-950 p-1 rounded-2xl border border-white/5 shadow-2xl">
                                            <button onClick={() => setViewPeriod('period1')} className={`px-4 md:px-8 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all ${viewPeriod === 'period1' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-gray-300'}`}>الفترة الأولى</button>
                                            <button onClick={() => setViewPeriod('period2')} className={`px-4 md:px-8 py-2 rounded-xl text-[10px] md:text-xs font-black transition-all ${viewPeriod === 'period2' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-gray-500 hover:text-gray-300'}`}>الفترة الثانية</button>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <h3 className="text-lg md:text-xl font-black text-blue-400 flex items-center gap-3"><FaQuran /> منهج القرآن</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredCurriculum.standard.length > 0 ? filteredCurriculum.standard.map((item, idx) => (
                                                <div key={idx} className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 shadow-xl hover:border-blue-500/30 transition-all">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="bg-blue-600/20 text-blue-400 text-[9px] px-2.5 py-1 rounded-lg font-black uppercase">{item.type === 'recitation' ? 'تلاوة' : 'حفظ'}</span>
                                                        <span className="text-gray-500 text-[9px] font-bold italic">أسبوع {item.week_number}</span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-xs md:text-sm mb-2">{item.surah_name || item.name}</h4>
                                                    <p className="text-[9px] text-gray-500 line-clamp-2">الآيات: {item.verses || 'محددة'}</p>
                                                </div>
                                            )) : <div className="col-span-full py-10 text-center text-gray-600 italic">لا توجد دروس.</div>}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-lg md:text-xl font-black text-green-400 flex items-center gap-3"><FaClipboardList /> الواجبات والمهام</h3>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {filteredCurriculum.homework.length > 0 ? filteredCurriculum.homework.map((item, idx) => (
                                                <div key={idx} className="bg-slate-800/40 p-5 rounded-3xl border border-white/5 shadow-xl hover:border-green-500/30 transition-all">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className={`text-[9px] px-2.5 py-1 rounded-lg font-black uppercase ${item.type === 'homework' ? 'bg-green-600/20 text-green-400' : 'bg-purple-600/20 text-purple-400'}`}>
                                                            {item.type === 'homework' ? 'واجب' : item.type === 'performanceTask' ? 'مهمة' : 'اختبار'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-white font-bold text-xs md:text-sm mb-2">{item.name}</h4>
                                                    <div className="flex gap-2 mt-2">
                                                        <span className="bg-gray-950 text-gray-500 text-[8px] px-2 py-0.5 rounded border border-white/5">درجة: {item.max_score}</span>
                                                    </div>
                                                </div>
                                            )) : <div className="col-span-full py-10 text-center text-gray-600 italic">لا توجد مهام.</div>}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* --- شاشة المحادثات --- */}
                            {activeTab === 'messages' && (
                                <div className="flex flex-col md:flex-row h-full rounded-[2.5rem] overflow-hidden border border-white/5 bg-gray-950/30 shadow-2xl min-h-[500px]">
                                    <div className={`w-full md:w-1/3 border-l border-white/5 bg-slate-900/40 flex flex-col ${selectedChatStudent ? 'hidden md:flex' : 'flex'}`}>
                                        <div className="p-5 border-b border-white/5">
                                            <h4 className="text-white font-black text-sm mb-4">طلاب الصف</h4>
                                            <div className="bg-gray-950 rounded-xl px-4 py-2 border border-white/5 flex items-center gap-3">
                                                <FaSearch className="text-gray-600" />
                                                <input type="text" placeholder="بحث..." className="bg-transparent border-none outline-none text-xs text-white w-full font-bold" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                                            {filteredStudents.map((student, idx) => (
                                                <button 
                                                    key={idx}
                                                    onClick={() => setSelectedChatStudent(student)}
                                                    className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${selectedChatStudent?.id === student.id ? 'bg-blue-600 text-white shadow-xl' : 'hover:bg-white/5 text-gray-400'}`}
                                                >
                                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 flex-shrink-0">
                                                        {student.photo ? <img src={student.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-900 flex items-center justify-center text-[10px]">{student.name[0]}</div>}
                                                    </div>
                                                    <div className="text-right flex-1 truncate">
                                                        <p className={`text-xs font-bold truncate ${selectedChatStudent?.id === student.id ? 'text-white' : 'text-gray-200'}`}>{student.name}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className={`flex-1 flex flex-col bg-[#0b1120] relative ${!selectedChatStudent ? 'hidden md:flex' : 'flex'}`}>
                                        {selectedChatStudent ? (
                                            <>
                                                <div className="p-5 bg-slate-900/60 border-b border-white/5 flex items-center gap-4">
                                                    <button onClick={() => setSelectedChatStudent(null)} className="md:hidden text-white p-2 bg-gray-800 rounded-lg"><FaChevronRight /></button>
                                                    <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden">
                                                        <img src={selectedChatStudent.photo || '/images/1.webp'} alt="" className="w-full h-full object-cover" />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-white font-black text-sm">{selectedChatStudent.name}</h4>
                                                        <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest">محادثة مؤرشفة</p>
                                                    </div>
                                                </div>
                                                <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-6 custom-scrollbar">
                                                    {(Array.isArray(data.messages) ? data.messages : [])
                                                        .filter(m => m.student_id === selectedChatStudent.id)
                                                        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                                                        .map((msg, idx) => {
                                                            const isTeacher = msg.sender_type === 'teacher';
                                                            return (
                                                                <div key={idx} className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
                                                                    <div className={`max-w-[85%] md:max-w-[70%] p-4 md:p-5 rounded-3xl relative shadow-2xl border ${isTeacher ? 'bg-blue-600 text-white rounded-tl-sm border-blue-500' : 'bg-slate-900 text-gray-200 rounded-tr-sm border-white/5'}`}>
                                                                        <p className="text-xs md:text-sm leading-relaxed">{msg.content}</p>
                                                                        <div className="flex items-center justify-end gap-2 mt-3 opacity-50 text-[8px] font-bold">
                                                                            <span>{formatHijriDate(msg.created_at)}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    }
                                                    {(!Array.isArray(data.messages) || !data.messages.some(m => m.student_id === selectedChatStudent.id)) && (
                                                        <div className="h-full flex flex-col items-center justify-center text-gray-700 gap-6 opacity-30">
                                                            <FaComments size={64} />
                                                            <p className="text-sm italic font-bold">لا توجد رسائل مؤرشفة لهذا الطالب.</p>
                                                        </div>
                                                    )}
                                                    <div ref={chatEndRef} />
                                                </div>
                                            </>
                                        ) : (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-800 gap-6 opacity-20">
                                                <FaComments size={100} />
                                                <p className="text-2xl font-black uppercase tracking-[0.3em]">اختر طالباً للمحادثة</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* --- شاشة الملخص --- */}
                            {activeTab === 'summary' && (
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { label: 'طلاب', count: (Array.isArray(data.students) ? data.students.length : 0), icon: <FaUserGraduate />, color: 'text-blue-400' },
                                        { label: 'دروس', count: (Array.isArray(data.curriculum) ? data.curriculum.length : 0), icon: <FaQuran />, color: 'text-purple-400' },
                                        { label: 'ملفات', count: (Array.isArray(data.files) ? data.files.length : 0) + (Array.isArray(data.portfolio_files) ? data.portfolio_files.length : 0), icon: <FaFolderOpen />, color: 'text-amber-400' },
                                        { label: 'رسائل', count: (Array.isArray(data.messages) ? data.messages.length : 0), icon: <FaComments />, color: 'text-teal-400' },
                                    ].map((stat, idx) => (
                                        <div key={idx} className="bg-slate-900/40 border border-white/5 p-8 md:p-12 rounded-[3rem] text-center shadow-2xl hover:bg-white/5 transition-all">
                                            <div className={`text-4xl md:text-6xl ${stat.color} mb-4 flex justify-center`}>{stat.icon}</div>
                                            <div className="text-3xl md:text-5xl font-black text-white mb-2">{stat.count}</div>
                                            <div className="text-gray-500 text-[9px] md:text-[11px] font-bold uppercase tracking-widest">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* نافذة ملف الطالب الشامل (Grades View) */}
                {viewingStudent && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-2 md:p-10 bg-black/98 backdrop-blur-3xl" dir="rtl">
                        <div className="bg-[#0f172a] border border-white/10 w-full max-w-6xl h-[94vh] rounded-[3.5rem] shadow-2xl overflow-hidden flex flex-col">
                            <div className="p-6 md:p-10 bg-slate-900 border-b border-white/5 flex justify-between items-center">
                                <div className="flex items-center gap-4 md:gap-8">
                                    <div className="relative">
                                        <img src={viewingStudent.photo || viewingStudent.image_url || '/images/1.webp'} alt="" className="w-20 h-20 md:w-32 md:h-32 rounded-3xl object-cover border-4 border-slate-800 shadow-2xl" />
                                    </div>
                                    <div className="text-white">
                                        <h3 className="text-lg md:text-4xl font-black mb-2 tracking-tight truncate max-w-[200px] md:max-w-none">{viewingStudent.name}</h3>
                                        <p className="text-[10px] md:text-[12px] font-bold text-gray-500 uppercase tracking-[0.2em]">
                                            الصف {viewingStudent.grade_level || viewingStudent.grade} - شعبة {viewingStudent.section || viewingStudent.className}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => setViewingStudent(null)} className="p-3 md:p-5 bg-slate-800 hover:bg-red-500/20 text-white rounded-2xl transition border border-white/5"><FaTimes size={20} /></button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar bg-[#0f172a]">
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
                                        <div className="space-y-8 md:space-y-12">
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                <div className="bg-slate-900/60 p-6 md:p-10 rounded-[2.5rem] border-b-8 border-green-500 shadow-2xl text-center">
                                                    <p className="text-gray-500 text-[10px] font-black mb-3 uppercase tracking-widest">المجموع النهائي</p>
                                                    <div className="text-3xl md:text-5xl font-black text-green-400">{grandTotal}</div>
                                                </div>
                                                <div className="bg-slate-900/60 p-6 md:p-10 rounded-[2.5rem] border-b-8 border-yellow-500 shadow-2xl text-center">
                                                    <p className="text-gray-500 text-[10px] font-black mb-3 uppercase tracking-widest">مجموع المهام</p>
                                                    <div className="text-3xl md:text-5xl font-black text-yellow-500">{totalTasks}</div>
                                                </div>
                                                <div className="bg-slate-900/60 p-6 md:p-10 rounded-[2.5rem] border-b-8 border-blue-500 shadow-2xl text-center">
                                                    <p className="text-gray-500 text-[10px] font-black mb-3 uppercase tracking-widest">مجموع الشفهي</p>
                                                    <div className="text-3xl md:text-5xl font-black text-blue-400">{totalOral}</div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="bg-slate-900/30 p-6 md:p-8 rounded-[2.5rem] border border-white/5">
                                                    <SectionHeader title="الاختبارات" icon={FaBookOpen} color="#f87171" score={tests} total="40" />
                                                    <div className="flex gap-3">{(activeGrades.tests || [null, null]).slice(0, 2).map((g, i) => <div key={i} className="flex-1"><GradeBox value={g} color="red" size="lg" /></div>)}</div>
                                                </div>
                                                <div className="bg-slate-900/30 p-6 md:p-8 rounded-[2.5rem] border border-white/5">
                                                    <h4 className="flex items-center gap-3 font-black text-blue-400 mb-6 text-sm md:text-xl border-b border-slate-800 pb-3"><FaQuran /> القرآن الكريم</h4>
                                                    <div className="space-y-4">
                                                        <div className="flex gap-2">{(activeGrades.quranRecitation || [null,null,null,null,null]).slice(0, 5).map((g, i) => <div key={i} className="flex-1"><GradeBox value={g} color="blue" size="sm" /></div>)}</div>
                                                        <div className="flex gap-2">{(activeGrades.quranMemorization || [null,null,null,null,null]).slice(0, 5).map((g, i) => <div key={i} className="flex-1"><GradeBox value={g} color="blue" size="sm" /></div>)}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                            <div className="p-8 md:p-12 border-t border-white/5 bg-slate-900 flex justify-center">
                                <button onClick={() => setViewingStudent(null)} className="w-full md:w-auto px-16 md:px-32 py-4 md:py-6 bg-blue-600 text-white rounded-[2rem] font-black hover:bg-blue-500 transition shadow-2xl text-sm md:text-base">إغلاق الملف</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Main - Responsive */}
                <div className="p-6 md:p-10 border-t border-white/5 bg-slate-950 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-blue-400 bg-blue-400/5 px-8 md:px-12 py-4 md:py-6 rounded-[2.5rem] border border-blue-500/10 text-[10px] md:text-xs font-bold leading-relaxed flex-1 text-center md:text-right">
                        تنبيه: تم تحديث واجهة المعاينة لتطابق الصفحات الأصلية لملفات الإنجاز وحلول الكتب. يمكنك الآن التفاعل مع المجلدات والملفات بنفس الأسلوب المعتاد.
                    </div>
                    <div className="flex gap-4 w-full md:w-auto">
                        <button onClick={onCancel} className="flex-1 md:flex-none px-8 md:px-16 py-4 md:py-6 bg-slate-800 text-gray-300 rounded-2xl md:rounded-[2rem] font-bold hover:bg-slate-700 transition text-sm md:text-base">إلغاء</button>
                        <button onClick={onConfirm} className="flex-1 md:flex-none px-10 md:px-20 py-4 md:py-6 bg-blue-600 text-white rounded-2xl md:rounded-[2rem] font-black hover:bg-blue-500 transition shadow-2xl text-sm md:text-base">تأكيد الاسترجاع</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackupPreviewer;
