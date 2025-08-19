// src/utils/gradeUtils.js

import { FaCheckCircle, FaTimesCircle, FaClock, FaQuestionCircle } from "react-icons/fa";
import { getRecitationStatus } from './recitationUtils';

export const getGradeNameById = (gradeId) => {
    const grades = {
        '1': 'الصف الأول المتوسط',
        '2': 'الصف الثاني المتوسط',
        '3': 'الصف الثالث المتوسط',
    };
    return grades[gradeId] || 'غير محدد';
};

export const getSectionNameById = (sectionId) => {
    const sections = {
        '1': 'فصل 1',
        '2': 'فصل 2',
        '3': 'فصل 3',
        '4': 'فصل 4',
        '5': 'فصل 5',
        '6': 'فصل 6',
        '7': 'فصل 7',
        '8': 'فصل 8',
        '9': 'فصل 9',
        '10': 'فصل 10',
    };
    return sections[sectionId] || 'غير محدد';
};

export const calculateAverage = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
    const validGrades = arr.filter(g => g !== null && g !== '' && !isNaN(g));
    if (validGrades.length === 0) return 0;
    const sum = validGrades.reduce((acc, val) => acc + Number(val), 0);
    return sum / validGrades.length;
};

export const calculateSum = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
    const validGrades = arr.filter(g => g !== null && g !== '' && !isNaN(g));
    if (validGrades.length === 0) return 0;
    return validGrades.reduce((acc, val) => acc + Number(val), 0);
};

export const calculateBest = (arr) => {
    if (!arr || !Array.isArray(arr) || arr.length === 0) return 0;
    const validGrades = arr.filter(g => g !== null && g !== '' && !isNaN(g));
    if (validGrades.length === 0) return 0;
    return Math.max(...validGrades);
};

export const calculateCategoryScore = (grades, category, method = 'average') => {
    if (!grades || typeof grades !== 'object' || !grades[category]) return 0;
    
    const gradeArray = grades[category];
    if (!Array.isArray(gradeArray)) return 0;
    
    const validGrades = gradeArray.filter(g => g !== null && g !== '' && !isNaN(g));
    if (validGrades.length === 0) return 0;

    let score = 0;
    switch (method) {
        case 'sum':
            score = validGrades.reduce((acc, val) => acc + Number(val), 0);
            break;
        case 'best':
            score = Math.max(...validGrades);
            break;
        case 'average':
            score = validGrades.reduce((acc, val) => acc + Number(val), 0) / validGrades.length;
            break;
        default:
            score = 0;
    }
    return isNaN(score) ? 0 : parseFloat(score.toFixed(2));
};

export const calculateTotalScore = (grades, testCalculationMethod = 'average') => {
    if (!grades || typeof grades !== 'object') return 0;

    let testScore = 0;
    let homeworkScoreFinal = 0;
    let participationScoreFinal = 0;
    let performanceScoreFinal = 0;
    let oralTestScoreFinal = 0;
    let quranRecitationScoreFinal = 0;
    let quranMemorizationScoreFinal = 0;

    try {
        if (grades.tests && Array.isArray(grades.tests)) {
            const validTests = grades.tests.filter(g => g !== null && g !== '' && !isNaN(g));
            if (validTests.length > 0) {
                testScore = testCalculationMethod === 'best' 
                    ? Math.max(...validTests) 
                    : validTests.reduce((acc, val) => acc + Number(val), 0) / validTests.length;
            }
        }

        homeworkScoreFinal = calculateSum(grades.homework || []);
        participationScoreFinal = calculateSum(grades.participation || []);
        performanceScoreFinal = calculateBest(grades.performanceTasks || []);
        oralTestScoreFinal = calculateBest(grades.oralTest || []);
        quranRecitationScoreFinal = calculateAverage(grades.quranRecitation || []);
        quranMemorizationScoreFinal = calculateAverage(grades.quranMemorization || []);

        const total = (
            testScore +
            homeworkScoreFinal +
            participationScoreFinal +
            performanceScoreFinal +
            quranRecitationScoreFinal +
            quranMemorizationScoreFinal +
            oralTestScoreFinal
        );

        return isNaN(total) ? 0 : parseFloat(total.toFixed(2));
    } catch (error) {
        console.error('Error calculating total score:', error);
        return 0;
    }
};

