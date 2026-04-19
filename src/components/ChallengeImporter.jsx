import React, { useState, useEffect } from "react";
import { 
  FaUpload, 
  FaInfoCircle, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTrash,
  FaFileCsv,
  FaArrowRight,
  FaRocket,
  FaPlus,
  FaTimes
} from "react-icons/fa";
import { supabase } from "../supabaseClient";

const ChallengeImporter = ({ gradeId, teacherId, onComplete, onCancel }) => {
  const [inputText, setInputText] = useState("");
  const [importType, setImportType] = useState("mcq"); // mcq, written
  const [parsedData, setParsedData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: input, 2: preview/verification
  const [newCategories, setNewCategories] = useState([]);
  const [existingChallenges, setExistingChallenges] = useState([]);

  useEffect(() => {
    fetchExistingChallenges();
  }, [gradeId]);

  const fetchExistingChallenges = async () => {
    const { data } = await supabase
      .from("challenges")
      .select("subject_name, lesson_name")
      .eq("grade_id", gradeId)
      .eq("teacher_id", teacherId);
    setExistingChallenges(data || []);
  };

  const parseData = () => {
    if (!inputText.trim()) return;
    
    const lines = inputText.trim().split("\n");
    const results = [];
    const foundNewCats = [];

    lines.forEach((line, index) => {
      // Basic CSV parsing (comma separated)
      const parts = line.split(",").map(p => p.trim());
      if (parts.length >= 4) {
        const [questionText, optionsStr, answerText, categoryStr] = parts;
        const options = optionsStr.split("|").map(o => o.trim());
        const correctIndex = options.findIndex(o => o === answerText);
        
        let subject = "عام";
        let lesson = categoryStr;
        if (categoryStr.includes(":")) {
          [subject, lesson] = categoryStr.split(":").map(s => s.trim());
        }

        const isNew = !existingChallenges.some(
          c => c.subject_name === subject && c.lesson_name === lesson
        );

        if (isNew && !foundNewCats.some(n => n.subject === subject && n.lesson === lesson)) {
          foundNewCats.push({ subject, lesson });
        }

        results.push({
          id: Date.now() + index,
          question: questionText,
          options,
          correctIndex: correctIndex === -1 ? 0 : correctIndex,
          subject,
          lesson,
          isNewCategory: isNew
        });
      }
    });

    setParsedData(results);
    setNewCategories(foundNewCats);
    setStep(2);
  };

  const handleBulkSave = async () => {
    setIsLoading(true);
    try {
      const grouped = parsedData.reduce((acc, q) => {
        const key = `${q.subject}:${q.lesson}`;
        if (!acc[key]) acc[key] = { subject: q.subject, lesson: q.lesson, questions: [] };
        acc[key].questions.push({
          id: Date.now() + Math.random(),
          text: q.question,
          options: q.options,
          correctIndex: q.correctIndex
        });
        return acc;
      }, {});

      for (const key in grouped) {
        const { subject, lesson, questions } = grouped[key];
        
        const { data: existing } = await supabase
          .from("challenges")
          .select("*")
          .eq("grade_id", gradeId)
          .eq("teacher_id", teacherId)
          .eq("subject_name", subject)
          .eq("lesson_name", lesson)
          .single();

        if (existing) {
          const updatedQs = [...(existing.questions || []), ...questions];
          await supabase.from("challenges").update({ questions: updatedQs }).eq("id", existing.id);
        } else {
          await supabase.from("challenges").insert([{
            teacher_id: teacherId,
            grade_id: gradeId,
            subject_name: subject,
            lesson_name: lesson,
            questions: questions
          }]);
        }
      }

      onComplete();
    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء الاستيراد");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-2xl text-slate-100 rounded-[3rem] border border-white/5 shadow-[0_50px_100px_rgba(0,0,0,0.8)] overflow-hidden animate-slideUp relative" dir="rtl">
      {/* Glow Effect */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <div className="bg-slate-950/50 p-10 border-b border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <div className="p-4 bg-cyan-600 rounded-2xl shadow-2xl shadow-cyan-500/20">
            <FaUpload className="text-2xl text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white">الاستيراد الجماعي</h2>
            <p className="text-slate-500 font-bold mt-1">إضافة مئات الأسئلة في ثوانٍ معدودة</p>
          </div>
        </div>
        <button onClick={onCancel} className="p-4 bg-slate-900 hover:bg-rose-600 rounded-2xl transition ring-1 ring-white/10 active:scale-90">
           <FaTimes />
        </button>
      </div>

      <div className="p-10 md:p-16">
        {step === 1 ? (
          <div className="space-y-12 animate-fadeIn">
            {/* Mode Switch */}
            <div className="flex bg-slate-950 p-2 rounded-[2rem] w-fit mx-auto border border-white/5 shadow-inner">
               <button 
                onClick={() => setImportType("mcq")}
                className={`flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black transition-all duration-500 ${importType === "mcq" ? "bg-cyan-500 text-slate-900 shadow-2xl scale-105" : "text-slate-500 hover:text-white"}`}
               >
                 <FaRocket /> خيارات متعددة
               </button>
               <button 
                onClick={() => setImportType("written")}
                className={`flex items-center gap-3 px-10 py-4 rounded-[1.5rem] font-black transition-all duration-500 ${importType === "written" ? "bg-cyan-500 text-slate-900 shadow-2xl scale-105" : "text-slate-500 hover:text-white"}`}
               >
                 سؤال كتابي
               </button>
            </div>

            {/* Hint Box */}
            <div className="bg-indigo-600/5 p-8 rounded-[2.5rem] border border-indigo-500/20 flex items-start gap-6 relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500"></div>
               <FaInfoCircle className="text-cyan-400 text-3xl mt-1 shrink-0 group-hover:scale-110 transition-transform" />
               <div className="space-y-3">
                  <p className="font-black text-xl text-slate-200">صيغة البيانات المطلوبة</p>
                  <p className="text-slate-400 font-bold leading-relaxed">يرجى كتابة الأسئلة بحيث يكون كل سؤال في سطر مستقل، مع الفصل بين الحقول بفاصلة (،) بهذا الشكل:</p>
                  <div className="bg-slate-950 p-4 rounded-xl border border-white/5 inline-block mt-2">
                    <p className="text-cyan-400 text-sm font-black font-mono tracking-tight">
                      السؤال ، الخيارات (مفصولة بـ |) ، الإجابة ، التصنيف
                    </p>
                  </div>
               </div>
            </div>

            {/* Textarea */}
            <div className="space-y-4">
               <label className="flex items-center gap-2 text-slate-500 font-black mr-4 uppercase tracking-widest text-xs">منطقة اللصق الذكي:</label>
               <textarea 
                className="w-full h-80 bg-slate-950/80 border-2 border-slate-800 rounded-[3rem] p-10 text-slate-300 font-black text-lg focus:border-cyan-500 outline-none transition-all placeholder-slate-800 shadow-inner"
                placeholder="مثال:&#10;ما هي أركان الإسلام؟ ، 5|4|3 ، 5 ، توحيد: الإسلام&#10;..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
               />
            </div>

            <button 
              onClick={parseData}
              disabled={!inputText.trim()}
              className="w-full relative group disabled:opacity-50"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
              <div className="relative py-7 bg-slate-900 border border-white/10 hover:bg-slate-800 text-cyan-400 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 group-hover:scale-[1.01] active:scale-95">
                <FaFileCsv className="text-3xl" /> فحص وتحضير البيانات
              </div>
            </button>
          </div>
        ) : (
          <div className="animate-fadeIn space-y-12">
            <button onClick={() => setStep(1)} className="flex items-center gap-3 text-slate-500 hover:text-white font-black transition-all group">
               <div className="p-2 bg-slate-950 rounded-lg group-hover:bg-slate-800 transition-colors border border-white/5 shadow-xl">
                 <FaArrowRight />
               </div>
               العودة لتعديل البيانات
            </button>

            {newCategories.length > 0 && (
               <div className="bg-amber-600/10 border border-amber-600/30 p-10 rounded-[3rem] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-full bg-amber-500"></div>
                  <div className="flex items-center gap-5 text-amber-500">
                     <FaExclamationTriangle className="text-4xl animate-bounce" />
                     <div>
                        <h3 className="text-2xl font-black italic">تصنيفات جديدة مكتشفة</h3>
                        <p className="text-slate-500 font-bold mt-1 text-sm">سيتم إنشاء المسارات الدراسية التالية تلقائياً عند الحفظ:</p>
                     </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                     {newCategories.map((c, i) => (
                       <span key={i} className="px-5 py-2 bg-amber-600/20 text-amber-400 rounded-2xl text-sm font-black border border-amber-600/20 shadow-xl">
                         {c.subject} » {c.lesson}
                       </span>
                     ))}
                  </div>
               </div>
            )}

            <div className="bg-slate-950/50 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
               <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-right border-collapse min-w-[800px]">
                    <thead className="bg-[#0f172a] border-b border-white/5">
                      <tr>
                        <th className="p-8 text-xs font-black text-slate-600 uppercase tracking-widest">السؤال المستهدف</th>
                        <th className="p-8 text-xs font-black text-slate-600 uppercase tracking-widest text-center">الخيارات المقترحة</th>
                        <th className="p-8 text-xs font-black text-slate-600 uppercase tracking-widest text-center">الإجابة الصحيحة</th>
                        <th className="p-8 text-xs font-black text-slate-600 uppercase tracking-widest">التصنيف</th>
                        <th className="p-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {parsedData.map((q, idx) => (
                        <tr key={q.id} className="group hover:bg-cyan-500/5 transition-all duration-300">
                          <td className="p-8">
                             <div className="flex flex-col gap-1">
                               <p className="text-lg font-black text-slate-200 line-clamp-2 max-w-[300px] leading-snug group-hover:text-cyan-400 transition-colors">{q.question}</p>
                               <span className="text-[10px] text-slate-600 font-bold">المعرف: #{idx + 1}</span>
                             </div>
                          </td>
                          <td className="p-8 text-center">
                             <div className="flex flex-wrap justify-center gap-2">
                               {q.options.map((opt, i) => (
                                 <span key={i} className="px-3 py-1 bg-slate-900 border border-white/5 rounded-lg text-xs font-bold text-slate-500">{opt}</span>
                               ))}
                             </div>
                          </td>
                          <td className="p-8 text-center">
                             <div className="inline-block px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-xl text-sm font-black border border-emerald-500/20">
                               {q.options[q.correctIndex]}
                             </div>
                          </td>
                          <td className="p-8">
                             <div className={`p-3 rounded-2xl border text-center ${q.isNewCategory ? "bg-amber-600/10 border-amber-600/30 text-amber-500" : "bg-slate-900 border-white/5 text-slate-400"} text-xs font-black`}>
                               {q.subject} : {q.lesson}
                             </div>
                          </td>
                          <td className="p-8 text-center">
                             <button 
                              onClick={() => setParsedData(parsedData.filter((_, i) => i !== idx))}
                              className="w-12 h-12 flex items-center justify-center text-slate-600 hover:text-rose-500 bg-slate-900 hover:bg-rose-500/10 rounded-2xl transition-all shadow-xl active:scale-90"
                             >
                               <FaTrash />
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                </table>
               </div>
               {parsedData.length === 0 && (
                 <div className="p-32 text-center text-slate-700 font-black text-xl italic drop-shadow-lg">القائمة خالية الآن..</div>
               )}
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              <button 
                onClick={handleBulkSave}
                disabled={isLoading || parsedData.length === 0}
                className="flex-[2] relative group disabled:opacity-50"
              >
                <div className="absolute -inset-2 bg-gradient-to-r from-cyan-600 to-emerald-600 rounded-[2.5rem] blur opacity-50 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
                <div className="relative py-7 bg-cyan-600 text-slate-900 rounded-[2.5rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-4 group-hover:bg-cyan-500 transition-all active:scale-95">
                  {isLoading ? (
                    <div className="flex items-center gap-4">
                      <div className="w-6 h-6 border-4 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                      <span>جاري المعالجة الجماعية...</span>
                    </div>
                  ) : (
                    <><FaCheckCircle className="text-3xl" /> تأكيد استيراد {parsedData.length} سؤال</>
                  )}
                </div>
              </button>
              <button 
                onClick={() => { if(window.confirm("حذف كل البيانات المستوردة؟ هذه الخطوة لا يمكن التراجع عنها.")) setParsedData([]); }}
                className="flex-1 py-7 bg-slate-900 border-2 border-slate-800 text-slate-500 rounded-[2.5rem] font-black text-xl hover:bg-rose-600/10 hover:text-rose-500 transition-all active:scale-95"
              >
                مسح الكل
              </button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 6px; width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.2); }
      `}</style>
    </div>
  );
};

export default ChallengeImporter;
