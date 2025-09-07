// src/pages/ConnectedUsersPage.jsx
import React, { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaHome,
  FaSyncAlt,
  FaUserCircle,
  FaClock,
} from "react-icons/fa";

function ConnectedUsersPage() {
  const { gradeId, sectionId } = useParams();
  const navigate = useNavigate();
  const [currentUsers, setCurrentUsers] = useState([]);
  const [pastUsers, setPastUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [teacherId, setTeacherId] = useState(null);

  const formatDuration = (seconds) => {
    if (seconds === null) return "متصل الآن";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes} دقيقة و ${remainingSeconds} ثانية`;
  };

  const fetchVisitData = async () => {
    if (!teacherId) return;
    setIsRefreshing(true);
    try {
      const { data, error } = await supabase
        .from("page_visits")
        .select('*')
        .eq('teacher_id', teacherId)
        .eq('page_name', 'StudentView')
        .order('visit_start_time', { ascending: false });

      if (error) {
        throw error;
      }

      const now = Date.now();
      const thirtyMinutesAgo = now - 30 * 60 * 1000;

      // Group visits by student to find the latest session for each
      const latestVisits = {};
      data.forEach(visit => {
        if (!latestVisits[visit.student_id] || new Date(visit.visit_start_time) > new Date(latestVisits[visit.student_id].visit_start_time)) {
          latestVisits[visit.student_id] = visit;
        }
      });
      
      const current = [];
      const past = [];
      Object.values(latestVisits).forEach(visit => {
        const visitStartTime = new Date(visit.visit_start_time).getTime();
        // Check if the visit is recent and ongoing (no duration)
        if (visit.duration === null && visitStartTime > thirtyMinutesAgo) {
          // Add a live duration property for the current counter
          const liveDuration = Math.floor((now - visitStartTime) / 1000);
          current.push({ ...visit, liveDuration });
        } else {
          past.push(visit);
        }
      });

      setCurrentUsers(current);
      setPastUsers(past);

    } catch (err) {
      console.error("Error fetching data:", err);
      setError("فشل في جلب بيانات الزوار.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Live timer for current users
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentUsers(prevUsers => 
        prevUsers.map(user => ({
          ...user,
          liveDuration: Math.floor((Date.now() - new Date(user.visit_start_time).getTime()) / 1000)
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/");
        return;
      }
      setTeacherId(user.id);
    };
    checkUser();
  }, [navigate]);

  useEffect(() => {
    if (teacherId) {
      fetchVisitData();
      const interval = setInterval(fetchVisitData, 15000); // تحديث القائمة كل 15 ثانية
      return () => clearInterval(interval);
    }
  }, [teacherId]);

  if (loading) {
    return <div className="p-8 text-center text-blue-400 font-['Noto_Sans_Arabic',sans-serif] bg-gray-900 min-h-screen flex items-center justify-center">جاري تحميل البيانات...</div>;
  }

  return (
    <div className="p-4 md:p-8 bg-gray-900 min-h-screen font-['Noto_Sans_Arabic',sans-serif] text-right text-gray-100" dir="rtl">
      <header className="flex flex-col md:flex-row justify-between items-center bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700 text-center relative">
        <h1 className="text-xl md:text-3xl font-extrabold text-white">
          سجل المتصلين - {`الصف: ${gradeId} / القسم: ${sectionId}`}
        </h1>
        <div className="flex gap-4 mt-4 md:mt-0">
          <button
            onClick={() => navigate(`/grades/${gradeId}/sections/${sectionId}`)}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition-colors shadow-md text-sm"
          >
            <FaArrowLeft /> العودة للفصل
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors shadow-md text-sm"
          >
            <FaHome /> الرئيسية
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto bg-gray-800 shadow-xl rounded-2xl overflow-hidden border border-gray-700 p-6 md:p-8">
        {error && <div className="text-red-400 text-center mb-4">{error}</div>}
        
        {/* Current Users Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
            <FaUserCircle /> المتصلون حاليًا
            {isRefreshing && <FaSyncAlt className="animate-spin text-xl text-gray-400" />}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentUsers.length > 0 ? (
              currentUsers.map(user => (
                <div key={user.id} className="bg-gray-700 p-4 rounded-lg shadow-md flex justify-between items-center border-l-4 border-green-500">
                  <span className="text-lg font-semibold text-gray-100">{user.visitor_name}</span>
                  <div className="flex items-center gap-2 text-green-400">
                    <FaClock />
                    <span className="font-bold">{formatDuration(user.liveDuration)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center md:col-span-2">لا يوجد متصلون حاليًا.</p>
            )}
          </div>
        </div>

        {/* Past Visits Section */}
        <div>
          <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
            <FaClock /> سجل الزيارات السابق
          </h2>
          <div className="space-y-4">
            {pastUsers.length > 0 ? (
              pastUsers.map(user => (
                <div key={user.id} className="bg-gray-700 p-4 rounded-lg shadow-md border-l-4 border-gray-500">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-semibold text-gray-100">{user.visitor_name}</span>
                    <span className="text-sm text-gray-400">
                      {new Date(user.visit_start_time).toLocaleString('ar-SA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-300">
                    <FaClock />
                    <span>مدة الجلسة: {formatDuration(user.duration)}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">لا يوجد سجلات زيارة سابقة.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectedUsersPage;
