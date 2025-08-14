// src/pages/StudentView.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../firebase";

function StudentView() {
  const { viewKey } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const q = query(
          collection(db, "students"),
          where("viewKey", "==", viewKey)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          setStudentData({
            id: querySnapshot.docs[0].id,
            ...querySnapshot.docs[0].data()
          });
        } else {
          setError("لم يتم العثور على الطالب.");
        }
      } catch (err) {
        console.error(err);
        setError("حدث خطأ أثناء تحميل البيانات.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [viewKey]);

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md mt-10 text-center">
      <div className="text-red-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-2">حدث خطأ</h3>
      <p className="text-gray-600">{error}</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="md:flex">
          {studentData.imageUrl && (
            <div className="md:w-1/3 bg-gray-100 flex items-center justify-center p-6">
              <img 
                src={studentData.imageUrl} 
                alt={studentData.name}
                className="h-48 w-48 rounded-full object-cover border-4 border-white shadow-md"
              />
            </div>
          )}
          <div className={`${studentData.imageUrl ? 'md:w-2/3' : 'w-full'} p-8`}>
            <div className="uppercase tracking-wide text-sm text-primary font-semibold mb-1">الطالب</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{studentData.name}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600">السجل المدني</p>
                <p className="font-medium">{studentData.nationalId || 'غير متوفر'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">رقم ولي الامر</p>
                <p className="font-medium">{studentData.phone || 'غير متوفر'}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200">
          <h2 className="text-xl font-bold mb-4 text-primary">الدرجات</h2>
          
          {Object.keys(studentData.grades || {}).length === 0 ? (
            <p className="text-gray-500 text-center py-8">لا توجد درجات مسجلة بعد</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(studentData.grades || {}).map(([category, value]) => (
                <div key={category} className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 capitalize">
                    {category === 'monthlyTest' && 'الاختبار الشهري'}
                    {category === 'finalTest' && 'الاختبار النهائي'}
                    {category === 'homework' && 'الواجبات'}
                    {category === 'participation' && 'المشاركة'}
                    {category === 'attendance' && 'الحضور'}
                    {!['monthlyTest', 'finalTest', 'homework', 'participation', 'attendance'].includes(category) && category}
                  </h3>
                  <div className="mt-2 flex items-center">
                    <span className="text-3xl font-bold text-primary">{value}</span>
                    {typeof value === 'number' && (
                      <span className="ml-2 text-sm text-gray-500">/100</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default StudentView;