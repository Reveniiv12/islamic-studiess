import React, { useState, useEffect, useRef } from "react";
import { FaPlay, FaDice, FaUserCheck, FaStar, FaSearch } from "react-icons/fa";

const WheelOfFortune = ({ students, onResult }) => {
  const [isShuffling, setIsShuffling] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  
  const shuffleTimer = useRef(null);

  // Dynamic Font Size based on name length
  const getDynamicFontSize = (name = "") => {
    const len = name.length;
    if (len < 10) return "text-5xl md:text-7xl lg:text-[6rem]";
    if (len < 20) return "text-3xl md:text-5xl lg:text-[4rem]";
    return "text-2xl md:text-4xl lg:text-[3rem]";
  };

  const startShuffle = () => {
    if (isShuffling || showWinner || students.length === 0) return;
    
    setIsShuffling(true);
    setWinner(null);
    setShowWinner(false);

    let duration = 6000;
    let startTime = Date.now();
    let initialDelay = 40;
    let lastSetIndex = 0;
    
    const tick = () => {
      let elapsed = Date.now() - startTime;
      let progress = elapsed / duration;

      if (progress < 1) {
        let nextIndex;
        do {
          nextIndex = Math.floor(Math.random() * students.length);
        } while (nextIndex === lastSetIndex && students.length > 1);
        
        lastSetIndex = nextIndex;
        setCurrentIndex(nextIndex);
        
        // Easing function for a dramatic slowdown
        let currentDelay = initialDelay + (1000 * Math.pow(progress, 3)); 
        shuffleTimer.current = setTimeout(tick, currentDelay);
      } else {
        const finalWinner = students[lastSetIndex];
        setWinner(finalWinner);
        setIsShuffling(false);
        setShowWinner(true);
      }
    };

    tick();
  };

  useEffect(() => {
    return () => {
      if (shuffleTimer.current) clearTimeout(shuffleTimer.current);
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-6 font-['Tajawal',sans-serif] min-h-[500px] w-full mt-2" dir="rtl">
      
      {/* THE COSMIC CONTAINER */}
      <div className="relative w-full max-w-6xl px-4 flex flex-col items-center">
        
        {/* Main Display Box - Glassmorphic Design */}
        <div className={`
          relative w-full min-h-[300px] md:min-h-[420px] 
          bg-slate-900/40 backdrop-blur-3xl 
          border-2 rounded-[3.5rem] 
          flex flex-col items-center justify-center overflow-hidden transition-all duration-700
          ${isShuffling 
            ? "border-cyan-500/50 shadow-[0_0_80px_rgba(34,211,238,0.2)]" 
            : showWinner 
              ? "border-emerald-500/50 shadow-[0_0_80px_rgba(16,185,129,0.2)]" 
              : "border-white/10 shadow-2xl"
          }
        `}>
          
          {/* Animated Background Gradients */}
          <div className="absolute inset-0 pointer-events-none">
            <div className={`absolute top-0 right-0 w-64 h-64 blur-[100px] rounded-full transition-colors duration-1000 ${isShuffling ? "bg-cyan-500/20" : showWinner ? "bg-emerald-500/20" : "bg-indigo-500/10"}`}></div>
            <div className={`absolute bottom-0 left-0 w-64 h-64 blur-[100px] rounded-full transition-colors duration-1000 ${isShuffling ? "bg-purple-500/20" : showWinner ? "bg-yellow-500/20" : "bg-slate-500/10"}`}></div>
          </div>

          {/* Shuffling State */}
          {isShuffling ? (
            <div className="flex flex-col items-center w-full animate-fadeIn px-6 text-center z-10">
               <div className="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 px-6 py-2 rounded-full text-cyan-400 text-xs font-black mb-10 tracking-[0.2em] uppercase">
                 <FaSearch className="animate-pulse" /> البحث عن المشارك التالي
               </div>
               <div className={`font-black text-white drop-shadow-2xl leading-tight animate-shake px-4 transition-all duration-75 ${getDynamicFontSize(students[currentIndex]?.name)}`}>
                 {students[currentIndex]?.name}
               </div>
               <div className="flex gap-4 mt-12">
                 {[1,2,3].map(i => <div key={i} className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{animationDelay: `${i*200}ms`}}></div>)}
               </div>
            </div>
          ) : winner && showWinner ? (
            <div className="animate-popIn flex flex-col md:flex-row items-center justify-center w-full px-8 md:px-16 py-6 gap-10 z-10">
               {/* Winner Photo with Cosmic Ring */}
               <div className="relative shrink-0">
                  <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500 via-cyan-500 to-indigo-500 rounded-[3rem] animate-spin-slow opacity-30 blur-xl"></div>
                  <img 
                    src={winner.image_url || winner.photo || winner.imageUrl || "/images/1.webp"} 
                    className="w-40 h-40 md:w-56 md:h-56 rounded-[3rem] border-4 border-white/20 object-cover shadow-2xl relative z-10" 
                    alt="" 
                  />
                  <div className="absolute -top-6 -left-6 bg-emerald-500 text-white p-4 rounded-2xl text-3xl shadow-2xl animate-bounce z-20 border-4 border-slate-900">👑</div>
               </div>
               
               {/* Winner Details */}
               <div className="text-center md:text-right flex-1">
                  <h2 className="text-xs md:text-sm font-black text-emerald-400 uppercase tracking-[0.4em] mb-4">بطل الجولة الحالية</h2>
                  <div className={`font-black text-white drop-shadow-2xl leading-none transition-all duration-500 ${getDynamicFontSize(winner.name)}`}>
                    {winner.name}
                  </div>
                  <div className="mt-8 flex justify-center md:justify-end gap-2 opacity-40">
                    <FaStar className="text-xl text-yellow-400" />
                    <FaStar className="text-xl text-yellow-400" />
                    <FaStar className="text-xl text-yellow-400" />
                  </div>
               </div>
            </div>
          ) : (
            /* Ready State - "جاهزون للبحث؟" */
            <div className="flex flex-col items-center space-y-8 animate-fadeIn text-center z-10 p-8">
               <div className="relative group">
                  <div className="absolute -inset-6 bg-indigo-500/20 blur-2xl rounded-full group-hover:bg-indigo-500/40 transition duration-500"></div>
                  <div className="relative p-10 bg-slate-950/50 border-2 border-dashed border-white/10 rounded-[2.5rem] shadow-inner group-hover:border-indigo-500/50 transition duration-500">
                    <FaDice className="text-8xl text-indigo-400 opacity-60 animate-spin-slow group-hover:opacity-100 transition duration-500" />
                  </div>
               </div>
               <div className="space-y-4">
                 <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter">
                   جاهزون للبحث؟
                 </h2>
                 <p className="text-slate-500 text-sm md:text-md font-bold uppercase tracking-widest opacity-80">
                   اضغط أدناه لاختيار طالب عشوائي للمشاركة في التحدي
                 </p>
               </div>
            </div>
          )}
          
          {/* Scanning Line Effect */}
          {isShuffling && (
             <div className="absolute inset-y-0 left-0 w-1 bg-cyan-400 shadow-[0_0_30px_#22d3ee] animate-scan z-20"></div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-12 w-full flex flex-col items-center gap-8">
           {!isShuffling && !showWinner && (
             <button 
               onClick={startShuffle}
               className="group relative flex items-center gap-4 px-16 py-6 overflow-hidden"
             >
               <div className="absolute inset-0 bg-indigo-600 rounded-3xl group-hover:bg-indigo-500 transition-all duration-300"></div>
               <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-indigo-500/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className="relative flex items-center gap-4 text-white font-black text-2xl">
                 <FaPlay className="text-lg group-hover:scale-110 transition-transform" /> 
                 <span>ابدأ البحث العشوائي</span>
               </div>
             </button>
           )}

           {showWinner && (
             <button 
               onClick={() => onResult(winner)}
               className="animate-popIn group relative flex items-center gap-5 px-16 py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-3xl text-2xl shadow-2xl transition-all active:scale-95"
             >
               <FaUserCheck className="text-xl animate-pulse" /> 
               <span>عرض سؤال الطالب</span>
             </button>
           )}
        </div>

      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: rotate(-1deg) scale(1); }
          50% { transform: rotate(1deg) scale(1.01); }
        }
        @keyframes scan {
          0% { left: -5%; }
          100% { left: 105%; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-shake {
          animation: shake 0.12s ease-in-out infinite;
        }
        .animate-scan {
          animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 15s linear infinite;
        }
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes popIn {
          0% { transform: scale(0.9); opacity: 0; }
          70% { transform: scale(1.02); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-popIn {
          animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>
    </div>
  );
};

export default WheelOfFortune;
