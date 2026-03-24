import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, updateDoc, setDoc, deleteDoc, getDoc } from "firebase/firestore";

// 🔐 القيم تُقرأ من متغيرات البيئة (.env) - لا تضع مفاتيح هنا مباشرة
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);

// Firestore
const db = getFirestore(app);

// الدوال الجديدة المضافة
const updateStars = async (studentRef, stars) => {
  await updateDoc(studentRef, { stars });
};

const updateRecitation = async (studentRef, recitation) => {
  await updateDoc(studentRef, { recitation });
};

const updateStudentNotes = async (studentRef, weekIndex, note) => {
  const docSnap = await getDoc(studentRef);
  if (docSnap.exists()) {
    const studentData = docSnap.data();
    const currentNotes = studentData.weeklyNotes || [];
    currentNotes[weekIndex] = currentNotes[weekIndex] || [];
    currentNotes[weekIndex].push(note);
    await updateDoc(studentRef, { weeklyNotes: currentNotes });
  }
};

const addHomework = async (studentRef, homeworkStatus, weekIndex) => {
  const docSnap = await getDoc(studentRef);
  if (docSnap.exists()) {
    const studentData = docSnap.data();
    const currentHomework = studentData.homework || [];
    currentHomework[weekIndex] = homeworkStatus;
    await updateDoc(studentRef, { homework: currentHomework });
  }
};

const addCurriculum = async (gradeId, sectionId, parts) => {
  const docRef = doc(db, `grades/${gradeId}/classes/${sectionId}/curriculum`, "recitation");
  await setDoc(docRef, { parts });
};

const addHomeworkCurriculum = async (gradeId, sectionId, parts) => {
  const docRef = doc(db, `grades/${gradeId}/classes/${sectionId}/curriculum`, "homework");
  await setDoc(docRef, { parts });
};

export {
  auth,
  db,
  updateStars,
  updateRecitation,
  updateStudentNotes,
  addHomework,
  addCurriculum,
  addHomeworkCurriculum
};
