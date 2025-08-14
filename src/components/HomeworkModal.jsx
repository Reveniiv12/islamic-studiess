import React, { useState, useEffect } from 'react';
import { FaBookOpen, FaStickyNote, FaSave, FaTimes, FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle } from 'react-icons/fa';
import { getHijriToday, compareHijriDates } from '../utils/recitationUtils';

// Helper function to get the status of homework or performance tasks
const getTaskStatus = (student, taskType, curriculum) => {
    const today = getHijriToday();
    const relevantCurriculum = curriculum
        .filter(c => c.type === taskType)
        .sort((a, b) => compareHijriDates(a.dueDate, b.dueDate));

    const gradesKey = taskType === 'homework' ? 'homework' : 'performanceTasks';
    const gradesArray = student.grades[gradesKey] || [];

    // Check if any task is pending
    const nextPartIndex = gradesArray.findIndex(grade => grade === null);

    if (nextPartIndex === -1 || nextPartIndex >= relevantCurriculum.length) {
        return { status: 'fully_completed', text: 'تم الحل' };
    }

    const currentTask = relevantCurriculum[nextPartIndex];
    if (!currentTask) {
        return { status: 'none', text: 'لا يوجد' };
    }
    const isLate = compareHijriDates(today, currentTask.dueDate) > 0;

    if (isLate) {
        return { status: 'late', text: 'متأخر' };
    } else {
        return { status: 'not_completed', text: 'لم يحل' };
    }
};

