// src/components/HomeworkReport.jsx
import React from 'react';
import { getTaskStatus } from '../utils/recitationUtils'; // Note: Assuming getTaskStatus is moved or duplicated

const HomeworkReport = ({ students, homeworkCurriculum, onClose }) => {
    // getTaskStatus function needs to be a helper or imported.
    // For simplicity, let's include a local version here or assume it's moved to utils
    const getLocalTaskStatus = (student, taskType) => {
        const today = new Date().toISOString().slice(0, 10); // Using a simple date for now
        const relevantCurriculum = homeworkCurriculum
            .filter(c => c.type === taskType)
            .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        const gradesKey = taskType === 'homework' ? 'homework' : 'performanceTasks';
        const gradesArray = student.grades[gradesKey] || [];

        const nextPartIndex = gradesArray.findIndex(grade => grade === null);

        if (nextPartIndex === -1 || nextPartIndex >= relevantCurriculum.length) {
            return { status: 'fully_completed', text: 'تم الحل' };
        }

        const currentTask = relevantCurriculum[nextPartIndex];
        if (!currentTask) {
            return { status: 'none', text: 'لا يوجد' };
        }

        const isLate = new Date(today) > new Date(currentTask.dueDate);

        if (isLate) {
            return { status: 'late', text: 'متأخر' };
        } else {
            return { status: 'not_completed', text: 'لم يحل' };
        }
    };

    const homeworks = homeworkCurriculum.filter(t => t.type === 'homework');
    const performanceTasks = homeworkCurriculum.filter(t => t.type === 'performanceTask');
    const allTasks = homeworkCurriculum.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col text-white relative">
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                    <h2 className="text-2xl font-bold">تقرير الواجبات والمهام الأدائية</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                        <FaTimes className="text-2xl" />
                    </button>
                </div>
                <div className="overflow-auto p-4 flex-grow custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Homework Report */}
                        <div>
                            <h3 className="text-xl font-semibold text-center mb-4">تقرير الواجبات</h3>
                            <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                                <thead className="bg-gray-900 text-gray-300 uppercase text-sm">
                                    <tr>
                                        <th className="py-2 px-4 text-right">اسم الطالب</th>
                                        {homeworks.map((task, index) => (
                                            <th key={index} className="py-2 px-4 text-center">
                                                {task.name} ({task.dueDate})
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id} className="border-b border-gray-600 hover:bg-gray-600 transition-colors">
                                            <td className="py-2 px-4 whitespace-nowrap">{student.name}</td>
                                            {homeworks.map((task, index) => {
                                                const grade = student.grades.homework?.[index];
                                                let statusText = 'لم يحل';
                                                let statusColor = 'text-gray-400';
                                                if (grade !== null) {
                                                    statusText = 'تم الحل';
                                                    statusColor = 'text-green-500';
                                                }
                                                return (
                                                    <td key={index} className="py-2 px-4 text-center">
                                                        <span className={statusColor}>
                                                            {statusText}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Performance Tasks Report */}
                        <div>
                            <h3 className="text-xl font-semibold text-center mb-4">تقرير المهام الأدائية</h3>
                            <table className="min-w-full bg-gray-700 rounded-lg overflow-hidden">
                                <thead className="bg-gray-900 text-gray-300 uppercase text-sm">
                                    <tr>
                                        <th className="py-2 px-4 text-right">اسم الطالب</th>
                                        {performanceTasks.map((task, index) => (
                                            <th key={index} className="py-2 px-4 text-center">
                                                {task.name} ({task.dueDate})
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(student => (
                                        <tr key={student.id} className="border-b border-gray-600 hover:bg-gray-600 transition-colors">
                                            <td className="py-2 px-4 whitespace-nowrap">{student.name}</td>
                                            {performanceTasks.map((task, index) => {
                                                const grade = student.grades.performanceTasks?.[index];
                                                let statusText = 'لم يحل';
                                                let statusColor = 'text-gray-400';
                                                if (grade !== null) {
                                                    statusText = 'تم الحل';
                                                    statusColor = 'text-green-500';
                                                }
                                                return (
                                                    <td key={index} className="py-2 px-4 text-center">
                                                        <span className={statusColor}>
                                                            {statusText}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HomeworkReport;