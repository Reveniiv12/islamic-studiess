import { getFirestore, doc, setDoc, collection } from 'firebase/firestore';
import { app } from './firebaseConfig';

const db = getFirestore(app);

// دالة لإنشاء هيكل الصفوف والفصول
async function setupSchoolStructure() {
  try {
    // 1. إنشاء المراحل الدراسية
    const gradeLevels = [
      { id: 'first-intermediate', name: 'أول متوسط' },
      { id: 'second-intermediate', name: 'ثاني متوسط' },
      { id: 'third-intermediate', name: 'ثالث متوسط' }
    ];

    // 2. إنشاء الفصول لكل مرحلة
    for (const grade of gradeLevels) {
      const gradeRef = doc(db, 'grades', grade.id);
      await setDoc(gradeRef, {
        name: grade.name,
        createdAt: new Date()
      });

      // إنشاء 10 فصول لكل مرحلة
      for (let i = 1; i <= 10; i++) {
        const classRef = doc(collection(db, `grades/${grade.id}/classes`), i.toString());
        await setDoc(classRef, {
          classNumber: i,
          teacher: '',
          capacity: 30,
          createdAt: new Date()
        });

        console.log(`تم إنشاء ${grade.name} - الفصل ${i}`);
      }
    }

    console.log('تم إنشاء الهيكل الدراسي بنجاح!');
  } catch (error) {
    console.error('حدث خطأ أثناء الإنشاء:', error);
  }
}

// استدعاء الدالة (يمكن تعليقها بعد التنفيذ الأول)
// setupSchoolStructure();