const HomeworkModal = ({ students, onClose, onSave, homeworkCurriculum }) => {
    const [taskType, setTaskType] = useState('homework');
    const [gradeValue, setGradeValue] = useState(1); // Default grade for homework
    const [notCompletedStudents, setNotCompletedStudents] = useState([]);
    const [lateStudents, setLateStudents] = useState([]);
    const [fullyCompletedStudents, setFullyCompletedStudents] = useState([]);
    const [noneStudents, setNoneStudents] = useState([]);
    const [selectedStudents, setSelectedStudents] = useState([]);

    useEffect(() => {
        const notCompleted = [];
        const late = [];
        const fullyCompleted = [];
        const none = [];

        students.forEach(student => {
            const status = getTaskStatus(student, taskType, homeworkCurriculum).status;
            if (status === 'not_completed') notCompleted.push(student);
            else if (status === 'late') late.push(student);
            else if (status === 'fully_completed') fullyCompleted.push(student);
            else if (status === 'none') none.push(student);
        });

        setNotCompletedStudents(notCompleted);
        setLateStudents(late);
        setFullyCompletedStudents(fullyCompleted);
        setNoneStudents(none);
        setSelectedStudents([]);
    }, [taskType, students, homeworkCurriculum]);

    const handleToggleSelect = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAll = (list) => {
        const listIds = list.map(s => s.id);
        const allSelected = listIds.every(id => selectedStudents.includes(id));
        if (allSelected) {
            setSelectedStudents(prev => prev.filter(id => !listIds.includes(id)));
        } else {
            setSelectedStudents(prev => [...new Set([...prev, ...listIds])]);
        }
    };

    const handleSave = () => {
        if (selectedStudents.length === 0) {
            alert("يرجى تحديد الطلاب");
            return;
        }

        const updatedStudents = students.map(student => {
            if (selectedStudents.includes(student.id)) {
                const gradesKey = taskType === 'homework' ? 'homework' : 'performanceTasks';
                const gradesArray = [...(student.grades[gradesKey] || [])];
                const relevantCurriculum = homeworkCurriculum
                    .filter(c => c.type === taskType)
                    .sort((a, b) => compareHijriDates(a.dueDate, b.dueDate));

                const nextPartIndex = gradesArray.findIndex(grade => grade === null);

                if (nextPartIndex !== -1 && relevantCurriculum[nextPartIndex]) {
                    const updatedGrades = { ...student.grades, [gradesKey]: [...gradesArray] };
                    updatedGrades[gradesKey][nextPartIndex] = gradeValue;
                    return { ...student, grades: updatedGrades };
                }
            }
            return student;
        });

        onSave(updatedStudents.filter(s => s)); // Filter out any students that were not updated
        onClose();
    };

    const isSaveDisabled = selectedStudents.length === 0;

    const getIcon = (status) => {
        switch (status) {
            case 'fully_completed':
                return <FaCheckCircle className="text-green-500" />;
            case 'not_completed':
                return <FaTimesCircle className="text-red-500" />;
            case 'late':
                return <FaClock className="text-yellow-500" />;
            case 'none':
                return <FaQuestionCircle className="text-gray-500" />;
            default:
                return null;
        }
    };

    const StudentList = ({ title, students, selectedStudents, toggleSelect, onSelectAll, color }) => {
        const isAllSelected = students.length > 0 && students.every(s => selectedStudents.includes(s.id));
        return (
            <div className={`border border-gray-600 rounded-lg p-4 bg-gray-700 overflow-y-auto max-h-[250px]`}>
                <div className="flex justify-between items-center mb-2">
                    <h4 className={`font-bold text-${color}-400`}>{title}</h4>
                    {students.length > 0 && (
                        <button onClick={onSelectAll} className={`text-sm py-1 px-2 rounded ${isAllSelected ? 'bg-gray-600 text-gray-100' : 'bg-blue-600 text-white'}`} >
                            {isAllSelected ? 'إلغاء الكل' : 'تحديد الكل'}
                        </button>
                    )}
                </div>
                <div className="space-y-2">
                    {students.length > 0 ? (
                        students.map(student => (
                            <div key={student.id} className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={selectedStudents.includes(student.id)}
                                    onChange={() => toggleSelect(student.id)}
                                    className="form-checkbox text-blue-500 rounded"
                                />
                                <span className="flex-1 text-gray-200">{student.name}</span>
                                {getIcon(getTaskStatus(student, taskType, homeworkCurriculum).status)}
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-400">لا يوجد طلاب في هذه الفئة.</p>
                    )}
                </div>
            </div>
        );
    };

    const getTaskTitle = (type) => {
        return type === 'homework' ? 'واجب' : 'مهمة أدائية';
    };

    const getMaxGrade = (type) => {
        return type === 'homework' ? 1 : 5;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700">
                <div className="p-6 overflow-y-auto flex-1">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-gray-100">
                            كشف {getTaskTitle(taskType)}
                        </h3>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-3xl leading-none font-semibold">&times;</button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400">نوع المهمة</label>
                            <select
                                value={taskType}
                                onChange={(e) => setTaskType(e.target.value)}
                                className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            >
                                <option value="homework">الواجبات</option>
                                <option value="performanceTask">المهام الأدائية</option>
                            </select>
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-400">درجة التقييم (من {getMaxGrade(taskType)})</label>
                            <input
                                type="number"
                                value={gradeValue}
                                onChange={(e) => setGradeValue(Number(e.target.value))}
                                min="0"
                                max={getMaxGrade(taskType)}
                                className="w-full p-2 mt-1 rounded-lg border border-gray-600 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StudentList
                            title="لم يحل الواجب"
                            students={notCompletedStudents}
                            selectedStudents={selectedStudents}
                            toggleSelect={handleToggleSelect}
                            onSelectAll={() => handleSelectAll(notCompletedStudents)}
                            color="red"
                        />
                        <StudentList
                            title="متأخر في الحل"
                            students={lateStudents}
                            selectedStudents={selectedStudents}
                            toggleSelect={handleToggleSelect}
                            onSelectAll={() => handleSelectAll(lateStudents)}
                            color="yellow"
                        />
                        <StudentList
                            title="تم الحل"
                            students={fullyCompletedStudents}
                            selectedStudents={selectedStudents}
                            toggleSelect={handleToggleSelect}
                            onSelectAll={() => handleSelectAll(fullyCompletedStudents)}
                            color="green"
                        />
                    </div>
                </div>

                <div className="p-4 bg-gray-700 border-t border-gray-600 flex justify-between items-center">
                    <button
                        onClick={handleSave}
                        className={`py-2 px-6 rounded-lg transition-colors ${isSaveDisabled ? 'bg-gray-500 text-gray-300 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-500'}`}
                        disabled={isSaveDisabled}
                    >
                        <FaSave className="inline-block mr-2" />
                        حفظ التقييم
                    </button>
                    <button onClick={onClose} className="bg-red-600 text-white py-2 px-6 rounded-lg hover:bg-red-500 transition-colors">
                        <FaTimes className="inline-block mr-2" />
                        إغلاق
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HomeworkModal;