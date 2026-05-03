import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { 
  FaGamepad, 
  FaPlus, 
  FaArrowRight, 
  FaTrophy, 
  FaHistory, 
  FaCog, 
  FaTrash,
  FaPlay,
  FaTimes,
  FaCheck,
  FaUserFriends,
  FaUpload,
  FaQuestionCircle,
  FaRocket,
  FaAward,
  FaVolumeUp,
  FaStopwatch,
  FaDice,
  FaArrowLeft,
  FaChalkboardTeacher,
  FaTasks
} from "react-icons/fa";
import WheelOfFortune from "../components/WheelOfFortune";
import ChallengeImporter from "../components/ChallengeImporter";
import CustomDialog from "../components/CustomDialog";

const ChallengePage = () => {
  const { gradeId, sectionId } = useParams();
  const navigate = useNavigate();
  const [view, setView] = useState("setup"); // setup, manager, game, results, history, importer
  const [loading, setLoading] = useState(false);
  const [teacherId, setTeacherId] = useState(null);
  const [students, setStudents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  
  // States for Game Configuration
  const [rounds, setRounds] = useState(10);
  const [questionsPerStudent, setQuestionsPerStudent] = useState(1);
  const [gameMode, setGameMode] = useState("random");
  
  // States for Individual Mode
  const [challengeType, setChallengeType] = useState("classroom"); // classroom | individual
  const [questionsCount, setQuestionsCount] = useState(5);
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [assigning, setAssigning] = useState(false);
  const [sectionsList, setSectionsList] = useState([]);
  const [selectedSections, setSelectedSections] = useState([`${gradeId}|${sectionId}`]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);

  // States for Dialog
  const [dialogConfig, setDialogConfig] = useState({ show: false, title: "", message: "", type: "info", onConfirm: null });
  
  const handleDialog = (title, message, type, onConfirm = null) => {
      setDialogConfig({ show: true, title, message, type, onConfirm });
  };

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTeacherId(user.id);
        fetchStudents(user.id);
        fetchChallenges(user.id);
        fetchSectionsList(user.id);
      } else {
        navigate("/login");
      }
    };
    init();
  }, [gradeId, sectionId]);

  const fetchStudents = async (tId) => {
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("grade_level", gradeId)
      .eq("section", sectionId)
      .eq("teacher_id", tId);
    if (!error) {
      setStudents(data);
      setSelectedStudentIds(data.map(s => s.id));
    }
  };

  const fetchSectionsList = async (tId) => {
    const { data, error } = await supabase
      .from('students')
      .select('grade_level, section')
      .eq('teacher_id', tId);
    if (!error && data) {
      const uniqueSections = Array.from(new Set(data.map(s => `${s.grade_level}|${s.section}`)))
        .map(key => {
            const [g, s] = key.split('|');
            return { grade_level: g, section: s };
        });
      setSectionsList(uniqueSections);
    }
  };

  const fetchChallenges = async (tId) => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("grade_id", gradeId)
      .eq("teacher_id", tId);
    if (!error) setChallenges(data || []);
  };

  const handleStartGame = () => {
    if (!selectedChallenge) return;
    setView("game");
  };

  const handleAssignIndividual = async () => {
    if (!selectedChallenge) return;
    if (selectedStudentIds.length === 0 && selectedSections.length === 1 && selectedSections[0] === `${gradeId}|${sectionId}`) {
      handleDialog("تنبيه", "الرجاء تحديد طالب واحد على الأقل أو فصل إضافي للتكليف.", "warning");
      return;
    }

    setAssigning(true);
    try {
      const newAssignment = {
        id: Date.now().toString(),
        challenge_id: selectedChallenge.id,
        subject_name: selectedChallenge.subject_name,
        lesson_name: selectedChallenge.lesson_name,
        questions_count: questionsCount,
        attempts_allowed: attemptsCount,
        attempts_used: 0,
        assigned_at: new Date().toISOString(),
        best_score: null
      };

      let targetStudents = [];

      // Fetch students for all selected sections (except current one if we want to use the specific selectedStudentIds for the current one)
      for (const secKey of selectedSections) {
         const [g, s] = secKey.split('|');
         if (g === gradeId && s === sectionId) {
            targetStudents.push(...students.filter(st => selectedStudentIds.includes(st.id)));
         } else {
            const { data, error } = await supabase.from("students").select("*").eq("grade_level", g).eq("section", s).eq("teacher_id", teacherId);
            if (!error && data) targetStudents.push(...data);
         }
      }

      if (targetStudents.length === 0) {
         handleDialog("تنبيه", "لا يوجد طلاب متاحين للتكليف بناءً على اختياراتك.", "warning");
         setAssigning(false);
         return;
      }

      for (const student of targetStudents) {
        const currentGrades = student.grades || {};
        const assignedChallenges = currentGrades.assigned_challenges || [];
        const newGrades = {
          ...currentGrades,
          assigned_challenges: [...assignedChallenges, newAssignment]
        };

        await supabase
          .from('students')
          .update({ grades: newGrades })
          .eq('id', student.id);
      }

      handleDialog("نجاح", `تم التكليف بنجاح لـ ${targetStudents.length} طالب/طالبة!`, "success");
    } catch (err) {
      console.error("Error assigning challenge:", err);
      handleDialog("خطأ", "حدث خطأ أثناء التكليف.", "error");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-['Tajawal',sans-serif] overflow-x-hidden" dir="rtl">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full"></div>
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row justify-between items-center mb-8 gap-6">
          <div className="flex items-center gap-5 animate-slideDown">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-indigo-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative p-4 bg-slate-900 ring-1 ring-white/10 rounded-xl leading-none flex items-center shadow-2xl">
                <FaGamepad className="text-3xl text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white mb-1">
                تحدي <span className="text-transparent bg-clip-text bg-gradient-to-l from-cyan-400 to-indigo-400">الطلاب</span>
              </h1>
              <p className="text-slate-500 font-medium text-sm">منصة التعليم التفاعلي للفصل الدراسي</p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 animate-slideDown [animation-delay:100ms]">
            <NavButton 
              icon={<FaChalkboardTeacher />} 
              label="العودة للفصل" 
              active={false} 
              onClick={() => navigate(`/grades/${gradeId}/sections/${sectionId}`)} 
              className="bg-rose-600/20 text-rose-400 border-rose-500/20 hover:bg-rose-600 hover:text-white"
            />
            {view !== "game" && (
              <>
                <NavButton 
                  icon={<FaCog />} 
                  label="المستودع" 
                  active={view === "manager"} 
                  onClick={() => setView("manager")} 
                />
                <NavButton 
                  icon={<FaTrophy />} 
                  label="لوحة الشرف" 
                  active={view === "history"} 
                  onClick={() => setView("history")} 
                />
                <NavButton 
                  icon={<FaTasks />} 
                  label="إدارة التكاليف" 
                  active={view === "assignments"} 
                  onClick={() => setView("assignments")} 
                />
              </>
            )}
          </div>
        </div>

        {/* Content Renderers */}
        <div className="transition-all duration-500">
          {view === "setup" && (
            <SetupView 
              challenges={challenges} 
              students={students}
              selectedChallenge={selectedChallenge}
              setSelectedChallenge={setSelectedChallenge}
              rounds={rounds}
              setRounds={setRounds}
              questionsPerStudent={questionsPerStudent}
              setQuestionsPerStudent={setQuestionsPerStudent}
              gameMode={gameMode}
              setGameMode={setGameMode}
              challengeType={challengeType}
              setChallengeType={setChallengeType}
              questionsCount={questionsCount}
              setQuestionsCount={setQuestionsCount}
              attemptsCount={attemptsCount}
              setAttemptsCount={setAttemptsCount}
              onStart={handleStartGame}
              onAssign={handleAssignIndividual}
              assigning={assigning}
              sectionsList={sectionsList}
              selectedSections={selectedSections}
              setSelectedSections={setSelectedSections}
              selectedStudentIds={selectedStudentIds}
              setSelectedStudentIds={setSelectedStudentIds}
              gradeId={gradeId}
              sectionId={sectionId}
            />
          )}

          {view === "manager" && (
            <ManagerView 
              gradeId={gradeId} 
              teacherId={teacherId} 
              onClose={() => setView("setup")} 
              onSwitchToImporter={() => setView("importer")}
              fetchChallenges={fetchChallenges}
              setView={setView}
              setSelectedChallenge={setSelectedChallenge}
              handleDialog={handleDialog}
              dialogConfig={dialogConfig}
              setDialogConfig={setDialogConfig}
            />
          )}

          {view === "game" && selectedChallenge && (
            <GameView 
              challenge={selectedChallenge} 
              students={students} 
              rounds={rounds} 
              questionsPerStudent={questionsPerStudent}
              mode={gameMode} 
              teacherId={teacherId}
              sectionId={sectionId}
              gradeId={gradeId}
              onClose={() => setView("setup")} 
            />
          )}

          {view === "history" && (
             <HistoryView 
                gradeId={gradeId} 
                sectionId={sectionId} 
                teacherId={teacherId} 
                onClose={() => setView("setup")}
             />
          )}

          {view === "assignments" && (
             <AssignmentsView
                gradeId={gradeId}
                teacherId={teacherId}
                onClose={() => setView("setup")}
                handleDialog={handleDialog}
                dialogConfig={dialogConfig}
                setDialogConfig={setDialogConfig}
             />
          )}

          {view === "importer" && (
            <ChallengeImporter 
              gradeId={gradeId} 
              teacherId={teacherId} 
              onComplete={() => { setView("manager"); fetchChallenges(teacherId); }}
              onCancel={() => setView("manager")}
            />
          )}
          
          {view === "editor" && (
            <EditorView 
              challenge={selectedChallenge} 
              gradeId={gradeId} 
              teacherId={teacherId} 
              onClose={() => { setView("manager"); fetchChallenges(teacherId); }}
              handleDialog={handleDialog}
            />
          )}
        </div>
      </main>

      {dialogConfig.show && (
        <CustomDialog 
          title={dialogConfig.title}
          message={dialogConfig.message}
          type={dialogConfig.type}
          onClose={() => setDialogConfig({...dialogConfig, show: false})}
          onConfirm={dialogConfig.onConfirm}
        />
      )}

      {/* Global Aesthetics */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          0% { transform: scale(0.8); opacity: 0; }
          70% { transform: scale(1.05); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-slideDown { animation: slideDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-slideUp { animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .animate-fadeIn { animation: fadeIn 0.8s ease-out forwards; }
        .animate-popIn { animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
};

/* --- Global Sub-Components --- */

const NavButton = ({ icon, label, active, onClick, className = "" }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 text-sm border
      ${active 
        ? "bg-cyan-500 text-slate-900 border-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-105" 
        : "bg-slate-900/50 border-white/5 text-slate-400 hover:text-white hover:bg-slate-800"
      }
      ${className}
    `}
  >
    {icon} {label}
  </button>
);

const GlassCard = ({ children, className = "" }) => (
  <div className={`bg-slate-900/40 backdrop-blur-xl border border-white/5 shadow-2xl rounded-[2rem] overflow-hidden ${className}`}>
    {children}
  </div>
);

/* --- Views --- */

const SetupView = ({ 
  challenges, students, selectedChallenge, setSelectedChallenge, 
  rounds, setRounds, questionsPerStudent, setQuestionsPerStudent, 
  gameMode, setGameMode, challengeType, setChallengeType, 
  questionsCount, setQuestionsCount, attemptsCount, setAttemptsCount, 
  onStart, onAssign, assigning,
  sectionsList, selectedSections, setSelectedSections,
  selectedStudentIds, setSelectedStudentIds, gradeId, sectionId
}) => {
  const toggleStudent = (id) => {
    setSelectedStudentIds(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  };

  const toggleSection = (key) => {
    setSelectedSections(prev => prev.includes(key) ? prev.filter(sKey => sKey !== key) : [...prev, key]);
  };

  return (
  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-slideUp">
    <div className="lg:col-span-3 space-y-6">
      <GlassCard className="p-6 md:p-8 border-indigo-500/20">
        <div className="flex items-center gap-3 mb-6">
          <FaRocket className="text-xl text-indigo-400" />
          <h2 className="text-xl font-black">غرفة الإطلاق</h2>
        </div>
        
        <div className="space-y-8">
          <div className="group">
            <label className="block text-xs font-bold text-slate-500 mb-2 mr-2 group-hover:text-indigo-400 transition-colors uppercase tracking-widest">اختر المسابقة</label>
            <div className="relative">
              <select 
                className="w-full bg-slate-950/50 border-2 border-slate-800 rounded-2xl p-4 focus:border-indigo-500 outline-none transition-all appearance-none font-bold"
                onChange={(e) => setSelectedChallenge(challenges.find(c => c.id === e.target.value))}
                value={selectedChallenge?.id || ""}
              >
                <option value="">-- اختر المسابقة من المستودع --</option>
                {challenges.map(c => (
                  <option key={c.id} value={c.id}>{c.lesson_name} ({c.subject_name})</option>
                ))}
              </select>
              <div className="absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                <FaQuestionCircle />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2 mr-2 uppercase tracking-widest">نوع التحدي</label>
            <div className="flex p-1 bg-slate-950/50 border-2 border-slate-800 rounded-2xl">
              <button 
                onClick={() => setChallengeType("classroom")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-500 ${challengeType === "classroom" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                <FaChalkboardTeacher /> تحدي جماعي للفصل
              </button>
              <button 
                onClick={() => setChallengeType("individual")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-500 ${challengeType === "individual" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
              >
                <FaUserFriends /> تكليف فردي للطلاب
              </button>
            </div>
          </div>

           {challengeType === "classroom" ? (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-2 mr-2 uppercase tracking-widest">إجمالي الأسئلة (للجميع)</label>
                 <div className="flex items-center gap-3 bg-slate-950/50 border-2 border-slate-800 rounded-2xl p-2 px-3 shadow-inner">
                   <button onClick={() => setRounds(Math.max(1, rounds - 1))} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaTimes className="rotate-45 text-xs" /></button>
                   <input 
                     type="number"
                     value={rounds}
                     onChange={(e) => setRounds(parseInt(e.target.value) || 1)}
                     className="flex-1 bg-transparent text-center font-black text-2xl outline-none"
                   />
                   <button onClick={() => setRounds(rounds + 1)} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaPlus className="text-xs" /></button>
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-2 mr-2 uppercase tracking-widest">الأسئلة لكل طالب</label>
                 <div className="flex items-center gap-3 bg-slate-950/50 border-2 border-slate-800 rounded-2xl p-2 px-3 shadow-inner">
                   <button onClick={() => setQuestionsPerStudent(Math.max(1, questionsPerStudent - 1))} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaTimes className="rotate-45 text-xs" /></button>
                   <input 
                     type="number"
                     value={questionsPerStudent}
                     onChange={(e) => setQuestionsPerStudent(parseInt(e.target.value) || 1)}
                     className="flex-1 bg-transparent text-center font-black text-2xl outline-none"
                   />
                   <button onClick={() => setQuestionsPerStudent(questionsPerStudent + 1)} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaPlus className="text-xs" /></button>
                 </div>
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 mb-2 mr-2 uppercase tracking-widest">نظام الاختيار</label>
                 <div className="flex p-1 bg-slate-950/50 border-2 border-slate-800 rounded-2xl h-[56px]">
                   <button 
                     onClick={() => setGameMode("random")}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-500 ${gameMode === "random" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                   >
                     <FaDice /> عشوائي
                   </button>
                   <button 
                     onClick={() => setGameMode("manual")}
                     className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all duration-500 ${gameMode === "manual" ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"}`}
                   >
                     <FaUserFriends /> يدوي
                   </button>
                 </div>
               </div>
             </div>
          ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn bg-indigo-900/10 p-4 rounded-2xl border border-indigo-500/20">
                <div>
                  <label className="block text-xs font-bold text-indigo-300 mb-2 mr-2 uppercase tracking-widest">عدد الأسئلة المطلوبة</label>
                  <div className="flex items-center gap-3 bg-slate-950/50 border-2 border-indigo-500/30 rounded-2xl p-2 px-3 shadow-inner">
                    <button onClick={() => setQuestionsCount(Math.max(1, questionsCount - 1))} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaTimes className="rotate-45 text-xs" /></button>
                    <input 
                      type="number"
                      value={questionsCount}
                      onChange={(e) => setQuestionsCount(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-transparent text-center font-black text-2xl outline-none"
                    />
                    <button onClick={() => setQuestionsCount(questionsCount + 1)} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaPlus className="text-xs" /></button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-300 mb-2 mr-2 uppercase tracking-widest">عدد المحاولات المسموحة</label>
                  <div className="flex items-center gap-3 bg-slate-950/50 border-2 border-indigo-500/30 rounded-2xl p-2 px-3 shadow-inner">
                    <button onClick={() => setAttemptsCount(Math.max(1, attemptsCount - 1))} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaTimes className="rotate-45 text-xs" /></button>
                    <input 
                      type="number"
                      value={attemptsCount}
                      onChange={(e) => setAttemptsCount(parseInt(e.target.value) || 1)}
                      className="flex-1 bg-transparent text-center font-black text-2xl outline-none"
                    />
                    <button onClick={() => setAttemptsCount(attemptsCount + 1)} className="w-10 h-10 flex items-center justify-center bg-slate-900 rounded-xl hover:text-indigo-400 transition border border-white/5 shadow-lg"><FaPlus className="text-xs" /></button>
                  </div>
                </div>
             </div>
          )}

          {challengeType === "classroom" ? (
             <button 
               onClick={onStart}
               disabled={!selectedChallenge}
               className="w-full relative group disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
               <div className="relative py-5 bg-indigo-600 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 group-hover:bg-indigo-500 transition-all active:scale-95">
                 <FaPlay /> ابدأ المسابقة الآن
               </div>
             </button>
          ) : (
             <button 
               onClick={onAssign}
               disabled={!selectedChallenge || assigning}
               className="w-full relative group disabled:opacity-50 disabled:cursor-not-allowed"
             >
               <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-600 rounded-2xl blur opacity-30 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
               <div className="relative py-5 bg-teal-600 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 group-hover:bg-teal-500 transition-all active:scale-95">
                 {assigning ? <span className="animate-spin">⌛</span> : <FaCheck />}
                 تكليف جميع طلاب الفصل
               </div>
             </button>
          )}
        </div>
      </GlassCard>
    </div>

    <div className="lg:col-span-2 space-y-4">
      {challengeType === "individual" && sectionsList.length > 1 && (
         <div className="bg-indigo-900/10 border border-indigo-500/20 rounded-2xl p-4 mb-4">
           <label className="block text-xs font-bold text-indigo-300 mb-3 mr-2 uppercase tracking-widest">توسيع التكليف للفصول الأخرى</label>
           <div className="flex flex-wrap gap-2">
             {sectionsList.map(sec => {
               const key = `${sec.grade_level}|${sec.section}`;
               const isSelected = selectedSections.includes(key);
               const isCurrent = key === `${gradeId}|${sectionId}`;
               return (
                 <button
                   key={key}
                   disabled={isCurrent} // Always selected
                   onClick={() => toggleSection(key)}
                   className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? "bg-indigo-600 border-indigo-500 text-white" : "bg-slate-900/50 border-white/10 text-slate-400 hover:border-indigo-500/50"}`}
                 >
                   {sec.grade_level} - {sec.section} {isCurrent && "(الفصل الحالي)"}
                 </button>
               );
             })}
           </div>
         </div>
      )}

      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center font-black text-slate-300 shadow-inner">
            {students.length}
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-3 order-first">
             الطلاب <FaUserFriends className="text-cyan-400" />
          </h3>
        </div>
        {challengeType === "individual" && (
          <button 
             onClick={() => setSelectedStudentIds(selectedStudentIds.length === students.length ? [] : students.map(s => s.id))}
             className="text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors bg-indigo-500/10 px-3 py-1 rounded-md"
          >
            {selectedStudentIds.length === students.length ? "إلغاء تحديد الكل" : "تحديد الكل"}
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {students.map((s, idx) => (
          <div 
             key={s.id} 
             onClick={() => challengeType === "individual" && toggleStudent(s.id)}
             className={`group flex items-center gap-5 p-4 bg-slate-900/40 border rounded-3xl transition-all duration-300 animate-slideDown ${challengeType === "individual" ? "cursor-pointer hover:bg-slate-800/60" : ""} ${challengeType === "individual" && selectedStudentIds.includes(s.id) ? "border-indigo-500 bg-indigo-900/20" : "border-white/5"}`}
          >
            {challengeType === "individual" && (
               <div className={`w-5 h-5 shrink-0 rounded flex items-center justify-center border transition-colors ${selectedStudentIds.includes(s.id) ? "bg-indigo-600 border-indigo-500" : "bg-slate-800 border-white/20 group-hover:border-indigo-500/50"}`}>
                 {selectedStudentIds.includes(s.id) && <FaCheck className="text-white text-[10px]" />}
               </div>
            )}
            <div className="relative shrink-0">
              <img src={s.image_url || s.photo || s.imageUrl || "/images/1.webp"} className="w-14 h-14 rounded-full object-cover ring-2 ring-white/10 group-hover:ring-cyan-500 transition-all shadow-xl" alt="" />
              <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[9px] font-black px-2 py-0.5 rounded-lg border border-white/20 shadow-xl">
                 #{idx + 1}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <span className="block font-black text-md truncate group-hover:text-cyan-400 transition-colors mb-1">{s.name}</span>
              <span className="text-xs text-slate-500 font-bold flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> متصل
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
  );
};

const ManagerView = ({ gradeId, teacherId, onClose, onSwitchToImporter, fetchChallenges, setView, setSelectedChallenge, handleDialog, dialogConfig, setDialogConfig }) => {
  const [challenges, setChallenges] = useState([]);

  useEffect(() => {
    refresh();
  }, [gradeId]);

  const refresh = async () => {
    const { data, error } = await supabase
      .from("challenges")
      .select("*")
      .eq("grade_id", gradeId)
      .eq("teacher_id", teacherId);
    if (!error) setChallenges(data || []);
  };

  const handleDelete = (id) => {
    handleDialog("تأكيد الحذف", "حذف هذه المسابقة وكل أسئلتها؟ هذه الخطوة لا يمكن التراجع عنها.", "confirm", async () => {
      setDialogConfig(prev => ({...prev, show: false}));
      await supabase.from("challenges").delete().eq("id", id);
      refresh();
      fetchChallenges(teacherId);
    });
  };

  return (
    <div className="animate-slideUp space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-center bg-slate-900/60 p-6 rounded-[2rem] border border-white/5 shadow-2xl gap-6">
        <div className="flex items-center gap-5">
           <button onClick={onClose} className="p-3 bg-slate-950 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition border border-white/10">
             <FaArrowRight />
           </button>
           <div>
             <h2 className="text-2xl font-black text-white">مستودع الاختبارات</h2>
             <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">إدارة المحتوى الدراسي</p>
           </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => { setSelectedChallenge(null); setView("editor"); }}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm shadow-lg transition-all"
          >
            <FaPlus /> إنشاء مسابقة
          </button>
          <button 
            onClick={onSwitchToImporter}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-800 rounded-xl font-bold text-sm transition-all"
          >
            <FaUpload /> استيراد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
        {challenges.map((c, i) => (
          <GlassCard key={c.id} className="p-6 group hover:border-indigo-500/40 transition-all duration-500 animate-slideUp relative" style={{animationDelay: `${i * 100}ms`}}>
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative">
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-slate-950 rounded-xl border border-white/5">
                  <FaQuestionCircle className="text-xl text-indigo-400" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setSelectedChallenge(c); setView("editor"); }} className="w-8 h-8 flex items-center justify-center bg-slate-950 hover:bg-indigo-600 text-slate-500 hover:text-white rounded-lg transition border border-white/5"><FaCog className="text-sm" /></button>
                  <button onClick={() => handleDelete(c.id)} className="w-8 h-8 flex items-center justify-center bg-slate-950 hover:bg-rose-600 text-slate-500 hover:text-white rounded-lg transition border border-white/5"><FaTrash className="text-sm" /></button>
                </div>
              </div>
              
              <h3 className="text-xl font-black mb-1 group-hover:text-indigo-400 transition-colors leading-tight line-clamp-1">{c.lesson_name}</h3>
              <p className="text-indigo-400/60 font-black mb-6 uppercase tracking-widest text-[10px]">{c.subject_name}</p>
              
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-3 text-[10px] font-black text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-md border border-white/5"><FaRocket className="text-indigo-500" /> {c.questions?.length || 0} سؤال</span>
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
        {challenges.length === 0 && (
          <div className="col-span-full py-20 text-center bg-slate-900/20 rounded-[2rem] border-2 border-dashed border-slate-800 animate-fadeIn">
             <div className="p-6 bg-slate-950/50 rounded-full inline-block mb-6">
               <FaQuestionCircle className="text-5xl text-slate-800" />
             </div>
             <p className="text-slate-500 text-xl font-black">المستودع خالي</p>
             <button onClick={() => { setSelectedChallenge(null); setView("editor"); }} className="mt-6 px-8 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-black text-sm shadow-xl transition-all">إنشاء أول مسابقة</button>
          </div>
        )}
      </div>
    </div>
  );
};

const EditorView = ({ challenge, gradeId, teacherId, onClose, handleDialog }) => {
  const [subjectName, setSubjectName] = useState(challenge?.subject_name || "");
  const [lessonName, setLessonName] = useState(challenge?.lesson_name || "");
  const [questions, setQuestions] = useState(challenge?.questions || []);
  const [isSaving, setIsSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([{ 
      id: Date.now(), 
      text: "", 
      options: ["", ""], 
      correctIndex: 0 
    }, ...questions]);
  };

  const handleSave = async () => {
    if (!subjectName || !lessonName || questions.length === 0) {
      handleDialog("تنبيه", "يرجى إكمال البيانات الأساسية وإضافة سؤال واحد على الأقل", "warning");
      return;
    }
    setIsSaving(true);
    const data = {
      teacher_id: teacherId,
      grade_id: gradeId,
      subject_name: subjectName,
      lesson_name: lessonName,
      questions: questions
    };

    let error;
    if (challenge) {
      const { error: err } = await supabase.from("challenges").update(data).eq("id", challenge.id);
      error = err;
    } else {
      const { error: err } = await supabase.from("challenges").insert([data]);
      error = err;
    }

    if (!error) {
      handleDialog("نجاح", "تم الحفظ بنجاح", "success");
      onClose();
    } else handleDialog("خطأ", "حدث خطأ تقني أثناء الحفظ", "error");
    setIsSaving(false);
  };

  return (
    <div className="animate-slideUp max-w-6xl mx-auto space-y-8">
      <div className="bg-slate-900/60 rounded-[3rem] border border-white/10 shadow-2xl flex flex-col overflow-hidden">
        {/* Editor Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-slate-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-5">
            <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl shadow-xl">
              <FaPlus className="text-xl text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white">{challenge ? "تعديل المسابقة" : "إنشاء مسابقة"}</h2>
              <p className="text-slate-400 font-bold text-xs mt-1 uppercase tracking-[0.2em]">تجهيز المحتوى التفاعلي للمسابقة</p>
            </div>
          </div>
          <button onClick={onClose} className="p-4 bg-slate-800 hover:bg-rose-600 text-white rounded-2xl transition-all shadow-xl active:scale-95 group">
            <FaTimes className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {/* Scrollable Form */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 pb-60 space-y-8 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-xs font-black text-indigo-400 mr-2 uppercase tracking-[0.3em] flex items-center gap-2">
                <FaChalkboardTeacher className="text-sm" /> اسم المادة
              </label>
              <input 
                value={subjectName} 
                onChange={e => setSubjectName(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-800 p-3.5 rounded-[1.2rem] outline-none focus:border-indigo-500 transition-all font-black text-md shadow-inner"
                placeholder="مثال: التوحيد"
              />
            </div>
            <div className="space-y-4">
              <label className="text-xs font-black text-cyan-400 mr-2 uppercase tracking-[0.3em] flex items-center gap-2">
                <FaQuestionCircle className="text-sm" /> اسم الدرس
              </label>
              <input 
                value={lessonName} 
                onChange={e => setLessonName(e.target.value)}
                className="w-full bg-slate-950 border-2 border-slate-800 p-3.5 rounded-[1.2rem] outline-none focus:border-cyan-500 transition-all font-black text-md shadow-inner"
                placeholder="مثال: أركان الإيمان الستة"
              />
            </div>
          </div>

          <div className="space-y-8 pt-8 border-t border-white/5">
            <div className="flex justify-between items-center">
               <h3 className="text-xl font-black">الأسئلة <span className="bg-indigo-600/20 text-indigo-400 text-[10px] font-black px-3 py-1 rounded-full border border-indigo-500/20 ml-2">{questions.length}</span></h3>
               <button onClick={addQuestion} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center gap-2">
                 <FaPlus /> إضافة سؤال
               </button>
            </div>

            <div className="space-y-6">
              {questions.map((q, qIndex) => (
                <div key={q.id} className="p-5 bg-slate-950/50 border border-white/5 rounded-[2rem] space-y-6 relative">
                  <div className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center bg-slate-900 border border-white/5 rounded-xl text-slate-500 font-black text-xs">
                    {qIndex + 1}
                  </div>
                  
                  <div className="flex flex-col gap-6 pt-4">
                    <div className="flex-1 space-y-3">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mr-2">نص السؤال</label>
                      <textarea 
                        rows="2"
                        placeholder="اكتب السؤال هنا..." 
                        value={q.text}
                        onChange={e => {
                          const newQs = [...questions];
                          newQs[qIndex].text = e.target.value;
                          setQuestions(newQs);
                        }}
                        className="w-full bg-slate-900 border-2 border-slate-800 p-4 rounded-2xl outline-none focus:border-indigo-500 transition-all font-bold text-md resize-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {q.options.map((opt, optIndex) => (
                      <div key={optIndex} className={`group/opt relative flex items-center gap-4 p-2 pr-4 rounded-xl border-2 transition-all ${q.correctIndex === optIndex ? "bg-indigo-600/10 border-indigo-500" : "bg-slate-900 border-slate-800"}`}>
                        <input 
                          type="radio" 
                          name={`correct-${q.id}`} 
                          className="w-5 h-5 accent-indigo-500 cursor-pointer"
                          checked={q.correctIndex === optIndex}
                          onChange={() => {
                            const newQs = [...questions];
                            newQs[qIndex].correctIndex = optIndex;
                            setQuestions(newQs);
                          }}
                        />
                        <input 
                          placeholder={`الخيار ${optIndex + 1}`} 
                          value={opt}
                          onChange={e => {
                            const newQs = [...questions];
                            newQs[qIndex].options[optIndex] = e.target.value;
                            setQuestions(newQs);
                          }}
                          className="flex-1 bg-transparent py-2 outline-none font-bold text-sm"
                        />
                        <button 
                          onClick={() => {
                            const newQs = [...questions];
                            newQs[qIndex].options.splice(optIndex, 1);
                            if (newQs[qIndex].correctIndex >= newQs[qIndex].options.length) {
                              newQs[qIndex].correctIndex = 0;
                            }
                            setQuestions(newQs);
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-950 text-slate-600 hover:text-rose-500 transition active:scale-90"
                        ><FaTimes className="text-xs" /></button>
                      </div>
                    ))}
                    <button 
                      onClick={() => {
                        const newQs = [...questions];
                        newQs[qIndex].options.push("");
                        setQuestions(newQs);
                      }}
                      className="border-2 border-dashed border-slate-800 rounded-xl p-3 text-slate-500 font-bold text-xs hover:border-indigo-500/50 hover:text-indigo-400 transition-all bg-slate-900/10"
                    >+ إضافة خيار</button>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button 
                        onClick={() => setQuestions(questions.filter((_, i) => i !== qIndex))}
                        className="flex items-center gap-2 px-6 py-2 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all font-bold text-xs border border-rose-500/20"
                      >
                        <FaTrash /> حذف السؤال
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-950/95 backdrop-blur-xl">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="w-full relative group disabled:opacity-50"
          >
             <div className="absolute -inset-1 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-2xl blur opacity-20 animate-pulse"></div>
             <div className="relative py-3.5 bg-indigo-600 rounded-2xl font-black text-lg shadow-2xl flex items-center justify-center gap-3 transition-all group-hover:bg-indigo-500 active:scale-95">
               {isSaving ? (
                 <div className="flex items-center gap-3">
                   <div className="w-5 h-5 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                   <span>جاري الحفظ...</span>
                 </div>
               ) : (
                 <><FaCheck /> حفظ المسابقة النهائية</>
               )}
             </div>
          </button>
        </div>
      </div>
    </div>
  );
};

const GameView = ({ challenge, students, rounds, questionsPerStudent, mode, teacherId, sectionId, gradeId, onClose }) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [gameState, setGameState] = useState("picking");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const studentQuestionCount = scoreHistory.reduce((acc, h) => {
    acc[h.student.id] = (acc[h.student.id] || 0) + 1;
    return acc;
  }, {});

  const eligibleStudents = students.filter(s => (studentQuestionCount[s.id] || 0) < questionsPerStudent);

  useEffect(() => {
    let timer;
    if (gameState === "question" && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === "question") {
      handleAnswer(-1);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startPicking = () => {
    setGameState("picking");
    setSelectedStudent(null);
    setTimeLeft(60);
  };

  const onStudentSelected = (student) => {
    setSelectedStudent(student);
    const randomQ = challenge.questions[Math.floor(Math.random() * challenge.questions.length)];
    setCurrentQuestion(randomQ);
    setTimeLeft(60);
    setGameState("question");
  };

  const handleAnswer = async (selectedIndex) => {
    const isCorrect = selectedIndex === (currentQuestion?.correctIndex ?? -99);
    const newHistory = [...scoreHistory, { student: selectedStudent, correct: isCorrect, question: currentQuestion?.text || "سؤال منتهي" }];
    setScoreHistory(newHistory);
    setGameState("feedback");
  };

  const nextAction = () => {
    if (currentRound >= rounds) finishGame();
    else { setCurrentRound(prev => prev + 1); startPicking(); }
  };

  const finishGame = async () => {
    setGameState("summary");
    try {
      const { data: sessionData, error: sessionError } = await supabase.from("challenge_sessions").insert([{
        challenge_id: challenge.id,
        section_id: sectionId,
        grade_id: gradeId,
        teacher_id: teacherId,
        rounds: currentRound
      }]).select().single();

      if (!sessionError && sessionData) {
        const historyRows = scoreHistory.map(h => ({
          session_id: sessionData.id,
          student_id: h.student.id,
          is_correct: h.correct,
          question_text: h.question,
          teacher_id: teacherId,
          grade_id: gradeId,
          section_id: sectionId // Added section_id here for better filtering
        }));
        const { error: historyError } = await supabase.from("challenge_history").insert(historyRows);
        if (historyError) console.error("History saving error:", historyError);
      } else if (sessionError) {
        console.error("Session saving error:", sessionError);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="animate-fadeIn relative min-h-[600px] flex flex-col pb-8">
      {/* Game Header HUD */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 bg-slate-900/60 backdrop-blur-2xl p-6 rounded-[2rem] border border-white/5 shadow-2xl animate-slideDown gap-6">
        <div className="flex flex-col md:flex-row items-center gap-8">
           <div className="text-center md:text-right">
             <span className="block text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 opacity-60">المهمة الحالية</span>
             <h4 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-cyan-400 truncate max-w-[250px] leading-tight">{challenge.lesson_name}</h4>
           </div>
           <div className="w-[1px] h-10 bg-white/10 hidden md:block"></div>
           <div className="flex flex-col items-center">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1 opacity-60">الجولة</span>
             <div className="flex items-center gap-3 bg-slate-950 px-4 py-1.5 rounded-xl border border-white/5 shadow-inner">
               <span className="text-2xl font-black text-white">{currentRound}</span>
               <span className="text-slate-600 font-bold text-sm">/</span>
               <span className="text-sm font-black text-slate-500">{rounds}</span>
             </div>
           </div>
        </div>
        
        {gameState === "question" && (
          <div className="relative flex flex-col items-center">
            <div className={`text-4xl font-black transition-all duration-300 ${timeLeft <= 10 ? "text-rose-500 animate-pulse scale-110" : "text-cyan-400"}`}>
              {timeLeft}
            </div>
            <span className="text-[8px] font-black text-slate-500 mt-1 uppercase">ثانية</span>
          </div>
        )}

        <button 
          onClick={() => { if(window.confirm("مغادرة المسابقة؟")) onClose(); }}
          className="px-8 py-3 bg-rose-600/10 hover:bg-rose-600 text-rose-500 hover:text-white rounded-xl transition-all font-black border border-rose-500/20 text-xs shadow-xl active:scale-95"
        >
          إنهاء الجلسة
        </button>
      </div>

      {gameState === "picking" && (
        <div className="flex-1 flex flex-col items-center justify-center animate-slideUp">
          {eligibleStudents.length === 0 ? (
             <div className="text-center py-20 animate-fadeIn">
               <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/30">
                 <FaCheck className="text-5xl text-emerald-500" />
               </div>
               <h3 className="text-3xl font-black text-white mb-4">تم اكتمال أسئلة جميع الطلاب!</h3>
               <p className="text-slate-400 mb-8 font-bold">لقد أجاب كل طالب على الحد الأقصى من الأسئلة المخصصة له.</p>
               <button onClick={finishGame} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] rounded-2xl text-white font-black text-xl transition-all active:scale-95">عرض النتائج الشاملة</button>
             </div>
          ) : mode === "random" ? (
            <div className="w-full">
              <WheelOfFortune students={eligibleStudents} onResult={onStudentSelected} />
            </div>
          ) : (
            <div className="w-full space-y-12 py-8">
               <div className="text-center space-y-3">
                 <h3 className="text-4xl font-black text-white tracking-widest uppercase">اختر الطالب التالي</h3>
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-60 line-after">اضغط على صورة الطالب لبدء السؤال</p>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-4">
                  {eligibleStudents.map((s, i) => (
                    <button 
                      key={s.id} 
                      onClick={() => onStudentSelected(s)}
                      className="group relative p-4 bg-slate-900/60 border-2 border-white/5 rounded-[2.5rem] hover:border-indigo-500 transition-all duration-500 active:scale-90 animate-slideUp shadow-2xl"
                      style={{animationDelay: `${i * 30}ms`}}
                    >
                      <div className="relative mb-4">
                        <img src={s.image_url || s.photo || s.imageUrl || "/images/1.webp"} className="w-24 h-24 rounded-full mx-auto object-cover ring-2 ring-transparent group-hover:ring-indigo-500 transition-all shadow-xl" alt="" />
                      </div>
                      <span className="block font-black text-md text-slate-300 group-hover:text-white truncate transition-colors text-center">{s.name}</span>
                    </button>
                  ))}
               </div>
            </div>
          )}
        </div>
      )}

      {gameState === "question" && selectedStudent && currentQuestion && (
        <div className="max-w-4xl mx-auto w-full space-y-12 py-4 animate-slideUp">
           <div className="relative group text-center space-y-6">
              <div className="relative inline-block">
                <img src={selectedStudent.image_url || selectedStudent.photo || selectedStudent.imageUrl || "/images/1.webp"} className="w-40 h-40 rounded-full mx-auto border-4 border-cyan-500/20 ring-2 ring-cyan-500 shadow-[0_0_50px_rgba(34,211,238,0.2)] object-cover animate-popIn" alt="" />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-cyan-500 text-slate-900 px-8 py-2 rounded-xl font-black text-lg shadow-xl whitespace-nowrap">
                   {selectedStudent.name}
                </div>
              </div>
           </div>

           <GlassCard className="p-12 md:p-16 text-center relative overflow-hidden group border-indigo-500/20 shadow-2xl animate-slideUp [animation-delay:200ms]">
              <div className="absolute top-0 left-0 w-full h-1 bg-slate-950 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-linear ${timeLeft <= 10 ? "bg-rose-500" : "bg-cyan-500"}`}
                  style={{ width: `${(timeLeft / 60) * 100}%` }}
                ></div>
              </div>

              {/* Question Text */}
              <h4 className="relative text-3xl md:text-5xl font-black leading-snug mb-16 tracking-tight animate-fadeIn text-white drop-shadow-lg">
                {currentQuestion.text}
              </h4>
              
              {/* Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10 max-w-3xl mx-auto">
                 {currentQuestion.options.map((opt, idx) => (
                   <button 
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    className="group/btn relative py-8 px-6 bg-slate-950/90 border-2 border-slate-800 rounded-3xl transition-all duration-500 hover:border-indigo-500 active:scale-95 shadow-xl overflow-hidden"
                   >
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 to-transparent opacity-0 group-hover/btn:opacity-100 transition-all duration-500"></div>
                     <div className="relative flex items-center justify-between gap-4 pointer-events-none">
                        <div className="w-10 h-10 rounded-lg bg-slate-900 group-hover/btn:bg-white/10 flex items-center justify-center text-md font-black text-indigo-400 group-hover/btn:text-white transition-all shadow-xl">
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1 text-xl font-black text-slate-400 group-hover/btn:text-white transition-colors text-right">{opt}</span>
                     </div>
                   </button>
                 ))}
              </div>
           </GlassCard>
        </div>
      )}

      {gameState === "feedback" && selectedStudent && (
        <div className="flex-1 flex flex-col items-center justify-center space-y-12 animate-slideUp py-12">
           <div className="relative group">
             <div className={`absolute inset-[-2rem] blur-[80px] opacity-40 rounded-full animate-pulse ${scoreHistory[scoreHistory.length-1].correct ? "bg-emerald-500" : "bg-rose-500"}`}></div>
             <div className={`relative w-48 h-48 rounded-[3rem] flex items-center justify-center text-7xl shadow-2xl animate-popIn ring-4 ring-white/10 ${scoreHistory[scoreHistory.length-1].correct ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"}`}>
               {scoreHistory[scoreHistory.length-1].correct ? <FaCheck /> : <FaTimes />}
             </div>
           </div>

           <div className="text-center space-y-4">
              <h2 className="text-5xl font-black text-white tracking-tighter drop-shadow-2xl">
                {scoreHistory[scoreHistory.length-1].correct ? "إجابة صحيحة!" : "محاولة جيدة"}
              </h2>
              <p className="text-lg text-slate-400 font-bold max-w-md mx-auto leading-relaxed">
                {scoreHistory[scoreHistory.length-1].correct 
                  ? `أحسنت يا بطل ${selectedStudent.name}. استمر في هذا الأداء الرائع!` 
                  : `لا بأس يا ${selectedStudent.name}. تعلم من هذا السؤال لتكون أقوى في المرة القادمة!`}
              </p>
              
              {!scoreHistory[scoreHistory.length-1].correct && currentQuestion && (
                <div className="mt-8 animate-fadeIn">
                  <span className="block text-xs font-black text-rose-400 uppercase tracking-widest mb-3">الجواب الصحيح هو</span>
                  <div className="inline-block px-10 py-5 bg-emerald-600/20 border-2 border-emerald-500/30 rounded-2xl text-2xl font-black text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                    {currentQuestion.options[currentQuestion.correctIndex]}
                  </div>
                </div>
              )}
           </div>
           
           <button 
            onClick={nextAction}
            className="group relative"
           >
             <div className="relative bg-white text-slate-900 rounded-2xl font-black text-xl px-12 py-4 shadow-2xl transition-all group-hover:scale-105 active:scale-95">
               {currentRound >= rounds ? "عرض النتائج النهائية" : "الجولة التالية"}
               <FaArrowLeft className="inline-block mr-4 text-sm group-hover:translate-x-[-5px] transition-transform" />
             </div>
           </button>
        </div>
      )}

      {gameState === "summary" && (
        <div className="max-w-5xl mx-auto w-full py-12 space-y-16 animate-slideUp">
           <div className="text-center space-y-6 relative">
              <div className="inline-flex items-center gap-3 p-3 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 mb-2 text-indigo-400 font-bold px-8 group transition-all shadow-xl">
                 <FaAward className="animate-bounce" />
                 <span className="text-sm">تم إتمام التحدي بنجاح</span>
              </div>
              <h2 className="text-6xl font-black text-white tracking-tighter shadow-indigo-500/20 drop-shadow-2xl">لوحة الشرف</h2>
           </div>

           <GlassCard className="p-8 md:p-12 border-indigo-500/20 shadow-2xl relative">
              <div className="space-y-4">
                 {(() => {
                    const stats = {};
                    scoreHistory.forEach(h => { if (h.correct) stats[h.student.id] = (stats[h.student.id] || 0) + 1; });
                    const sorted = Object.entries(stats).sort((a,b) => b[1] - a[1]);
                    return sorted.length > 0 ? sorted.map(([id, score], idx) => {
                      const student = students.find(s => s.id === id);
                      return (
                        <div key={id} className={`flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-700 animate-slideUp group ${idx === 0 ? "bg-indigo-600/20 border-indigo-500/50" : "bg-slate-900/60 border-white/5"}`} style={{animationDelay: `${idx * 150}ms`}}>
                           <div className="flex items-center gap-6">
                              <div className="w-12 h-12 flex items-center justify-center text-2xl font-black text-indigo-400 opacity-60">#{idx + 1}</div>
                              <div className="relative">
                                <img src={student?.image_url || student?.photo || "/images/1.webp"} className="w-16 h-16 rounded-full object-cover ring-2 ring-white/10 shadow-xl" alt="" />
                                {idx === 0 && <div className="absolute -top-3 -right-3 text-3xl animate-bounce">👑</div>}
                              </div>
                              <span className="text-2xl font-black truncate max-w-[200px]">{student?.name}</span>
                           </div>
                           <div className="text-4xl font-black text-white px-8">
                             {score} <span className="text-[10px] text-slate-500 uppercase">نقطة</span>
                           </div>
                        </div>
                      );
                    }) : (
                      <div className="py-20 text-center text-slate-600 font-bold">لا توجد إجابات صحيحة في هذه الجولة.</div>
                    );
                 })()}
              </div>
           </GlassCard>
           
           <div className="flex flex-col md:flex-row gap-6">
              <button 
                onClick={onClose}
                className="flex-1 py-6 bg-slate-900 hover:bg-slate-800 border border-white/5 rounded-3xl font-black text-xl transition-all shadow-2xl active:scale-95"
              >
                العودة للرئيسية
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="flex-1 py-6 bg-indigo-600 hover:bg-indigo-500 rounded-3xl font-black text-xl transition-all shadow-lg active:scale-95"
              >
                تحدي جديد
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

const HistoryView = ({ gradeId, sectionId, teacherId, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, [gradeId, sectionId, teacherId]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      if (!teacherId || !gradeId) return;
      
      let query = supabase
        .from("challenge_history")
        .select("*, student:student_id(name, photo)")
        .eq("grade_id", gradeId)
        .eq("teacher_id", teacherId);
      
      if (sectionId) {
        query = query.eq("section_id", sectionId);
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      
      if (!error && data) {
        const aggregated = {};
        data.forEach(h => {
          const sId = h.student_id;
          if (!sId || !h.student) return;

          const sName = h.student.name;
          const sPhoto = h.student.photo || "/images/1.webp";

          if (!aggregated[sId]) {
            aggregated[sId] = { 
              id: sId,
              name: sName, 
              photo: sPhoto, 
              total: 0, 
              correct: 0 
            };
          }
          aggregated[sId].total += 1;
          if (h.is_correct) aggregated[sId].correct += 1;
        });
        
        const sorted = Object.values(aggregated).sort((a,b) => b.correct - a.correct || a.name.localeCompare(b.name));
        setHistory(sorted);
      } else if (error) {
        console.error("Leaderboard fetch error:", error);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const topThree = history.slice(0, 3);
  const theRest = history.slice(3);

  return (
    <div className="animate-fadeIn space-y-10 pb-20">
       <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-950 to-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl gap-8">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30 shadow-inner">
                <FaAward className="text-3xl text-amber-400" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-white tracking-tight">لوحة الشرف</h2>
                <p className="text-slate-400 text-sm font-bold mt-1 uppercase tracking-widest">أبطال المسابقات التفاعلية</p>
             </div>
          </div>
          <button 
             onClick={onClose}
             className="group flex items-center gap-3 px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/10 transition-all font-black text-sm shadow-xl"
          >
             <FaArrowRight className="group-hover:-translate-x-1 transition-transform" />
             عودة للملخص
          </button>
       </div>

       {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
             <div className="w-16 h-16 border-4 border-amber-500/10 border-t-amber-500 rounded-full animate-spin"></div>
             <p className="text-slate-500 font-black tracking-widest animate-pulse uppercase">جاري جلب الأبطال...</p>
          </div>
       ) : history.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-white/5 opacity-50 text-center">
             <FaAward className="text-7xl text-slate-700 mb-6" />
             <p className="text-2xl font-black text-white mb-2">لا يوجد متصدرون حالياً</p>
          </div>
       ) : (
          <div className="space-y-12">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-5xl mx-auto px-4">
                {topThree[1] && (
                   <div className="order-2 md:order-1 animate-slideUp" style={{animationDelay: '100ms'}}>
                      <PodiumCard student={topThree[1]} rank={2} color="slate-400" bgColor="bg-slate-500/10" borderColor="border-slate-500/30" />
                   </div>
                )}
                
                {topThree[0] && (
                   <div className="order-1 md:order-2 scale-110 relative z-10 animate-slideUp" style={{animationDelay: '0ms'}}>
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex flex-col items-center">
                         <FaAward className="text-5xl text-yellow-500 animate-bounce" />
                      </div>
                      <PodiumCard student={topThree[0]} rank={1} color="yellow-500" bgColor="bg-amber-500/10" borderColor="border-amber-500/40" />
                   </div>
                )}

                {topThree[2] && (
                   <div className="order-3 animate-slideUp" style={{animationDelay: '200ms'}}>
                      <PodiumCard student={topThree[2]} rank={3} color="orange-400" bgColor="bg-orange-500/10" borderColor="border-orange-500/30" />
                   </div>
                )}
             </div>

             {theRest.length > 0 && (
                <div className="animate-fadeIn" style={{animationDelay: '400ms'}}>
                   <GlassCard className="border-white/5 shadow-2xl overflow-hidden">
                      <div className="overflow-x-auto custom-scrollbar">
                         <table className="w-full text-right border-collapse">
                            <thead className="bg-slate-950/80 text-slate-500 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                               <tr>
                                  <th className="p-8">الترتيب</th>
                                  <th className="p-8">البطل</th>
                                  <th className="p-8 text-center">إجابات صحيحة</th>
                                  <th className="p-8 text-center">نسبة النجاح</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 bg-slate-900/20">
                               {theRest.map((h, i) => (
                                  <tr key={h.id} className="group hover:bg-white/[0.02] transition-all duration-500">
                                     <td className="p-8">
                                        <span className="w-10 h-10 flex items-center justify-center bg-slate-950 rounded-xl border border-white/5 font-black text-slate-500 group-hover:border-indigo-500/30 group-hover:text-indigo-400 transition-all">
                                           {i + 4}
                                        </span>
                                     </td>
                                     <td className="p-8">
                                        <div className="flex items-center gap-5">
                                           <img 
                                              src={h.photo || "/images/1.webp"} 
                                              className="w-12 h-12 rounded-2xl object-cover ring-2 ring-white/5 group-hover:ring-indigo-500/30 transition-all" 
                                              alt={h.name} 
                                           />
                                           <span className="text-xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tight">{h.name}</span>
                                        </div>
                                     </td>
                                     <td className="p-8 text-center">
                                        <span className="text-2xl font-black text-emerald-400 tabular-nums">{h.correct}</span>
                                     </td>
                                     <td className="p-8">
                                        <div className="flex flex-col items-center gap-2">
                                           <div className="w-32 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 shadow-inner">
                                              <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400" style={{width: `${(h.correct / h.total) * 100}%`}}></div>
                                           </div>
                                           <span className="text-[10px] font-black text-slate-500 uppercase">{Math.round((h.correct / h.total) * 100)}% دقة</span>
                                        </div>
                                     </td>
                                  </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                   </GlassCard>
                </div>
             )}
          </div>
       )}
    </div>
  );
};

const PodiumCard = ({ student, rank, color, bgColor, borderColor }) => (
   <div className={`${bgColor} ${borderColor} border-2 p-8 rounded-[3rem] text-center relative shadow-2xl transition-all duration-700 hover:-translate-y-2`}>
      <div className={`absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-2xl flex items-center justify-center bg-slate-950 border-2 ${borderColor} shadow-xl z-20`}>
         <span className={`text-xl font-black text-${color}`}>#{rank}</span>
      </div>
      
      <div className="relative mb-6">
         <div className={`absolute -inset-2 bg-${color} rounded-[2.5rem] blur-xl opacity-20`}></div>
         <img 
            src={student.photo || "/images/1.webp"} 
            className={`relative w-28 h-28 mx-auto rounded-[2rem] object-cover border-4 ${borderColor} shadow-2xl`} 
            alt={student.name} 
         />
      </div>
      
      <h3 className="text-2xl font-black text-white mb-2 truncate px-2">{student.name}</h3>
      <div className="flex items-center justify-center gap-3">
         <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-white/5">
            <span className={`block text-2xl font-black text-${color}`}>{student.correct}</span>
            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-tighter">صح</span>
         </div>
         <div className="bg-slate-950/80 px-4 py-2 rounded-2xl border border-white/5">
            <span className="block text-2xl font-black text-white">{Math.round((student.correct / student.total) * 100)}%</span>
            <span className="block text-[8px] font-black text-slate-500 uppercase tracking-tighter">دقة</span>
         </div>
      </div>
   </div>
);

const AssignmentsView = ({ gradeId, teacherId, onClose, handleDialog, dialogConfig, setDialogConfig }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchAssignments();
  }, [gradeId, teacherId]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, section, photo, grades')
        .eq('teacher_id', teacherId)
        .eq('grade_level', gradeId);

      if (!error && data) {
        const assignmentMap = {};

        data.forEach(student => {
          const assigned = student.grades?.assigned_challenges || [];
          assigned.forEach(a => {
            if (!assignmentMap[a.id]) {
               assignmentMap[a.id] = {
                 ...a,
                 students: []
               };
            }
            assignmentMap[a.id].students.push(student);
          });
        });

        setAssignments(Object.values(assignmentMap).sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at)));
      }
    } catch (err) {
      console.error("Error fetching assignments:", err);
    }
    setLoading(false);
  };

  const handleDelete = (assignmentId) => {
    handleDialog("تأكيد الحذف", "حذف هذا التكليف من جميع الطلاب المعينين لهم؟ لا يمكن التراجع عن هذه الخطوة.", "confirm", async () => {
       setDialogConfig(prev => ({...prev, show: false}));
       const targetAssignment = assignments.find(a => a.id === assignmentId);
       if (!targetAssignment) return;

       for (const student of targetAssignment.students) {
         const { data, error } = await supabase.from('students').select('grades').eq('id', student.id).single();
         if (!error && data) {
           const currentGrades = data.grades || {};
           const assignedChallenges = currentGrades.assigned_challenges || [];
           const newAssigned = assignedChallenges.filter(a => a.id !== assignmentId);
           await supabase.from('students').update({ grades: { ...currentGrades, assigned_challenges: newAssigned } }).eq('id', student.id);
         }
       }
       fetchAssignments();
    });
  };

  return (
    <div className="space-y-8 animate-fadeIn pb-24">
       <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-slate-950 to-slate-900 p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl backdrop-blur-xl gap-8">
          <div className="flex items-center gap-6">
             <div className="w-16 h-16 bg-indigo-600/20 rounded-2xl flex items-center justify-center border border-indigo-500/30 shadow-inner">
                <FaTasks className="text-3xl text-indigo-400" />
             </div>
             <div>
                <h2 className="text-3xl font-black text-white tracking-tight">إدارة التكاليف</h2>
                <p className="text-slate-400 text-sm font-bold mt-1">متابعة دقيقة لنتائج الطلاب في التحديات الفردية</p>
             </div>
          </div>
          <button 
             onClick={onClose}
             className="group flex items-center gap-3 px-8 py-3.5 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl border border-white/10 transition-all font-black text-sm shadow-xl"
          >
             <FaArrowRight className="group-hover:-translate-x-1 transition-transform" />
             عودة للملخص
          </button>
       </div>

       {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
             <div className="w-16 h-16 border-4 border-indigo-500/10 border-t-indigo-500 rounded-full animate-spin"></div>
             <p className="text-slate-500 font-black tracking-widest animate-pulse">جاري جلب النتائج والبيانات...</p>
          </div>
       ) : assignments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-white/5 opacity-50 text-center">
             <FaTasks className="text-7xl text-slate-700 mb-6" />
             <p className="text-2xl font-black text-white">لا توجد تكاليف حالياً</p>
          </div>
       ) : (
          <div className="grid grid-cols-1 gap-8">
             {assignments.map((a, idx) => {
                const completedCount = a.students.filter(s => {
                   const challenge = s.grades?.assigned_challenges?.find(sc => sc.id === a.id);
                   return challenge && challenge.attempts_used > 0;
                }).length;

                return (
                   <div key={a.id} className={`group bg-slate-900/40 rounded-[2.5rem] border transition-all duration-700 overflow-hidden ${expandedId === a.id ? 'ring-2 ring-indigo-500/50 border-indigo-500/30 bg-slate-900/90 shadow-[0_0_50px_rgba(79,70,229,0.15)]' : 'border-white/5 hover:border-white/10 hover:bg-slate-900/60'}`} style={{animationDelay: `${idx * 100}ms`}}>
                      <div 
                         className="p-8 md:p-10 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-8"
                         onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                      >
                         <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-700 rounded-[2rem] flex items-center justify-center text-white text-3xl shadow-2xl group-hover:rotate-6 transition-transform">
                               <FaGamepad />
                            </div>
                            <div>
                               <div className="flex items-center gap-3 mb-1">
                                  <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-black rounded-full border border-indigo-500/20 uppercase tracking-tighter">مسابقة تفاعلية</span>
                                  <span className="text-slate-600 font-bold text-xs">• {a.subject_name}</span>
                               </div>
                               <h3 className="text-2xl md:text-3xl font-black text-white group-hover:text-indigo-400 transition-colors">"{a.lesson_name}"</h3>
                               <div className="flex flex-wrap gap-5 mt-3 text-xs text-slate-500 font-bold">
                                  <span className="flex items-center gap-2"><FaQuestionCircle className="text-indigo-500 text-sm" /> {a.questions_count} أسئلة</span>
                                  <span className="flex items-center gap-2"><FaStopwatch className="text-amber-500" /> {a.attempts_allowed} محاولات</span>
                                  <span className="flex items-center gap-2"><FaHistory className="text-blue-500" /> {new Date(a.assigned_at).toLocaleDateString('ar-SA')}</span>
                               </div>
                            </div>
                         </div>

                         <div className="flex items-center gap-4 self-end md:self-center">
                            <div className="px-6 py-3 bg-slate-950/50 rounded-2xl border border-white/5 text-center min-w-[120px] shadow-inner">
                               <span className="block text-[10px] text-slate-500 uppercase font-black mb-1">الإنجاز</span>
                               <span className="block text-2xl font-black text-indigo-400">{completedCount} / {a.students.length}</span>
                            </div>
                            
                            <button 
                               onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                               className="p-4 bg-rose-500/10 text-rose-500 hover:bg-rose-600 hover:text-white rounded-2xl border border-rose-500/20 transition-all shadow-lg active:scale-90"
                            >
                               <FaTrash />
                            </button>

                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 transition-transform duration-500 ${expandedId === a.id ? 'rotate-180 bg-indigo-500/20 border-indigo-500/30' : ''}`}>
                               <FaArrowLeft className="-rotate-90 text-slate-500" />
                            </div>
                         </div>
                      </div>

                      {expandedId === a.id && (
                         <div className="border-t border-white/10 bg-slate-950/40 p-8 md:p-12 animate-slideUp">
                            <div className="mb-10 flex items-center justify-between">
                               <h4 className="text-xl font-black text-white flex items-center gap-3">
                                  <div className="w-2 h-8 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                                  نتائج الطلاب التفصيلية
                               </h4>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                               {a.students.map(student => {
                                  const challenge = student.grades?.assigned_challenges?.find(sc => sc.id === a.id);
                                  const bestScore = challenge?.best_score ?? 0;
                                  const used = challenge?.attempts_used || 0;
                                  const isComplete = used > 0;
                                  
                                  return (
                                     <div key={student.id} className={`relative bg-slate-900 border border-white/5 p-5 rounded-[2.5rem] flex items-center gap-5 hover:border-indigo-500/40 transition-all duration-500 shadow-xl ${isComplete ? 'ring-1 ring-indigo-500/20 bg-indigo-900/10' : ''}`}>
                                        <div className="relative flex-shrink-0">
                                           <img 
                                              src={student.photo || '/images/1.webp'} 
                                              alt={student.name} 
                                              className={`w-16 h-16 rounded-full object-cover border-2 transition-all duration-500 ${isComplete ? 'border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'border-slate-800 opacity-40 filter grayscale'}`} 
                                           />
                                           {isComplete && (
                                              <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-amber-600 text-slate-950 text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-2 border-slate-900 shadow-2xl">
                                                 {bestScore}
                                              </div>
                                           )}
                                        </div>
                                        <div className="flex-1 truncate text-right">
                                           <h5 className="text-[14px] font-black text-white truncate mb-2">{student.name}</h5>
                                           <div className="flex flex-col gap-1">
                                              <div className="flex justify-between items-center text-[10px] font-bold">
                                                 <span className="text-slate-500">المحاولات: <span className={used >= a.attempts_allowed ? 'text-rose-400' : 'text-indigo-400'}>{used}/{a.attempts_allowed}</span></span>
                                                 <span className="text-slate-300">الدرجة: <span className="text-emerald-400">{bestScore}/{a.questions_count}</span></span>
                                              </div>
                                              <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden shadow-inner">
                                                 <div 
                                                    className={`h-full transition-all duration-1000 ${isComplete ? 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`} 
                                                    style={{width: `${(used / a.attempts_allowed) * 100}%`}}
                                                 ></div>
                                              </div>
                                           </div>
                                        </div>
                                     </div>
                                  );
                               })}
                            </div>
                         </div>
                      )}
                   </div>
                );
             })}
          </div>
       )}
    </div>
  );
};

export default ChallengePage;
