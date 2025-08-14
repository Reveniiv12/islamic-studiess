import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { app } from './firebaseConfig';

const db = getFirestore(app);

// دالة لإضافة طلاب نموذجيين
async function addSampleStudents() {
  const gradeLevels = ['first-intermediate', 'second-intermediate', 'third-intermediate'];
  
  for (const grade of gradeLevels) {
    for (let classNum = 1; classNum <= 3; classNum++) { // فقط 3 فصول للاختبار
      for (let i = 1; i <= 5; i++) { // 5 طلاب لكل فصل
        const studentData = {
          name: `طالب ${i}`,
          nationalId: `ID${grade.slice(0,1)}${classNum}${i}`,
          grades: {
            tests: [randomScore(), randomScore()],
            homework: Array(10).fill(0).map(() => Math.round(Math.random())),
            participation: Array(10).fill(0).map(() => Math.round(Math.random()))
          }
        };

        await addDoc(
          collection(db, `grades/${grade}/classes/${classNum}/students`),
          studentData
        );
      }
    }
  }
  console.log('تم إضافة بيانات الطلاب النموذجية');
}

function randomScore() {
  return Math.floor(Math.random() * 50) + 50; // بين 50 و100
}

// استدعاء الدالة (يمكن تعليقها بعد التنفيذ الأول)
// addSampleStudents();