export const getTaskStatus = (student, taskType, homeworkCurriculum) => {
    const today = new Date();
    const relevantCurriculum = homeworkCurriculum
        .filter(c => c.type === taskType)
        .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

    // لو ما فيه منهج أصلاً
    if (relevantCurriculum.length === 0) {
        return { status: 'no_curriculum', text: 'لا يوجد منهج' };
    }

    const gradesKey = taskType === 'homework' ? 'homework' : 'performanceTasks';
    const gradesArray = student.grades[gradesKey] || [];

    const nextPartIndex = gradesArray.findIndex(grade => grade === null);

    // لو كل الدرجات موجودة
    if (nextPartIndex === -1 || nextPartIndex >= relevantCurriculum.length) {
        return { status: 'completed', text: 'حل الواجب' };
    }

    const currentTask = relevantCurriculum[nextPartIndex];
    if (!currentTask) {
        return { status: 'none', text: 'لا يوجد' };
    }

    const dueDate = new Date(currentTask.dueDate);
    const isLate = today > dueDate;

    if (isLate) {
        return { status: 'late', text: 'متأخر' };
    } else {
        return { status: 'not_completed', text: 'لم يحل الواجب' };
    }
};