export const getStatusInfo = (selectedStudent, type, curriculum) => {
    if (!selectedStudent || !curriculum) {
        return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد منهج' };
    }
    
    try {
        const status = getRecitationStatus(selectedStudent, type, curriculum)?.status;
        switch (status) {
            case 'fully_recited': 
                return { icon: <FaCheckCircle className="text-green-500" />, text: 'تم التسميع' };
            case 'not_memorized': 
                return { icon: <FaTimesCircle className="text-red-500" />, text: 'لم يسمّع' };
            case 'late': 
                return { icon: <FaClock className="text-yellow-500" />, text: 'متأخر' };
            case 'none': 
            default:
                return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد منهج' };
        }
    } catch (error) {
        console.error('Error getting status info:', error);
        return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'خطأ' };
    }
};

export const getStatusColor = (status) => {
    if (!status) return 'bg-gray-500';
    
    switch (status) {
        case 'fully_recited':
        case 'fully_completed':
            return 'bg-green-500';
        case 'not_memorized':
        case 'not_completed':
            return 'bg-red-500';
        case 'late':
        case 'partial_completed':
            return 'bg-yellow-500';
        default:
            return 'bg-gray-500';
    }
};

// ✅ الواجبات/المهام لا تقبل الصفر كحل، الاختبارات تقبل الصفر
export const getTaskStatus = (student, taskType, homeworkCurriculum) => {
    if (!student || !homeworkCurriculum || !Array.isArray(homeworkCurriculum)) {
        return { status: 'none', message: 'لا يوجد مهام' };
    }

    try {
        const tasks = homeworkCurriculum.filter(task => task?.type === taskType);
        if (tasks.length === 0) {
            return { status: 'none', message: 'لا يوجد مهام' };
        }

        const gradeCategory = 
            taskType === 'homework' ? 'homework' : 
            taskType === 'performanceTask' ? 'performanceTasks' : 
            taskType === 'test' ? 'tests' : null;

        if (!gradeCategory) {
            return { status: 'none', message: 'نوع مهمة غير صالح' };
        }

        const completedCount = tasks.filter((task, index) => {
            const grade = student.grades?.[gradeCategory]?.[index];

            if (taskType === 'test') {
                // في الاختبارات الصفر يعتبر درجة
                return grade !== null && grade !== '' && !isNaN(grade);
            } else {
                // في الواجبات/المهام الصفر لا يعتبر حل
                return grade !== null && grade !== '' && !isNaN(grade) && Number(grade) > 0;
            }
        }).length;

        if (completedCount === tasks.length) {
            return { status: 'fully_completed', message: 'تم الحل بالكامل' };
        } else if (completedCount > 0) {
            return { status: 'partial_completed', message: `تم حل ${completedCount} من ${tasks.length}` };
        } else {
            return { status: 'not_completed', message: 'لم يتم حل أي شيء' };
        }
    } catch (error) {
        console.error('Error getting task status:', error);
        return { status: 'none', message: 'خطأ في تحميل البيانات' };
    }
};

export const taskStatusUtils = (selectedStudent, homeworkCurriculum, taskType) => {
    if (!selectedStudent || !homeworkCurriculum) {
        return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد منهج' };
    }

    try {
        const status = getTaskStatus(selectedStudent, taskType, homeworkCurriculum)?.status;
        switch (status) {
            case 'fully_completed':
                return { icon: <FaCheckCircle className="text-green-500" />, text: 'تم الحل' };
            case 'not_completed':
                return { icon: <FaTimesCircle className="text-red-500" />, text: 'لم يحل' };
            case 'late':
                return { icon: <FaClock className="text-yellow-500" />, text: 'متأخر' };
            case 'partial_completed':
                return { icon: <FaClock className="text-yellow-500" />, text: 'حل جزئي' };
            case 'none':
            default:
                return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'لا يوجد' };
        }
    } catch (error) {
        console.error('Error in taskStatusUtils:', error);
        return { icon: <FaQuestionCircle className="text-gray-500" />, text: 'خطأ' };
    }
};

export const determinePerformanceLevel = (averageScore) => {
    if (averageScore >= 90) return 'ممتاز';
    if (averageScore >= 80) return 'جيد جداً';
    if (averageScore >= 70) return 'جيد';
    if (averageScore >= 60) return 'مقبول';
    return 'ضعيف';
};

export const createGradeEntry = (score, sectionTitle, date) => {
    return {
        id: Date.now(),
        score: score,
        section: sectionTitle,
        date: date,
        notes: ''
    };
};

export const validateGradeInput = (value, maxScore) => {
    if (value === '') return true;
    const num = Number(value);
    return !isNaN(num) && num >= 0 && num <= maxScore;
};
