import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase, ref, set, push, update, onValue } from "firebase/database";
import { getFirestore, collection, doc, updateDoc, setDoc, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB--zW7T9WT5PZ_y9f1Sxr--DF5tFFOlbI",
  authDomain: "student-portal-ce9ed.firebaseapp.com",
  projectId: "student-portal-ce9ed",
  storageBucket: "student-portal-ce9ed.appspot.com",
  messagingSenderId: "71643352040",
  appId: "1:71643352040:web:442d3ac558edda827f325d",
  databaseURL: "https://student-portal-ce9ed-default-rtdb.firebaseio.com" // لازم إذا تستخدم Realtime DB
};

const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);

// Firestore
const db = getFirestore(app);

// Realtime Database
const database = getDatabase(app);

// الدوال الجديدة المضافة
const updateStars = async (studentRef, stars) => {
  await updateDoc(studentRef, { stars });
};

const updateRecitation = async (studentRef, status) => {
  await updateDoc(studentRef, { 
    recitation: { 
      status,
      lastUpdated: new Date() 
    } 
  });
};

const saveWeeklyNote = async (studentRef, weekNumber, note) => {
  await updateDoc(studentRef, {
    [`weeklyNotes.${weekNumber}`]: note
  });
};

const transferStudent = async (fromRef, toRef, studentData) => {
  await setDoc(toRef, studentData);
  await deleteDoc(fromRef);
};

export { 
  auth, 
  db, 
  collection, 
  doc, 
  updateDoc,
  ref,
  set,
  push,
  update,
  onValue,
  updateStars,
  updateRecitation,
  saveWeeklyNote,
  transferStudent
};
