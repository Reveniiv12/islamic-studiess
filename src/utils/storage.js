// utils/storage.js
export const saveGradeData = (gradeId, sectionId, data) => {
  const storageKey = `grades_${gradeId}_${sectionId}`;
  localStorage.setItem(storageKey, JSON.stringify(data));
};

export const loadGradeData = (gradeId, sectionId) => {
  const storageKey = `grades_${gradeId}_${sectionId}`;
  return JSON.parse(localStorage.getItem(storageKey)) || [];
};