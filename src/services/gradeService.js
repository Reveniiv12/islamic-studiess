// src/services/gradeService.js
import { db, ref, set, push, update, onValue, remove } from "../firebase";

// هيكل البيانات الأساسي
const initialDataStructure = {
  grades: {
    "first-intermediate": {
      sections: {}
    },
    "second-intermediate": {
      sections: {}
    },
    "third-intermediate": {
      sections: {}
    }
  }
};

// تهيئة البيانات الأولية
export const initializeData = async () => {
  try {
    await set(ref(db, '/'), initialDataStructure);
  } catch (error) {
    console.error("Error initializing data:", error);
  }
};

// إضافة فصل جديد
export const addSection = async (gradeId, sectionName) => {
  try {
    const sectionRef = push(ref(db, `grades/${gradeId}/sections`));
    await set(sectionRef, {
      name: sectionName,
      students: {}
    });
    return sectionRef.key;
  } catch (error) {
    console.error("Error adding section:", error);
    throw error;
  }
};

// إضافة طالب جديد
export const addStudent = async (gradeId, sectionId, studentData) => {
  try {
    const studentRef = push(ref(db, `grades/${gradeId}/sections/${sectionId}/students`));
    const studentWithDefaults = {
      ...studentData,
      grades: {
        tests: [0, 0],
        homework: Array(10).fill(0),
        participation: Array(10).fill(0),
        performanceTasks: 0,
        quranRecitation: Array(4).fill(0),
        quranMemorization: Array(4).fill(0),
        oralTest: Array(5).fill(0),
        weeklyNotes: Array(16).fill("")
      },
      createdAt: new Date().toISOString()
    };
    await set(studentRef, studentWithDefaults);
    return studentRef.key;
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
};

// تحديث درجات الطالب
export const updateStudentGrades = async (gradeId, sectionId, studentId, grades) => {
  try {
    await update(ref(db, `grades/${gradeId}/sections/${sectionId}/students/${studentId}/grades`), grades);
  } catch (error) {
    console.error("Error updating grades:", error);
    throw error;
  }
};

// جلب جميع الفصول لصف معين
export const getSections = (gradeId, callback) => {
  const sectionsRef = ref(db, `grades/${gradeId}/sections`);
  return onValue(sectionsRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.keys(data).map(key => ({ id: key, ...data[key] })));
  });
};

// جلب جميع الطلاب لفصل معين
export const getStudents = (gradeId, sectionId, callback) => {
  const studentsRef = ref(db, `grades/${gradeId}/sections/${sectionId}/students`);
  return onValue(studentsRef, (snapshot) => {
    const data = snapshot.val() || {};
    callback(Object.keys(data).map(key => ({ id: key, ...data[key] })));
  });
};