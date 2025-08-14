// src/components/RecitationReport.jsx
import React from 'react';

const getHijriToday = () => {
    const today = new Date();
    const hijriDate = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).format(today);
    const [day, month, year] = hijriDate.split('/');
    return `${year}/${month}/${day}`;
};

const RecitationReport = ({ students, curriculum, recitationType, onClose }) => {
    const getStatus = (student) => {
        const today = getHijriToday();
        const gradesArray = student.grades[recitationType === 'memorization' ? 'quranMemorization' : 'quranRecitation'];
        const relevantCurriculum = curriculum
            .filter(c => c.type === recitationType)
            .sort((a, b) => a.dueDate.localeCompare(b.dueDate));

        const completedPartsCount = gradesArray.filter(grade => grade > 0).length;
        const dueParts = relevantCurriculum.filter(c => c.dueDate <= today);
        
        if (dueParts.length === 0) {
            const nextDuePart = relevantCurriculum[0];
            return { 
                status: 'not_due', 
                note: nextDuePart ? `القادم: ${nextDuePart.start}-${nextDuePart.end} (${nextDuePart.dueDate})` : 'لا يوجد منهج'
            };
        }
        
        if (completedPartsCount === 0) {
            return { 
                status: 'not_memorized', 
                note: `لم يحفظ: ${dueParts[0].start}-${dueParts[0].end}`
            };
        }
        
        if (completedPartsCount < dueParts.length) {
            const nextPart = dueParts[completedPartsCount];
            return { 
                status: 'late', 
                note: `متأخر في: ${nextPart.start}-${nextPart.end}`
            };
        }
        
        return { 
            status: 'fully_recited', 
            note: `مكتمل حتى: ${dueParts[dueParts.length-1].start}-${dueParts[dueParts.length-1].end}`
        };
    };

    const statusClasses = {
        not_memorized: 'bg-red-100 border-red-500',
        late: 'bg-yellow-100 border-yellow-500',
        fully_recited: 'bg-green-100 border-green-500',
        not_due: 'bg-blue-100 border-blue-500'
    };

    return (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-4 bg-gray-800 text-white">
                <h3 className="text-lg font-bold">
                    {recitationType === 'memorization' ? 'حفظ القرآن' : 'تلاوة القرآن'}
                </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
                {students.map(student => {
                    const { status, note } = getStatus(student);
                    return (
                        <div key={student.id} className={`p-3 border-l-4 ${statusClasses[status]}`}>
                            <div className="flex justify-between items-center">
                                <span className="font-medium">{student.name}</span>
                                <span className="text-sm text-gray-600">{note}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RecitationReport;