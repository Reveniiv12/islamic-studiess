// utils/taskStatusUtils.js أو أي مكان تعرف فيه الدالة
export function getTaskStatus(homeworkCurriculum, studentTasks) {
    // تأكد أن homeworkCurriculum مصفوفة
    const curriculumArray = Array.isArray(homeworkCurriculum) ? homeworkCurriculum : [];

    return curriculumArray.map(task => {
        const studentTask = studentTasks.find(t => t.id === task.id);

        if (!studentTask) return "لم يحل الواجب"; // مثال، عدّل حسب النظام عندك

        if (studentTask.isLate) return "متأخر";
        if (studentTask.completed) return "حل الواجب";

        return "لم يحل الواجب"; // الحالة الافتراضية
    });
}
