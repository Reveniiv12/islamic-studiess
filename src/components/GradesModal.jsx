import React, { useState, useEffect } from "react";
// تأكد من أن المكتبة مثبتة أو استبدل الأيقونات بصور/نصوص إذا لم تكن موجودة
// import { FaClock } from "react-icons/fa"; 

// دالة تحويل الأرقام
const convertToEnglishNumbers = (input) => {
    if (input === null || input === undefined) {
        return null;
    }
    const arabicNumbers = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
    const englishNumbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let output = String(input);
    for (let i = 0; i < arabicNumbers.length; i++) {
        output = output.replace(new RegExp(arabicNumbers[i], "g"), englishNumbers[i]);
    }
    return output;
};

// ----------------------------------------------------------------------
// المكون المُذَكَّر (Memoized Component) لصف الطالب الواحد
// ----------------------------------------------------------------------

const StudentRowComponent = ({ 
    student, 
    activeTab, 
    handleGradeChange, 
    calculateCategoryScore, 
    selectedStudents, 
    toggleStudentSelection,
    inputCount,
    curriculum,           
    homeworkCurriculum    
}) => {

    const isSelected = selectedStudents.includes(student.id);

    const checkCurriculumExists = (category, index) => {
        if (category === 'classInteraction' || category === 'participation') {
            return true; 
        }

        let items = [];
        const safeCurriculum = Array.isArray(curriculum) ? curriculum : [];
        const safeHomework = Array.isArray(homeworkCurriculum) ? homeworkCurriculum : [];

        if (category === 'quranRecitation') {
            items = safeCurriculum.filter(c => c.type === 'recitation');
        } else if (category === 'quranMemorization') {
            items = safeCurriculum.filter(c => c.type === 'memorization');
        } else if (category === 'homework') {
            items = safeHomework.filter(c => c.type === 'homework');
        } else if (category === 'performanceTasks') {
            items = safeHomework.filter(c => c.type === 'performanceTask');
        } else if (category === 'tests') {
            items = safeHomework.filter(c => c.type === 'test');
        }

        return index < items.length;
    };

    const renderGradeInputs = (category, color, count) => {
        return Array(count).fill(0).map((_, i) => {
            const hasCurriculum = checkCurriculumExists(category, i);
            
            const inputStyle = hasCurriculum 
                ? `bg-white/10 text-white focus:ring-${color}-500 border-transparent hover:bg-white/20`
                : `bg-black/50 text-gray-500 border border-gray-800 focus:ring-gray-600 cursor-default placeholder-gray-700`;

            const titleText = hasCurriculum ? "" : "لا يوجد منهج محدد لهذا البند";

            return (
                <td key={`${category}_input_${student.id}_${i}`} className="p-1 whitespace-nowrap text-sm text-center border-l border-r border-gray-600">
                    <input
                        type="text"
                        inputMode="decimal"
                        title={titleText}
                        value={student.grades[category]?.[i] ?? ''} 
                        onChange={(e) => handleGradeChange(student.id, category, i, e.target.value)}
                        className={`w-10 p-1 text-base md:text-sm text-center rounded focus:outline-none focus:ring-2 transition-all duration-200 ${inputStyle}`}
                    />
                </td>
            );
        });
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'tests':
                return (
                    <React.Fragment>
                        {renderGradeInputs('tests', 'blue', 2)}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                            {calculateCategoryScore(student, 'tests')}
                        </td>
                    </React.Fragment>
                );
            case 'classInteraction':
                return (
                    <React.Fragment>
                        {renderGradeInputs('classInteraction', 'yellow', 4)}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                            {calculateCategoryScore(student, 'classInteraction')}
                        </td>
                    </React.Fragment>
                );
            case 'homework':
                return (
                    <React.Fragment>
                        {renderGradeInputs('homework', 'purple', 10)}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                            {calculateCategoryScore(student, 'homework')}
                        </td>
                    </React.Fragment>
                );
            case 'performanceTasks':
                return (
                    <React.Fragment>
                        {renderGradeInputs('performanceTasks', 'orange', 4)}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                            {calculateCategoryScore(student, 'performanceTasks')}
                        </td>
                    </React.Fragment>
                );
            case 'participation':
                return (
                    <React.Fragment>
                        {renderGradeInputs('participation', 'cyan', 10)}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                            {calculateCategoryScore(student, 'participation')}
                        </td>
                    </React.Fragment>
                );
            case 'quranRecitation':
                return (
                    <React.Fragment>
                        {renderGradeInputs('quranRecitation', 'indigo', 5)}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                            {calculateCategoryScore(student, 'quranRecitation')}
                        </td>
                    </React.Fragment>
                );
            case 'quranMemorization':
                return (
                    <React.Fragment>
                        {renderGradeInputs('quranMemorization', 'emerald', 5)}
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-400">
                            {calculateCategoryScore(student, 'quranMemorization')}
                        </td>
                    </React.Fragment>
                );
            default:
                return null;
        }
    };

    return (
        <tr className={`transition-colors group ${isSelected ? 'bg-blue-900/20' : 'hover:bg-gray-700'}`}>
            <td 
                // جعل الخلية بالكامل قابلة للنقر للتحديد
                onClick={() => toggleStudentSelection(student.id)}
                className="px-2 md:px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-100 sticky right-0 bg-gray-800 text-right group-hover:bg-gray-750 z-10 border-l border-gray-600 cursor-pointer select-none"
            >
                <div className="flex items-center gap-3">
                    {/* تم إزالة الـ Checkbox واستبداله بمنطق الصورة */}
                    <div className="relative">
                        <img 
                            src={student.photo || '/images/1.webp'} 
                            alt={student.name} 
                            className={`w-10 h-10 rounded-full object-cover transition-all duration-300 ${isSelected ? 'ring-4 ring-green-500 scale-110' : 'border border-gray-600 opacity-80'}`}
                        />
                        {isSelected && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full w-4 h-4 flex items-center justify-center border border-white">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <span className={`whitespace-nowrap text-xs md:text-sm font-bold transition-colors ${isSelected ? 'text-green-400' : 'text-gray-100'}`}>
                        {student.name}
                    </span>
                </div>
            </td>
            {renderContent()}
        </tr>
    );
};

