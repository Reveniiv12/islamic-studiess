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
  FaChalkboardTeacher
} from "react-icons/fa";
import WheelOfFortune from "../components/WheelOfFortune";
import ChallengeImporter from "../components/ChallengeImporter";

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
  const [gameMode, setGameMode] = useState("random");

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setTeacherId(user.id);
        fetchStudents(user.id);
        fetchChallenges(user.id);
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
    if (!error) setStudents(data);
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
              gameMode={gameMode}
              setGameMode={setGameMode}
              onStart={handleStartGame}
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
            />
          )}

          {view === "game" && selectedChallenge && (
            <GameView 
              challenge={selectedChallenge} 
              students={students} 
              rounds={rounds} 
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
            />
          )}
        </div>
      </main>

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

const SetupView = ({ challenges, students, selectedChallenge, setSelectedChallenge, rounds, setRounds, gameMode, setGameMode, onStart }) => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2 mr-2 uppercase tracking-widest">عدد الجولات</label>
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
              <label className="block text-xs font-bold text-slate-500 mb-2 mr-2 uppercase tracking-widest">نظام الاختيار</label>
              <div className="flex p-1 bg-slate-950/50 border-2 border-slate-800 rounded-2xl">
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
        </div>
      </GlassCard>
    </div>

    <div className="lg:col-span-2 space-y-4">
      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center font-black text-slate-300 shadow-inner">
            {students.length}
          </div>
          <h3 className="text-xl font-black text-white flex items-center gap-3 order-first">
             الطلاب <FaUserFriends className="text-cyan-400" />
          </h3>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 max-h-[500px] overflow-y-auto pr-1 custom-scrollbar">
        {students.map((s, idx) => (
          <div key={s.id} className="group flex items-center gap-5 p-4 bg-slate-900/40 border border-white/5 rounded-3xl hover:bg-slate-800/60 hover:border-cyan-500/30 transition-all duration-300 animate-slideDown">
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

const ManagerView = ({ gradeId, teacherId, onClose, onSwitchToImporter, fetchChallenges, setView, setSelectedChallenge }) => {
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

  const handleDelete = async (id) => {
    if (window.confirm("حذف هذه المسابقة وكل أسئلتها؟ هذه الخطوة لا يمكن التراجع عنها.")) {
      await supabase.from("challenges").delete().eq("id", id);
      refresh();
      fetchChallenges(teacherId);
    }
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

const EditorView = ({ challenge, gradeId, teacherId, onClose }) => {
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
      alert("يرجى إكمال البيانات الأساسية وإضافة سؤال واحد على الأقل");
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
      alert("تم الحفظ بنجاح");
      onClose();
    } else alert("حدث خطأ تقني أثناء الحفظ");
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

const GameView = ({ challenge, students, rounds, mode, teacherId, sectionId, gradeId, onClose }) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [gameState, setGameState] = useState("picking");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [scoreHistory, setScoreHistory] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

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
          {mode === "random" ? (
            <div className="w-full">
              <WheelOfFortune students={students} onResult={onStudentSelected} />
            </div>
          ) : (
            <div className="w-full space-y-12 py-8">
               <div className="text-center space-y-3">
                 <h3 className="text-4xl font-black text-white tracking-widest uppercase">اختر الطالب التالي</h3>
                 <p className="text-slate-500 text-sm font-bold uppercase tracking-widest opacity-60 line-after">اضغط على صورة الطالب لبدء السؤال</p>
               </div>
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 px-4">
                  {students.map((s, i) => (
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
    const fetch = async () => {
      if (!teacherId || !gradeId) return;
      
      const { data, error } = await supabase
        .from("challenge_history")
        .select("*, student:student_id(name, image_url, image, photo, photo_url)")
        .eq("grade_id", gradeId)
        .eq("teacher_id", teacherId)
        .order("created_at", { ascending: false });
      
      if (!error && data) {
        const aggregated = {};
        data.forEach(h => {
          const sId = h.student_id;
          if (!sId) return;

          // Standardize student info extraction
          const sName = h.student?.name || "طالب مجهول";
          const sPhoto = h.student?.image_url || h.student?.photo || h.student?.image || h.student?.photo_url || "/images/1.webp";

          if (!aggregated[sId]) {
            aggregated[sId] = { 
              name: sName, 
              photo: sPhoto, 
              total: 0, 
              correct: 0 
            };
          }
          aggregated[sId].total += 1;
          if (h.is_correct) aggregated[sId].correct += 1;
        });
        
        // Convert to array and sort by correct answers
        const sorted = Object.values(aggregated).sort((a,b) => b.correct - a.correct);
        setHistory(sorted);
      } else if (error) {
        console.error("Hall of Fame fetch error:", error);
      }
      setLoading(false);
    };
    fetch();
  }, [gradeId, teacherId]);

  return (
    <div className="animate-slideUp space-y-10 pb-12">
       <div className="flex items-center gap-6 bg-slate-900/40 p-6 rounded-[2rem] border border-white/5 shadow-2xl">
         <button onClick={onClose} className="w-14 h-14 shrink-0 flex items-center justify-center bg-slate-950 rounded-2xl text-slate-400 hover:text-white transition-all border border-white/5 shadow-xl">
           <FaArrowRight />
         </button>
         <div>
           <h2 className="text-3xl font-black text-white">لوحة الشرف</h2>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">أعلى الطلاب أداءً في جميع المسابقات</p>
         </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            <GlassCard className="p-0 border-indigo-500/20 shadow-2xl">
               <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right border-collapse min-w-[600px]">
                   <thead className="bg-[#0f172a] text-slate-600 text-[10px] font-black uppercase tracking-widest border-b border-white/5">
                      <tr>
                         <th className="p-8">اسم الطالب</th>
                         <th className="p-8 text-center">الإجابات</th>
                         <th className="p-8 text-center">التقدم</th>
                         <th className="p-8"></th>
                      </tr>
                   </thead>
                   <tbody className="divide-y divide-white/5 bg-slate-900/30">
                      {history.map((h, i) => (
                        <tr key={i} className="group hover:bg-white/[0.02] transition-colors animate-slideUp" style={{animationDelay: `${i * 50}ms`}}>
                          <td className="p-6">
                             <div className="flex items-center gap-4">
                                <div className="relative">
                                  <img src={h.photo || "/images/1.webp"} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10" alt="" />
                                  <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-slate-950 rounded-md flex items-center justify-center text-[8px] font-black border border-white/5 shadow-lg">
                                    {i + 1}
                                  </div>
                                </div>
                                <span className="font-bold text-lg group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{h.name}</span>
                             </div>
                          </td>
                          <td className="p-6 text-center text-xl font-black text-emerald-400">{h.correct}</td>
                          <td className="p-6">
                             <div className="flex flex-col items-center gap-2">
                                <div className="w-32 h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10 relative shadow-inner">
                                   <div className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" style={{width: `${(h.correct/h.total)*100}%`}}></div>
                                </div>
                                <span className="text-[8px] font-black text-indigo-400">{Math.round((h.correct/h.total)*100)}% نجاح</span>
                             </div>
                          </td>
                          <td className="p-6">
                            <div className="flex justify-center gap-2">
                              {i === 0 && <span className="text-xl">🏆</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                   </tbody>
                </table>
               </div>
            </GlassCard>
          </div>

          <div className="space-y-6">
             <div className="p-8 bg-indigo-600/10 border border-indigo-500/20 rounded-[2.5rem] shadow-2xl">
                <h4 className="text-md font-black text-indigo-400 mb-4 flex items-center gap-2">
                  <FaAward /> إحصائيات
                </h4>
                <div className="space-y-6">
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-600 uppercase mb-1">إجمالي الطلاب</span>
                      <span className="text-2xl font-black text-white">{history.length}</span>
                   </div>
                   <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-600 uppercase mb-1">الأداء العام</span>
                      <span className="text-2xl font-black text-cyan-400">
                        {history.length > 0 ? Math.round(history.reduce((acc, curr) => acc + (curr.correct/curr.total), 0) / history.length * 100) : 0}%
                      </span>
                   </div>
                </div>
             </div>
          </div>
       </div>
    </div>
  );
};

export default ChallengePage;
