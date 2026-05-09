import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { FaArrowRight, FaGamepad, FaPlay, FaCheckCircle, FaTimesCircle, FaTrophy, FaTimes } from 'react-icons/fa';

export default function StudentChallengeGame() {
  const { studentId, assignmentId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [student, setStudent] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [challenge, setChallenge] = useState(null);
  
  const [gameState, setGameState] = useState('intro'); // intro, playing, summary
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [timePerQ, setTimePerQ] = useState(30);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    fetchData();
  }, [studentId, assignmentId]);

  const shuffleOptions = (question) => {
    if (!question?.options) return question;
    const indexed = question.options.map((opt, i) => ({ opt, i }));
    for (let k = indexed.length - 1; k > 0; k--) {
      const j = Math.floor(Math.random() * (k + 1));
      [indexed[k], indexed[j]] = [indexed[j], indexed[k]];
    }
    return {
      ...question,
      options: indexed.map(({ opt }) => opt),
      correctIndex: indexed.findIndex(({ i }) => i === question.correctIndex),
    };
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch student
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();
        
      if (studentError) throw studentError;
      
      const grades = studentData.grades || {};
      const assignments = grades.assigned_challenges || [];
      const currentAssignment = assignments.find(a => a.id === assignmentId);
      
      if (!currentAssignment) {
        throw new Error("لم يتم العثور على التكليف.");
      }
      
      setStudent(studentData);
      setAssignment(currentAssignment);

      // Set time per question from assignment
      const tpq = currentAssignment.time_per_question || 30;
      setTimePerQ(tpq);
      setTimeLeft(tpq);

      // Fetch all challenges (support multi-challenge assignments)
      const challengeIds = currentAssignment.challenge_ids || [currentAssignment.challenge_id];
      const { data: challengesData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .in('id', challengeIds);
        
      if (challengeError) throw challengeError;
      
      const firstChallenge = challengesData[0];
      setChallenge(firstChallenge);
      
      // Combine questions from all challenges, shuffle options, pick requested count
      let allQuestions = challengesData.flatMap(c => c.questions || []);
      allQuestions = allQuestions.sort(() => 0.5 - Math.random());
      const selectedQuestions = allQuestions.slice(0, currentAssignment.questions_count).map(shuffleOptions);
      setQuestions(selectedQuestions);

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let timer;
    if (gameState === 'playing' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      handleAnswer(-1); // timeout
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  const startGame = () => {
    const isPractice = assignment.is_practice;
    // For practice: unlimited attempts (attempts_allowed is 999999)
    if (!isPractice && assignment.attempts_used >= assignment.attempts_allowed) {
      alert("لقد استنفذت جميع المحاولات المسموحة لهذا التحدي.");
      return;
    }
    
    setGameState('playing');
    setCurrentQuestionIndex(0);
    setScore(0);
    setAnswers([]);
    setTimeLeft(timePerQ);
  };

  const handleAnswer = (selectedIndex) => {
    if (isChecking) return; // Prevent double clicks
    
    const currentQ = questions[currentQuestionIndex];
    const isCorrect = selectedIndex === currentQ.correctIndex;
    
    setSelectedAnswer(selectedIndex);
    setIsChecking(true);
    
    // Short delay for feedback before moving to next question
    setTimeout(() => {
      if (isCorrect) setScore(prev => prev + 1);
      setAnswers(prev => [...prev, { question: currentQ.text, isCorrect }]);
      
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
        setIsChecking(false);
        setTimeLeft(timePerQ);
      } else {
        finishGame(score + (isCorrect ? 1 : 0));
      }
    }, 1000); // 1 second feedback
  };

  const finishGame = async (finalScore) => {
    setGameState('summary');
    
    try {
      const grades = student.grades || {};
      const assignments = grades.assigned_challenges || [];
      const isPractice = assignment.is_practice;
      
      const updatedAssignments = assignments.map(a => {
        if (a.id === assignmentId) {
          const newAllScores = [...(a.all_scores || []), finalScore];
          const updated = {
            ...a,
            attempts_used: (a.attempts_used || 0) + 1,
            all_scores: newAllScores,
          };
          // Only update best_score for non-practice challenges
          if (!isPractice) {
            updated.best_score = a.best_score === null ? finalScore : Math.max(a.best_score, finalScore);
          }
          return updated;
        }
        return a;
      });
      
      const newGrades = { ...grades, assigned_challenges: updatedAssignments };
      
      await supabase
        .from('students')
        .update({ grades: newGrades })
        .eq('id', studentId);
        
      setAssignment(updatedAssignments.find(a => a.id === assignmentId));
    } catch (err) {
      console.error("Error saving score:", err);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-white">جاري التحميل...</div>;
  }
  
  if (error) {
    return <div className="min-h-screen bg-gray-900 flex justify-center items-center text-rose-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white font-['Noto_Sans_Arabic',sans-serif] p-6 flex flex-col items-center" dir="rtl">
      
      {/* Header */}
      <div className="w-full max-w-4xl flex justify-between items-center mb-8">
         <button onClick={() => navigate(`/student-view/${studentId}`)} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors bg-gray-800 px-4 py-2 rounded-lg">
           <FaArrowRight /> العودة لصفحتي
         </button>
         <h1 className="text-xl font-bold flex items-center gap-2"><FaGamepad className="text-indigo-400" /> تحدي: {challenge?.lesson_name}</h1>
      </div>

      <div className="w-full max-w-4xl bg-gray-800/50 backdrop-blur-md border border-gray-700 rounded-3xl p-8 shadow-2xl flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        
        {gameState === 'intro' && (
           <div className="text-center space-y-6 animate-fadeIn">
              <div className="w-24 h-24 bg-indigo-600/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto text-5xl mb-4 border border-indigo-500/30">
                <FaTrophy />
              </div>
              <h2 className="text-3xl font-bold">{challenge?.subject_name}</h2>
              <p className="text-gray-400 text-lg max-w-md mx-auto">أهلاً بك يا {student?.name} في هذا التحدي. أجب عن الأسئلة بأسرع وقت لجمع النقاط.</p>
              
              <div className="flex gap-4 justify-center py-6">
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 w-32">
                   <p className="text-gray-500 text-sm mb-1">الأسئلة</p>
                   <p className="text-2xl font-bold text-blue-400">{assignment?.questions_count}</p>
                </div>
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 w-32">
                   <p className="text-gray-500 text-sm mb-1">المحاولات المتبقية</p>
                   <p className="text-2xl font-bold text-yellow-400">{Math.max(0, assignment?.attempts_allowed - (assignment?.attempts_used || 0))}</p>
                </div>
              </div>

              {assignment?.attempts_used >= assignment?.attempts_allowed ? (
                 <div className="bg-rose-900/30 text-rose-400 p-4 rounded-xl border border-rose-500/50 max-w-md mx-auto">
                   لقد استنفذت جميع محاولاتك لهذا التحدي.
                 </div>
              ) : (
                 <button 
                   onClick={startGame}
                   className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold text-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-3 mx-auto"
                 >
                   <FaPlay /> ابدأ التحدي الآن
                 </button>
              )}
           </div>
        )}

        {gameState === 'playing' && questions.length > 0 && (
           <div className="w-full max-w-2xl animate-slideUp">
              <div className="flex justify-between items-center mb-8 bg-gray-900/50 p-4 rounded-2xl border border-gray-700">
                 <div className="text-gray-400 font-bold">
                    سؤال <span className="text-white text-xl">{currentQuestionIndex + 1}</span> / {questions.length}
                 </div>
                 <div className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-rose-500 animate-pulse' : 'text-cyan-400'}`}>
                    {timeLeft} ثانية
                 </div>
              </div>

              <div className="mb-10 text-center">
                 <h3 className="text-2xl font-bold leading-relaxed">{questions[currentQuestionIndex].text}</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {questions[currentQuestionIndex].options.map((opt, idx) => {
                    const isSelected = selectedAnswer === idx;
                    const isCorrect = idx === questions[currentQuestionIndex].correctIndex;
                    
                    let btnClass = "p-6 border-2 rounded-2xl text-lg font-bold transition-all text-right shadow-md ";
                    if (isChecking) {
                       if (isCorrect) btnClass += "bg-green-600/30 border-green-500 text-green-100 shadow-green-500/20";
                       else if (isSelected) btnClass += "bg-rose-600/30 border-rose-500 text-rose-100 shadow-rose-500/20";
                       else btnClass += "bg-gray-700/20 border-gray-700 opacity-50";
                    } else {
                       btnClass += "bg-gray-700/40 hover:bg-indigo-600/30 border-gray-600 hover:border-indigo-500";
                    }

                    return (
                      <button 
                        key={`${currentQuestionIndex}-${idx}`}
                        onClick={() => handleAnswer(idx)}
                        disabled={isChecking}
                        className={btnClass}
                      >
                        {opt}
                      </button>
                    );
                 })}
              </div>
           </div>
        )}

        {gameState === 'summary' && (
           <div className="text-center space-y-6 animate-fadeIn w-full max-w-2xl">
              <div className="w-24 h-24 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto text-5xl mb-4 border border-green-500/30">
                <FaCheckCircle />
              </div>
              <h2 className="text-3xl font-bold mb-2">انتهى التحدي!</h2>
              <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-l from-indigo-400 to-cyan-400 py-4">
                 {score} <span className="text-2xl text-gray-400">/ {questions.length}</span>
              </div>
              
              <div className="bg-gray-900/50 p-6 rounded-2xl border border-gray-700 text-right mt-8 max-h-60 overflow-y-auto custom-scrollbar">
                 <h4 className="font-bold text-gray-300 mb-4 border-b border-gray-700 pb-2">ملخص الإجابات:</h4>
                 <div className="space-y-3">
                   {answers.map((ans, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-gray-800 p-3 rounded-xl border border-gray-700">
                         <span className="text-sm truncate w-3/4">{ans.question}</span>
                         {ans.isCorrect ? (
                           <FaCheckCircle className="text-green-500 text-xl" />
                         ) : (
                           <FaTimesCircle className="text-rose-500 text-xl" />
                         )}
                      </div>
                   ))}
                 </div>
              </div>

              <button 
                 onClick={() => navigate(`/student-view/${studentId}`)}
                 className="mt-6 px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-lg transition-all mx-auto block"
              >
                 العودة لصفحتي الرئيسية
              </button>
           </div>
        )}

      </div>
    </div>
  );
}