const MemoizedStudentRow = React.memo(StudentRowComponent);

// ----------------------------------------------------------------------
// المكون الرئيسي GradesModal
// ----------------------------------------------------------------------

const GradesModal = ({
    students,
    onClose,
    onSave,
    curriculum = [],         
    homeworkCurriculum = [], 
    testCalculationMethod: propTestCalculationMethod,
    onTestCalculationMethodChange
}) => {
    
    const initialTabs = ['tests', 'homework', 'performanceTasks', 'participation', 'quranRecitation', 'quranMemorization', 'classInteraction'];
    
    const [activeTab, setActiveTab] = useState('tests');
    const [modalStudents, setModalStudents] = useState(students);
    const [testCalculationMethod, setTestCalculationMethod] = useState(propTestCalculationMethod);
    
    const [searchQueries, setSearchQueries] = useState(
        initialTabs.reduce((acc, tab) => ({ ...acc, [tab]: '' }), {})
    );

    const [selectedStudentsPerTab, setSelectedStudentsPerTab] = useState(
        initialTabs.reduce((acc, tab) => ({ ...acc, [tab]: [] }), {})
    );

    const [batchGrade, setBatchGrade] = useState('');
    
    const [homeworkIndex, setHomeworkIndex] = useState(0);
    const [testIndex, setTestIndex] = useState(0);
    const [performanceTaskIndex, setPerformanceTaskIndex] = useState(0);
    const [recitationIndex, setRecitationIndex] = useState(0);
    const [memorizationIndex, setMemorizationIndex] = useState(0);
    const [classInteractionIndex, setClassInteractionIndex] = useState(0);
    
    const [filteredStudents, setFilteredStudents] = useState(students);

    const [customDialog, setCustomDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
    });

    useEffect(() => {
        setModalStudents(students);
        setFilteredStudents(students);
    }, [students]);

    useEffect(() => {
        setTestCalculationMethod(propTestCalculationMethod);
    }, [propTestCalculationMethod]);

    useEffect(() => {
        const currentSearchQuery = searchQueries[activeTab] || '';
        if (currentSearchQuery.trim() === '') {
            setFilteredStudents(modalStudents);
        } else {
            const newFilteredStudents = modalStudents.filter(student =>
                student.name.toLowerCase().includes(currentSearchQuery.toLowerCase())
            );
            setFilteredStudents(newFilteredStudents);
        }
    }, [searchQueries, modalStudents, activeTab]);

    const handleTabChange = (tab) => {
        setSearchQueries(prev => ({ ...prev, [activeTab]: '' }));
        setBatchGrade('');
        setSelectedStudentsPerTab(prev => ({ ...prev, [activeTab]: [] }));
        setFilteredStudents(modalStudents);

        if (tab === 'tests') { setTestIndex(0); } 
        else if (tab === 'homework') { setHomeworkIndex(0); } 
        else if (tab === 'performanceTasks') { setPerformanceTaskIndex(0); } 
        else if (tab === 'quranRecitation') { setRecitationIndex(0); } 
        else if (tab === 'quranMemorization') { setMemorizationIndex(0); } 
        else if (tab === 'classInteraction') { setClassInteractionIndex(0); }

        setActiveTab(tab);
    };

    const handleSearchChange = (e) => {
        setSearchQueries(prev => ({ ...prev, [activeTab]: e.target.value }));
    };

    const handleGradeChange = React.useCallback((studentId, category, index, value) => {
        const englishValue = convertToEnglishNumbers(value);
        const numericValue = englishValue === '' ? null : Number(englishValue);
        
        let maxLimit = 0;
        let errorMessage = '';

        switch(category) {
            case 'tests': maxLimit = 20; errorMessage = "خطأ: درجة الاختبار لا يمكن أن تتجاوز 20."; break;
            case 'classInteraction': maxLimit = 10; errorMessage = "خطأ: درجة التفاعل الصفي لا يمكن أن تتجاوز 10."; break;
            case 'homework': maxLimit = 1; errorMessage = "خطأ: درجة الواجب لا يمكن أن تتجاوز 1."; break;
            case 'performanceTasks': maxLimit = 10; errorMessage = "خطأ: درجة المهمة الأدائية لا يمكن أن تتجاوز 10."; break;
            case 'participation': maxLimit = 1; errorMessage = "خطأ: درجة المشاركة لا يمكن أن تتجاوز 1."; break;
            case 'quranRecitation': maxLimit = 10; errorMessage = "خطأ: درجة تلاوة القرآن لا يمكن أن تتجاوز 10."; break;
            case 'quranMemorization': maxLimit = 10; errorMessage = "خطأ: درجة حفظ القرآن لا يمكن أن تتجاوز 10."; break;
            default: break;
        }

        if (numericValue !== null && (numericValue > maxLimit || numericValue < 0)) {
            setCustomDialog({
                isOpen: true,
                title: 'خطأ في إدخال الدرجة',
                message: errorMessage
            });
            return;
        }

        setModalStudents(prevStudents =>
            prevStudents.map(student => {
                if (student.id === studentId) {
                    const newGrades = [...(student.grades[category] || [])];
                    newGrades[index] = value === '' ? null : numericValue;
                    return {
                        ...student,
                        grades: {
                            ...student.grades,
                            [category]: newGrades,
                        },
                    };
                }
                return student;
            })
        );
    }, [setCustomDialog]);

    const calculateCategoryScore = React.useCallback((student, category) => {
        if (!student.grades || !student.grades[category]) return 0;
        const grades = student.grades[category].filter(g => g !== null && g !== undefined && g !== '');
        if (grades.length === 0) return 0;
        const sum = grades.reduce((acc, curr) => acc + curr, 0);

        if (category === 'tests') { return sum.toFixed(2); }
        if (category === 'classInteraction' || category === 'performanceTasks') { return Math.max(...grades).toFixed(2); }
        if (category === 'quranRecitation' || category === 'quranMemorization') { return (sum / grades.length).toFixed(2); }
        return sum.toFixed(2);
    }, []);

    const toggleSelectAll = () => {
        if (selectedStudentsPerTab[activeTab].length === filteredStudents.length) {
            setSelectedStudentsPerTab(prev => ({ ...prev, [activeTab]: [] }));
        } else {
            const allStudentIds = filteredStudents.map(student => student.id);
            setSelectedStudentsPerTab(prev => ({ ...prev, [activeTab]: allStudentIds }));
        }
    };

    const toggleStudentSelection = React.useCallback((studentId) => {
        setSelectedStudentsPerTab(prev => {
            const newSelected = prev[activeTab].includes(studentId)
                ? prev[activeTab].filter(id => id !== studentId)
                : [...prev[activeTab], studentId];
            return { ...prev, [activeTab]: newSelected };
        });
    }, [activeTab]);

    const handleBatchGradeChange = (e) => {
        setBatchGrade(e.target.value);
    };

    const applyBatchGrade = () => {
        const englishBatchGrade = convertToEnglishNumbers(batchGrade);
        const batchNumericValue = englishBatchGrade !== '' ? Number(englishBatchGrade) : null;
        let maxLimit = 0;
        let errorMessage = '';

        switch(activeTab) {
            case 'tests': maxLimit = 20; errorMessage = "خطأ: درجة الاختبار لا يمكن أن تتجاوز 20."; break;
            case 'classInteraction': maxLimit = 10; errorMessage = "خطأ: درجة التفاعل الصفي لا يمكن أن تتجاوز 10."; break;
            case 'homework': maxLimit = 1; errorMessage = "خطأ: درجة الواجب لا يمكن أن تتجاوز 1."; break;
            case 'performanceTasks': maxLimit = 10; errorMessage = "خطأ: درجة المهمة الأدائية لا يمكن أن تتجاوز 10."; break;
            case 'participation': maxLimit = 1; errorMessage = "خطأ: درجة المشاركة لا يمكن أن تتجاوز 1."; break;
            case 'quranRecitation': maxLimit = 10; errorMessage = "خطأ: درجة تلاوة القرآن لا يمكن أن تتجاوز 10."; break;
            case 'quranMemorization': maxLimit = 10; errorMessage = "خطأ: درجة حفظ القرآن لا يمكن أن تتجاوز 10."; break;
            default: break;
        }

        if (batchNumericValue !== null && (batchNumericValue > maxLimit || batchNumericValue < 0)) {
            setCustomDialog({ isOpen: true, title: 'خطأ في إدخال الدرجة', message: errorMessage });
            return;
        }

        setModalStudents(prevStudents =>
            prevStudents.map(student => {
                if (selectedStudentsPerTab[activeTab].includes(student.id)) {
                    const newGrades = [...(student.grades[activeTab] || [])];
                    let updated = false;
                    let indexToUpdate;
                    if (activeTab === 'tests') indexToUpdate = testIndex;
                    else if (activeTab === 'homework') indexToUpdate = homeworkIndex;
                    else if (activeTab === 'performanceTasks') indexToUpdate = performanceTaskIndex;
                    else if (activeTab === 'quranRecitation') indexToUpdate = recitationIndex;
                    else if (activeTab === 'quranMemorization') indexToUpdate = memorizationIndex;
                    else if (activeTab === 'classInteraction') indexToUpdate = classInteractionIndex;

                    if (indexToUpdate !== undefined && indexToUpdate !== -1) {
                        newGrades[indexToUpdate] = batchNumericValue;
                        updated = true;
                    } else if (activeTab === 'participation') {
                        const emptyIndex = newGrades.findIndex(grade => grade === null || grade === undefined || grade === '');
                        if (emptyIndex !== -1) { newGrades[emptyIndex] = batchNumericValue; updated = true; }
                    }
                    
                    if (updated) {
                        return { ...student, grades: { ...student.grades, [activeTab]: newGrades } };
                    }
                }
                return student;
            })
        );
    };

    const handleSave = () => {
        onSave(modalStudents);
        onClose();
    };

    const CustomDialog = ({ isOpen, title, message, onClose }) => {
        if (!isOpen) return null;
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100] px-4">
                <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md text-center">
                    <h3 className="text-xl font-bold text-red-400 mb-4">{title}</h3>
                    <p className="text-gray-300 mb-6">{message}</p>
                    <button onClick={onClose} className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition">فهمت</button>
                </div>
            </div>
        );
    };

    const renderStudentsTableBody = (category, count) => (
        <tbody className="bg-gray-800 divide-y divide-gray-700">
            {filteredStudents.map(student => (
                <MemoizedStudentRow 
                    key={student.id} 
                    student={student} 
                    activeTab={category} 
                    handleGradeChange={handleGradeChange}
                    calculateCategoryScore={calculateCategoryScore}
                    selectedStudents={selectedStudentsPerTab[category]}
                    toggleStudentSelection={toggleStudentSelection}
                    inputCount={count}
                    curriculum={curriculum}
                    homeworkCurriculum={homeworkCurriculum}
                />
            ))}
        </tbody>
    );

    // مكون لرأس الجدول مع زر "تحديد الكل"
    const TableHeaderCell = ({ title, children }) => {
        const isAllSelected = selectedStudentsPerTab[activeTab].length > 0 && selectedStudentsPerTab[activeTab].length === filteredStudents.length;
        
        return (
            <thead className="bg-gray-700 sticky top-0 z-30 shadow-md">
                <tr>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider sticky right-0 bg-gray-700 z-20 whitespace-nowrap border-l border-gray-600">
                        {/* زر تحديد الكل بدلاً من المربع */}
                        <div 
                            onClick={toggleSelectAll}
                            className={`flex items-center gap-2 cursor-pointer select-none p-1 rounded ${isAllSelected ? 'text-green-400' : 'text-gray-100 hover:text-white'}`}
                        >
                            <span className="font-extrabold text-sm">
                                {isAllSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                            </span>
                             {/* أيقونة بسيطة للتوضيح */}
                             <div className={`w-4 h-4 rounded-full border border-current flex items-center justify-center ${isAllSelected ? 'bg-green-500 border-green-500 text-white' : ''}`}>
                                {isAllSelected && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                             </div>
                        </div>
                    </th>
                    {children}
                    <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 whitespace-nowrap">المجموع </th>
                </tr>
            </thead>
        );
    };


    const renderTests = () => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="mb-2">
                <input
                    type="text"
                    inputMode="text"
                    placeholder="ابحث عن طالب..."
                    value={searchQueries.tests}
                    onChange={handleSearchChange}
                    className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="batch-test-index" className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        اختبار رقم:
                    </label>
                    <select
                        id="batch-test-index"
                        value={testIndex}
                        onChange={(e) => setTestIndex(Number(e.target.value))}
                        className="w-16 p-1 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="0">1</option>
                        <option value="1">2</option>
                    </select>
                </div>
                <input
                    type="text"
                    inputMode="numeric"
                    value={batchGrade}
                    onChange={handleBatchGradeChange}
                    className="w-24 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={applyBatchGrade}
                    disabled={selectedStudentsPerTab.tests.length === 0}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-500 transition-colors font-bold disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto mt-2 md:mt-0"
                >
                    تطبيق الدرجة
                </button>
            </div>
            {/* تم جعل هذا القسم flex-1 ليأخذ باقي المساحة ويسمح بالتمرير داخله فقط */}
            <div className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-gray-800" dir="rtl">
                <table className="w-full divide-y divide-gray-700">
                    <TableHeaderCell>
                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600 whitespace-nowrap">اختبار 1 </th>
                        <th scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600 whitespace-nowrap">اختبار 2 </th>
                    </TableHeaderCell>
                    {renderStudentsTableBody('tests', 2)}
                </table>
            </div>
        </div>
    );
    
    const renderClassInteraction = () => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="mb-2">
                <input
                    type="text"
                    inputMode="text"
                    placeholder="ابحث عن طالب..."
                    value={searchQueries.classInteraction}
                    onChange={handleSearchChange}
                    className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="batch-classInteraction-index" className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        تفاعل رقم:
                    </label>
                    <select
                        id="batch-classInteraction-index"
                        value={classInteractionIndex}
                        onChange={(e) => setClassInteractionIndex(Number(e.target.value))}
                        className="w-16 p-1 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                        {[...Array(4)].map((_, i) => (
                            <option key={i} value={i}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    inputMode="numeric"
                    value={batchGrade}
                    onChange={handleBatchGradeChange}
                    className="w-24 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
                <button
                    onClick={applyBatchGrade}
                    disabled={selectedStudentsPerTab.classInteraction.length === 0}
                    className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-500 transition-colors font-bold disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto mt-2 md:mt-0"
                >
                    تطبيق الدرجة
                </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-gray-800" dir="rtl">
                <table className="w-full divide-y divide-gray-700">
                    <TableHeaderCell>
                        {[...Array(4)].map((_, i) => (
                            <th key={`classInteraction_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600 whitespace-nowrap">تفاعل {i + 1} </th>
                        ))}
                    </TableHeaderCell>
                    {renderStudentsTableBody('classInteraction', 4)}
                </table>
            </div>
        </div>
    );


    const renderHomework = () => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="mb-2">
                <input
                    type="text"
                    inputMode="text"
                    placeholder="ابحث عن طالب..."
                    value={searchQueries.homework}
                    onChange={handleSearchChange}
                    className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="batch-homework-index" className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        واجب رقم:
                    </label>
                    <select
                        id="batch-homework-index"
                        value={homeworkIndex}
                        onChange={(e) => setHomeworkIndex(Number(e.target.value))}
                        className="w-16 p-1 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        {[...Array(10)].map((_, i) => (
                            <option key={i} value={i}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    inputMode="numeric"
                    value={batchGrade}
                    onChange={handleBatchGradeChange}
                    className="w-24 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                    onClick={applyBatchGrade}
                    disabled={selectedStudentsPerTab.homework.length === 0}
                    className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-500 transition-colors font-bold disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto mt-2 md:mt-0"
                >
                    تطبيق الدرجة
                </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-gray-800" dir="rtl">
                <table className="w-full divide-y divide-gray-700">
                    <TableHeaderCell>
                        {[...Array(10)].map((_, i) => (
                            <th key={`hw_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600 whitespace-nowrap">واجب {i + 1} </th>
                        ))}
                    </TableHeaderCell>
                    {renderStudentsTableBody('homework', 10)}
                </table>
            </div>
        </div>
    );

    const renderPerformanceTasks = () => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="mb-2">
                <input
                    type="text"
                    inputMode="text"
                    placeholder="ابحث عن طالب..."
                    value={searchQueries.performanceTasks}
                    onChange={handleSearchChange}
                    className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor="batch-pt-index" className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        مهمة رقم:
                    </label>
                    <select
                        id="batch-pt-index"
                        value={performanceTaskIndex}
                        onChange={(e) => setPerformanceTaskIndex(Number(e.target.value))}
                        className="w-16 p-1 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                        {[...Array(4)].map((_, i) => (
                            <option key={i} value={i}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    inputMode="numeric"
                    value={batchGrade}
                    onChange={handleBatchGradeChange}
                    className="w-24 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
                <button
                    onClick={applyBatchGrade}
                    disabled={selectedStudentsPerTab.performanceTasks.length === 0}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-500 transition-colors font-bold disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto mt-2 md:mt-0"
                >
                    تطبيق الدرجة
                </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-gray-800" dir="rtl">
                <table className="w-full divide-y divide-gray-700">
                    <TableHeaderCell>
                        {[...Array(4)].map((_, i) => (
                            <th key={`pt_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600 whitespace-nowrap">مهمة {i + 1} </th>
                        ))}
                    </TableHeaderCell>
                    {renderStudentsTableBody('performanceTasks', 4)}
                </table>
            </div>
        </div>
    );

    const renderParticipation = () => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="mb-2">
                <input
                    type="text"
                    inputMode="text"
                    placeholder="ابحث عن طالب..."
                    value={searchQueries.participation}
                    onChange={handleSearchChange}
                    className="w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <input
                    type="text"
                    inputMode="numeric"
                    value={batchGrade}
                    onChange={handleBatchGradeChange}
                    className="w-24 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
                <button
                    onClick={applyBatchGrade}
                    disabled={selectedStudentsPerTab.participation.length === 0}
                    className="bg-cyan-600 text-white px-4 py-2 rounded-lg hover:bg-cyan-500 transition-colors font-bold disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto mt-2 md:mt-0"
                >
                    تطبيق الدرجة
                </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-gray-800" dir="rtl">
                <table className="w-full divide-y divide-gray-700">
                    <TableHeaderCell>
                         {[...Array(10)].map((_, i) => (
                            <th key={`part_header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600 whitespace-nowrap">مشاركة {i + 1} </th>
                        ))}
                    </TableHeaderCell>
                    {renderStudentsTableBody('participation', 10)}
                </table>
            </div>
        </div>
    );

    const renderQuran = (category, count, label, color, state, setState) => (
        <div className="space-y-4 h-full flex flex-col">
            <div className="mb-2">
                <input
                    type="text"
                    inputMode="text"
                    placeholder="ابحث عن طالب..."
                    value={searchQueries[category]}
                    onChange={handleSearchChange}
                    className={`w-full p-2 border border-gray-600 rounded-lg text-sm bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-${color}-500`}
                />
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2">
                    <label htmlFor={`batch-${category}-index`} className="text-sm font-medium text-gray-400 whitespace-nowrap">
                        {label} رقم:
                    </label>
                    <select
                        id={`batch-${category}-index`}
                        value={state}
                        onChange={(e) => setState(Number(e.target.value))}
                        className={`w-16 p-1 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-${color}-500`}
                    >
                        {[...Array(count)].map((_, i) => (
                            <option key={i} value={i}>{i + 1}</option>
                        ))}
                    </select>
                </div>
                <input
                    type="text"
                    inputMode="numeric"
                    value={batchGrade}
                    onChange={handleBatchGradeChange}
                    className={`w-24 p-2 bg-gray-700 text-white text-center rounded focus:outline-none focus:ring-2 focus:ring-${color}-500`}
                />
                <button
                    onClick={applyBatchGrade}
                    disabled={selectedStudentsPerTab[category].length === 0}
                    className={`bg-${color}-600 text-white px-4 py-2 rounded-lg hover:bg-${color}-500 transition-colors font-bold disabled:bg-gray-500 disabled:cursor-not-allowed w-full md:w-auto mt-2 md:mt-0`}
                >
                    تطبيق الدرجة
                </button>
            </div>
            <div className="flex-1 overflow-auto rounded-lg border border-gray-700 bg-gray-800" dir="rtl">
                <table className="w-full divide-y divide-gray-700">
                    <TableHeaderCell>
                        {[...Array(count)].map((_, i) => (
                            <th key={`header_${i}`} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-400 border-r border-gray-600 whitespace-nowrap">{label} {i + 1} </th>
                        ))}
                    </TableHeaderCell>
                    {renderStudentsTableBody(category, count)}
                </table>
            </div>
        </div>
    );

    const renderContent = () => {
        // نستخدم activeTab كمفتاح لتغيير المكون بالكامل
        switch (activeTab) {
            case 'tests':
                return <React.Fragment key="tests">{renderTests()}</React.Fragment>;
            case 'classInteraction': 
                return <React.Fragment key="classInteraction">{renderClassInteraction()}</React.Fragment>; 
            case 'homework':
                return <React.Fragment key="homework">{renderHomework()}</React.Fragment>;
            case 'performanceTasks':
                return <React.Fragment key="performanceTasks">{renderPerformanceTasks()}</React.Fragment>;
            case 'participation':
                return <React.Fragment key="participation">{renderParticipation()}</React.Fragment>;
            case 'quranRecitation':
                return <React.Fragment key="quranRecitation">{renderQuran('quranRecitation', 5, 'تلاوة', 'indigo', recitationIndex, setRecitationIndex)}</React.Fragment>;
            case 'quranMemorization':
                return <React.Fragment key="quranMemorization">{renderQuran('quranMemorization', 5, 'حفظ', 'emerald', memorizationIndex, setMemorizationIndex)}</React.Fragment>;
            default:
                return null;
        }
    };

    return (
        // استخدام h-[100dvh] لضمان ملء الشاشة بشكل صحيح على الجوال
        <div className="fixed inset-0 bg-gray-900 bg-opacity-95 flex justify-center items-center p-0 md:p-4 z-50 overflow-hidden h-[100dvh]">
            <CustomDialog
                isOpen={customDialog.isOpen}
                title={customDialog.title}
                message={customDialog.message}
                onClose={() => setCustomDialog({ ...customDialog, isOpen: false })}
            />
            
            {/* الهيكل الرئيسي: flex flex-col لضمان توزيع المساحات */}
            <div className="bg-gray-800 rounded-none md:rounded-lg shadow-xl w-full h-full md:h-[90vh] md:max-w-7xl relative flex flex-col" dir="rtl">
                
                {/* 1. رأس النافذة (ثابت) */}
                <div className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-800 flex-shrink-0">
                    <h2 className="text-xl md:text-2xl font-extrabold text-white">إدارة الدرجات</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* 2. شريط التبويبات (ثابت) */}
                <div className="flex flex-nowrap overflow-x-auto justify-start md:justify-center p-2 border-b border-gray-700 bg-gray-800 flex-shrink-0 scrollbar-hide">
                    <button
                        onClick={() => handleTabChange('tests')}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === 'tests' ? "bg-blue-600 text-white rounded-lg" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        الاختبارات 
                    </button>
                    <button
                        onClick={() => handleTabChange('classInteraction')} 
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === 'classInteraction' ? "bg-yellow-600 text-white rounded-lg" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        التفاعل الصفي 
                    </button>
                    <button
                        onClick={() => handleTabChange('homework')}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === 'homework' ? "bg-purple-600 text-white rounded-lg" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        الواجبات 
                    </button>
                    <button
                        onClick={() => handleTabChange('performanceTasks')}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === 'performanceTasks' ? "bg-orange-600 text-white rounded-lg" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        المهام الأدائية 
                    </button>
                    <button
                        onClick={() => handleTabChange('participation')}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === 'participation' ? "bg-cyan-600 text-white rounded-lg" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        المشاركة 
                    </button>
                    <button
                        onClick={() => handleTabChange('quranRecitation')}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === 'quranRecitation' ? "bg-indigo-600 text-white rounded-lg" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        تلاوة القرآن 
                    </button>
                    <button
                        onClick={() => handleTabChange('quranMemorization')}
                        className={`px-4 py-2 text-sm font-medium transition-colors duration-200 whitespace-nowrap flex-shrink-0 ${activeTab === 'quranMemorization' ? "bg-emerald-600 text-white rounded-lg" : "text-gray-400 hover:text-gray-200"}`}
                    >
                        حفظ القرآن 
                    </button>
                </div>
                
                {/* 3. منطقة المحتوى (الجدول) - تأخذ المساحة المتبقية وتمرر داخلياً */}
                <div className="flex-1 overflow-hidden p-4 relative flex flex-col">
                    {renderContent()}
                </div>

                {/* 4. تذييل الصفحة (زر الحفظ) - ثابت في الأسفل دائماً */}
                <div className="p-4 border-t border-gray-700 bg-gray-800 flex-shrink-0 pb-8 md:pb-4">
                    <button onClick={handleSave} className="bg-green-600 text-white w-full md:w-auto px-6 py-4 md:py-3 rounded-lg hover:bg-green-500 transition-colors font-bold text-lg shadow-lg">
                        حفظ التغييرات
                    </button>
                </div>
            </div>
        </div>
    );
};

export default GradesModal;
