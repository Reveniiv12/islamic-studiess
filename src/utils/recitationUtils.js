// src/utils/recitationUtils.js
export const getHijriToday = () => {
    const today = new Date();
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(today);
    const [day, month, year] = hijriDate.split('/');
    return `${year}/${month}/${day}`;
};

export const compareHijriDates = (date1, date2) => {
    const parts1 = date1.split('/').map(Number);
    const parts2 = date2.split('/').map(Number);
    if (parts1[0] !== parts2[0]) return parts1[0] - parts2[0];
    if (parts1[1] !== parts2[1]) return parts1[1] - parts2[1];
    return parts1[2] - parts2[2];
};

export const getRecitationStatus = (student, recitationType, curriculum) => {
    if (!student || !Array.isArray(curriculum)) {
        return { status: 'none', note: '⚪ لا يوجد أي جزء في المنهج.' };
    }

    const gradesArray = student.grades[recitationType === 'memorization' ? 'quranMemorization' : 'quranRecitation'];
    const relevantCurriculum = curriculum
        .filter(c => c.type === recitationType)
        .sort((a, b) => compareHijriDates(a.dueDate, b.dueDate));

    const totalCurriculumParts = relevantCurriculum.length;
    const completedPartsCount = gradesArray.filter(grade => grade > 0).length;

    if (totalCurriculumParts === 0) {
        return { status: 'none', note: '⚪ لا يوجد أي جزء في المنهج.' };
    }

    if (completedPartsCount === 0) {
        const firstPart = relevantCurriculum[0];
        return {
            status: 'not_memorized',
            note: `🔴 لم يسمع أي جزء. مطلوب منه: ${firstPart.start} - ${firstPart.end}`
        };
    }
    
    if (completedPartsCount < totalCurriculumParts) {
        const lastCompletedPart = relevantCurriculum[completedPartsCount - 1];
        const nextRequiredPart = relevantCurriculum[completedPartsCount];
        return {
            status: 'late',
            note: `🟡 متأخر. آخر جزء تم تسميعه: ${lastCompletedPart.start} - ${lastCompletedPart.end}. المطلوب الآن: ${nextRequiredPart.start} - ${nextRequiredPart.end}.`
        };
    }

    if (completedPartsCount >= totalCurriculumParts) {
        const lastPart = relevantCurriculum[totalCurriculumParts - 1];
        return {
            status: 'fully_recited',
            note: `🟢 أكمل جميع أجزاء المنهج. آخر جزء تم تسميعه: ${lastPart.start} - ${lastPart.end}.`
        };
    }

    return { status: 'none', note: '⚪ حالة غير معروفة.' };
};