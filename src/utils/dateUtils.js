// src/utils/dateUtils.js

// دالة جديدة لجلب تاريخ اليوم بالتقويم الهجري بصيغة YYYY/MM/DD
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

// دالة للتحقق من أن تاريخ التسليم قد فات
export const isDateLate = (dueDate) => {
    const today = new Date();
    const hijriToday = new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(today);
    const [day, month, year] = hijriToday.split('/');
    const formattedToday = `${year}/${month}/${day}`;

    const dateParts1 = formattedToday.split('/').map(Number);
    const date1 = new Date(dateParts1[0], dateParts1[1] - 1, dateParts1[2]);
    
    const dateParts2 = dueDate.split('/').map(Number);
    const date2 = new Date(dateParts2[0], dateParts2[1] - 1, dateParts2[2]);

    return date1 > date2;
};