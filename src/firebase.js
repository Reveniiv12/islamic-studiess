import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB--zW7T9WT5PZ_y9f1Sxr--DF5tFFOlbI",
  authDomain: "student-portal-ce9ed.firebaseapp.com",
  projectId: "student-portal-ce9ed",
  storageBucket: "student-portal-ce9ed.appspot.com",
  messagingSenderId: "71643352040",
  appId: "1:71643352040:web:442d3ac558edda827f325d",
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
