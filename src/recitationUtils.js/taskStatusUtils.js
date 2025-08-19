// src/utils/taskStatusUtils.js
import { getHijriToday, compareHijriDates } from './recitationUtils';

// Helper function to get the status of homework or performance tasks
export const getTaskStatus = (student, taskType, homeworkCurriculum) => {
    const today = getHijriToday();
    const relevantCurriculum = homeworkCurriculum
        .filter(c => c.type === taskType)
        .sort((a, b) => compareHijriDates(a.dueDate, b.dueDate));

    const gradesKey = taskType === 'homework' ? 'homework' : 'performanceTasks';
    const gradesArray = student.grades[gradesKey] || [];

    if (relevantCurriculum.length === 0) {
        return { status: 'none', text: 'لا توجد مهام' };
    }

    const nextPartIndex = gradesArray.findIndex(grade => grade === null);

    if (nextPartIndex === -1 || nextPartIndex >= relevantCurriculum.length) {
        return { status: 'fully_completed', text: 'تم الحل' };
    }

    const currentTask = relevantCurriculum[nextPartIndex];
    if (currentTask && compareHijriDates(today, currentTask.dueDate) > 0) {
        return { status: 'late', text: 'متأخر' };
    }
    
    return { status: 'pending', text: 'قيد الانتظار' };
};

// Helper function to get the status of tests
export const getTestStatus = (student) => {
    const gradesArray = student.grades['tests'] || [];
    
    // Check if any test is pending (grade is null)
    const pendingTest = gradesArray.some(grade => grade === null);

    if (pendingTest) {
        return { status: 'pending', text: 'قيد الانتظار' };
    }

    // Check if all tests have been graded
    const allGraded = gradesArray.every(grade => grade !== null);
    if (allGraded) {
        return { status: 'fully_completed', text: 'تم الانتهاء' };
    }

    return { status: 'none', text: 'لا توجد اختبارات' };
};