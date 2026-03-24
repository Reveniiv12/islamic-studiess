// src/components/TeacherChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { FaPaperPlane, FaTimes, FaTrash, FaCheckDouble, FaCheck, FaUserCircle, FaArrowRight, FaInfoCircle, FaPlus } from 'react-icons/fa';

const TeacherChat = ({ teacherId, students, onClose }) => {
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [maxMessages, setMaxMessages] = useState(5);
  const [sentCount, setSentCount] = useState(0); 
  const [isUpdatingMax, setIsUpdatingMax] = useState(false);
  
  // نظام التحديد الجديد
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState([]);
  const [bulkMessagesCount, setBulkMessagesCount] = useState(5);

  const [showMobileList, setShowMobileList] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState(new Set());

  const messagesEndRef = useRef(null);
  const globalChannelRef = useRef(null); // مرجع قناة الاتصال اللحظي

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, typingUsers, selectedStudentId]);

  // 1. نظام التتبع الشامل (متصل / يكتب)
  useEffect(() => {
    if (!teacherId) return;

    const globalChannel = supabase.channel('chat_global', {
      config: { presence: { key: teacherId } }
    });

    globalChannelRef.current = globalChannel; // ربط المرجع بالقناة

    globalChannel
      .on('presence', { event: 'sync' }, () => {
        const state = globalChannel.presenceState();
        const onlineIds = new Set();
        for (const key in state) {
          state[key].forEach(user => {
            if (user.type === 'student') onlineIds.add(user.user_id);
          });
        }
        setOnlineUsers(onlineIds);
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        setTypingUsers(prev => {
          const newSet = new Set(prev);
          if (payload.payload.isTyping) {
            newSet.add(payload.payload.studentId);
          } else {
            newSet.delete(payload.payload.studentId);
          }
          return newSet;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await globalChannel.track({ user_id: teacherId, type: 'teacher' });
        }
      });

    return () => {
      supabase.removeChannel(globalChannel);
    };
  }, [teacherId]);

  // 2. جلب المحادثة الخاصة بالطالب المحدد والاستماع الفوري
  useEffect(() => {
    if (!selectedStudentId || !teacherId) return;

    const fetchChatData = async () => {
      setLoading(true);
      
      const { data: studentData } = await supabase
        .from('students')
        .select('max_allowed_messages')
        .eq('id', selectedStudentId)
        .single();
        
      if (studentData?.max_allowed_messages !== undefined) {
        setMaxMessages(studentData.max_allowed_messages);
      } else {
        setMaxMessages(5);
      }

      const { data: msgs, error } = await supabase
        .from('messages')
        .select('*')
        .eq('student_id', selectedStudentId)
        .eq('teacher_id', teacherId)
        .order('created_at', { ascending: true });
        
      if (!error && msgs) {
        setMessages(msgs);
        
        const studentSentMsgs = msgs.filter(m => m.sender_type === 'student');
        setSentCount(studentSentMsgs.length);
        
        const unreadMsgs = studentSentMsgs.filter(m => !m.is_read);
        if (unreadMsgs.length > 0) {
           await supabase
             .from('messages')
             .update({ is_read: true })
             .eq('student_id', selectedStudentId)
             .eq('teacher_id', teacherId)
             .eq('sender_type', 'student')
             .eq('is_read', false);
        }
      }
      setLoading(false);
    };

    fetchChatData();

    const msgChannel = supabase.channel(`messages_${selectedStudentId}_teacher`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `student_id=eq.${selectedStudentId}` }, (payload) => {
          setMessages(prev => {
             if (prev.some(m => m.id === payload.new.id)) return prev;
             const filtered = prev.filter(m => !(m.isTemp && m.content === payload.new.content));
             return [...filtered, payload.new];
          });
          
          if (payload.new.sender_type === 'student') {
             supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id);
             setSentCount(prev => prev + 1);
          }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `student_id=eq.${selectedStudentId}` }, (payload) => {
          setMessages(prev => prev.map(m => m.id === payload.new.id ? payload.new : m));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `student_id=eq.${selectedStudentId}` }, (payload) => {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(msgChannel);
    };
  }, [selectedStudentId, teacherId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedStudentId) return;

    const messageText = newMessage.trim();
    setNewMessage(""); 

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      student_id: selectedStudentId,
      teacher_id: teacherId,
      sender_type: 'teacher',
      content: messageText,
      is_read: false,
      created_at: new Date().toISOString(),
      isTemp: true
    };

    setMessages(prev => [...prev, tempMessage]);
    scrollToBottom();

    const { data, error } = await supabase
      .from('messages')
      .insert([{
        student_id: selectedStudentId,
        teacher_id: teacherId,
        sender_type: 'teacher',
        content: messageText,
        is_read: false
      }])
      .select()
      .single();

    if (error) {
       setMessages(prev => prev.filter(m => m.id !== tempId));
       console.error(error);
    } else {
       setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const handleDeleteMessage = async (msgId) => {
    if (String(msgId).startsWith('temp')) return;
    if (!window.confirm("هل أنت متأكد من حذف هذه الرسالة؟ لن يراها الطالب بعد الآن.")) return;
    await supabase.from('messages').delete().eq('id', msgId);
  };

  // دالة تحديث الرصيد للطالب الواحد (معالجة الـ 400 Bad Request)
  const handleUpdateMaxMessages = async (newValue) => {
    let rawValue = newValue !== undefined ? newValue : maxMessages;
    let valueToSet = parseInt(rawValue, 10); // التأكد من تحويل القيمة لرقم صحيح

    if (isNaN(valueToSet)) {
      console.error("قيمة غير صالحة تم تمريرها:", rawValue);
      alert("يرجى التأكد من كتابة رقم صحيح.");
      return;
    }

    setIsUpdatingMax(true);
    
    console.log("جارِ إرسال القيمة لقاعدة البيانات:", valueToSet);

    const { data, error } = await supabase
       .from('students')
       .update({ max_allowed_messages: valueToSet })
       .eq('id', selectedStudentId)
       .select()
       .single();
       
    if (!error && data) {
       setMaxMessages(data.max_allowed_messages);
       
       // إرسال الإشعار للطالب ليفتح لديه الشات فوراً
       if (globalChannelRef.current) {
          globalChannelRef.current.send({
             type: 'broadcast',
             event: 'update_limit',
             payload: { studentId: selectedStudentId, newLimit: data.max_allowed_messages }
          });
       }
    } else if (error) {
       console.error("خطأ من قاعدة البيانات:", error);
       alert("فشل التحديث. تأكد من أن اسم العمود max_allowed_messages موجود في قاعدة البيانات.");
    }
    
    setIsUpdatingMax(false);
  };

  const handleToggleBulkSelect = (id) => {
    setSelectedForBulk(prev => prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]);
  };

  // دالة التحديث الجماعي (معالجة الأرقام)
  const handleBulkUpdate = async () => {
    if (selectedForBulk.length === 0) return;
    
    let valueToSet = parseInt(bulkMessagesCount, 10);
    if (isNaN(valueToSet)) {
      alert("يرجى كتابة رقم صحيح.");
      return;
    }

    setIsUpdatingMax(true);
    const { error } = await supabase.from('students').update({ max_allowed_messages: valueToSet }).in('id', selectedForBulk);
    setIsUpdatingMax(false);
    
    if (!error) {
      if (selectedForBulk.includes(selectedStudentId)) {
        setMaxMessages(valueToSet);
      }
      
      // إرسال الإشعار لجميع الطلاب المحددين
      if (globalChannelRef.current) {
         selectedForBulk.forEach(id => {
            globalChannelRef.current.send({
               type: 'broadcast',
               event: 'update_limit',
               payload: { studentId: id, newLimit: valueToSet }
            });
         });
      }
      
      setSelectedForBulk([]); 
      setIsSelectionMode(false);
    } else {
      console.error(error);
      alert("حدث خطأ أثناء التحديث الجماعي: " + error.message);
    }
  };

  const selectedStudentObj = students.find(s => s.id === selectedStudentId);
  const isSelectedOnline = onlineUsers.has(selectedStudentId);
  const isLimitReached = sentCount >= maxMessages;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4" dir="rtl">
      <div className="bg-slate-900 w-full h-full md:max-w-6xl md:h-[85vh] md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border-0 md:border border-slate-700 animate-fadeIn">
        
        {/* --- القائمة الجانبية --- */}
        <div className={`${!showMobileList ? 'hidden md:flex' : 'flex'} w-full md:w-1/3 bg-slate-800 border-l border-slate-700 flex-col z-10 shadow-lg h-full`}>
          <div className="p-4 md:p-5 border-b border-slate-700 flex justify-between items-center bg-slate-900">
            <div className="flex items-center gap-4">
              <h2 className="text-white font-extrabold text-lg md:text-xl">المحادثات</h2>
              
              <button 
                onClick={() => {
                  setIsSelectionMode(!isSelectionMode);
                  if (isSelectionMode) setSelectedForBulk([]);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  isSelectionMode 
                    ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                }`}
              >
                {isSelectionMode ? 'إلغاء التحديد' : 'تحديد'}
              </button>
            </div>
            
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-red-400 bg-slate-800 rounded-full">
              <FaTimes />
            </button>
          </div>

          {isSelectionMode && (
            <div className="bg-slate-800 p-3 flex flex-col gap-3 border-b border-slate-700 text-sm animate-fadeIn shadow-inner">
               <div className="flex justify-between items-center text-slate-300 text-xs font-bold">
                  <span>تم تحديد: <strong className="text-white bg-slate-700 px-2 py-0.5 rounded ml-1">{selectedForBulk.length}</strong> طلاب</span>
                  {selectedForBulk.length > 0 && (
                     <button onClick={() => setSelectedForBulk([])} className="text-slate-400 hover:text-white underline">إلغاء الكل</button>
                  )}
               </div>
               <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">الرصيد:</span>
                  <input 
                    type="number" 
                    min="0"
                    value={bulkMessagesCount} 
                    onChange={e => setBulkMessagesCount(e.target.value)} 
                    className="w-16 bg-slate-900 text-white p-2 rounded-lg border border-slate-600 text-center text-sm focus:border-green-500 focus:outline-none" 
                  />
                  <button 
                    onClick={handleBulkUpdate} 
                    disabled={isUpdatingMax || selectedForBulk.length === 0} 
                    className="flex-1 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white py-2 rounded-lg font-bold transition-colors shadow-lg"
                  >
                    {isUpdatingMax ? 'جاري التحديث...' : 'تحديث للكل'}
                  </button>
               </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {students.map(student => {
              const isOnline = onlineUsers.has(student.id);
              const isTyping = typingUsers.has(student.id);
              
              const isSelectedForChat = selectedStudentId === student.id && !isSelectionMode;
              const isSelectedForBulk = selectedForBulk.includes(student.id);

              let itemClasses = "";
              let nameClass = "text-slate-200";

              if (isSelectionMode) {
                 if (isSelectedForBulk) {
                   itemClasses = "bg-green-600/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)] transform scale-[1.02]";
                   nameClass = "text-green-400 font-extrabold";
                 } else {
                   itemClasses = "hover:bg-slate-700/50 border-transparent opacity-70 hover:opacity-100";
                 }
              } else {
                 if (isSelectedForChat) {
                   itemClasses = "bg-blue-600/20 border-blue-500/50 shadow-md transform scale-[1.02]";
                   nameClass = "text-blue-400 font-bold";
                 } else {
                   itemClasses = "hover:bg-slate-700/50 border-transparent text-slate-300";
                 }
              }
              
              return (
                <button
                  key={student.id}
                  onClick={() => {
                    if (isSelectionMode) {
                      handleToggleBulkSelect(student.id);
                    } else {
                      setSelectedStudentId(student.id);
                      setShowMobileList(false);
                    }
                  }}
                  className={`w-full text-right p-3 rounded-2xl flex items-center gap-3 border transition-all duration-200 ${itemClasses}`}
                >
                  <div className="relative flex-shrink-0">
                    {student.photo ? (
                      <img src={student.photo} alt={student.name} className={`w-12 h-12 rounded-full object-cover border-2 ${isSelectionMode && isSelectedForBulk ? 'border-green-400' : 'border-slate-600'}`} />
                    ) : (
                      <FaUserCircle className={`text-[3rem] ${isSelectionMode && isSelectedForBulk ? 'text-green-400' : 'text-slate-500'}`} />
                    )}
                    <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${isOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                  </div>
                  <div className="flex-1 truncate">
                    <p className={`text-sm truncate ${nameClass}`}>{student.name}</p>
                    {isTyping ? (
                      <p className="text-xs text-green-300 font-bold mt-0.5 animate-pulse">يكتب الآن...</p>
                    ) : (
                      <p className={`text-xs truncate mt-0.5 ${isSelectionMode && isSelectedForBulk ? 'text-green-400/70' : 'text-slate-400'}`}>{student.nationalId}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- منطقة المحادثة --- */}
        <div className={`${showMobileList ? 'hidden md:flex' : 'flex'} w-full md:w-2/3 flex-col bg-[#0f172a] relative h-full`}>
          
          <div className="p-3 md:p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center z-10 shadow-sm">
             {selectedStudentObj ? (
               <div className="flex items-center justify-between w-full">
                 <div className="flex items-center gap-3">
                   <button 
                     onClick={() => setShowMobileList(true)} 
                     className="md:hidden p-2 text-slate-400 hover:text-white ml-2 bg-slate-700 rounded-full"
                   >
                     <FaArrowRight />
                   </button>
                   {/* أدوات التحكم السريعة للجوال فقط */}
{selectedStudentId && (
  <div className="flex md:hidden items-center justify-between bg-slate-800 p-2 border-b border-slate-700">
    <div className="flex items-center gap-1">
      <button 
        onClick={() => handleUpdateMaxMessages(maxMessages + 1)} 
        className="bg-slate-700 text-white px-2 py-1 rounded text-xs font-bold active:bg-blue-600"
      >
        +1
      </button>
      <button 
        onClick={() => handleUpdateMaxMessages(maxMessages + 5)} 
        className="bg-slate-700 text-white px-2 py-1 rounded text-xs font-bold active:bg-blue-600"
      >
        +5
      </button>
    </div>
    
    <div className="flex items-center gap-1">
      <input 
        type="number" 
        value={maxMessages} 
        onChange={(e) => setMaxMessages(e.target.value)}
        className="w-10 bg-slate-900 text-white text-xs p-1 rounded border border-slate-600 text-center"
      />
      <button 
        onClick={() => handleUpdateMaxMessages(maxMessages)}
        disabled={isUpdatingMax}
        className="bg-blue-600 text-white p-1.5 rounded text-[10px]"
      >
        {isUpdatingMax ? '...' : <FaCheck />}
      </button>
    </div>
    
    <div className="text-[10px] text-slate-400">
      الرصيد: <span className="text-blue-400">{sentCount}/{maxMessages}</span>
    </div>
  </div>
)}
                   
                   <div className="relative">
                       {selectedStudentObj.photo ? (
                          <img src={selectedStudentObj.photo} alt="Student" className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-slate-600" />
                       ) : (
                          <FaUserCircle className="text-4xl md:text-5xl text-slate-500" />
                       )}
                       <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${isSelectedOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                   </div>
                   <div className="flex-1">
                     <h3 className="text-base md:text-xl font-bold text-white leading-none">{selectedStudentObj.name}</h3>
                     <p className={`text-[10px] md:text-xs font-medium mt-1 ${isSelectedOnline ? 'text-green-400' : 'text-slate-400'}`}>
                        {isSelectedOnline ? 'متصل الآن' : 'غير متصل'}
                     </p>
                   </div>
                 </div>

                 <div className="hidden sm:flex flex-col items-center bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 shadow-inner">
                    <span className="text-[9px] text-slate-400 mb-0.5">رسائل الطالب: المستهلك {sentCount} من المسموح {maxMessages}</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleUpdateMaxMessages(maxMessages + 1)} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white p-1 rounded font-bold" title="إضافة رسالة">
                        +1
                      </button>
                      <button onClick={() => handleUpdateMaxMessages(maxMessages + 5)} className="text-[10px] bg-slate-700 hover:bg-slate-600 text-white p-1 rounded font-bold mr-1" title="إضافة 5 رسائل">
                        +5
                      </button>
                      
                      <div className="w-px h-5 bg-slate-600 mx-1"></div>
                      
                      <input 
                        type="number" 
                        min="0"
                        value={maxMessages} 
                        onChange={(e) => setMaxMessages(e.target.value)}
                        className="w-12 bg-slate-800 text-white font-bold text-xs p-1 rounded border border-slate-600 text-center focus:outline-none focus:border-blue-500"
                      />
                      <button 
                        onClick={() => handleUpdateMaxMessages(maxMessages)}
                        disabled={isUpdatingMax}
                        className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded transition-colors flex items-center justify-center"
                        title="حفظ الحد الجديد"
                      >
                        <FaCheck />
                      </button>
                    </div>
                 </div>
               </div>
             ) : (
               <div className="flex items-center w-full">
                  <button onClick={() => setShowMobileList(true)} className="md:hidden p-2 text-slate-400 hover:text-white ml-2 bg-slate-700 rounded-full"><FaArrowRight /></button>
                  <h3 className="text-lg font-bold text-slate-400">اختر طالباً للمحادثة</h3>
               </div>
             )}
          </div>

          {selectedStudentId && isLimitReached && (
             <div className="bg-red-500/10 border-b border-red-500/20 p-2.5 flex justify-center items-center text-red-400 text-xs font-bold gap-2 z-10 shadow-sm">
               <FaInfoCircle className="text-lg" />
               لقد انتهت الرسائل المسموحة لهذا الطالب ({sentCount}/{maxMessages}). قم بزيادة الحد ليتمكن من مراسلتك مجدداً.
             </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar relative bg-[#0f172a]">
            {loading ? (
              <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            ) : !selectedStudentId ? (
              <div className="flex flex-col justify-center items-center h-full text-slate-500 gap-3">
                 <FaUserCircle className="text-6xl opacity-30" />
                <p>اختر طالب من القائمة للبدء</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex justify-center items-center h-full text-slate-500 bg-slate-800/50 rounded-2xl p-4 m-4 md:m-10 border border-slate-700">
                لا توجد رسائل سابقة.
              </div>
            ) : (
              messages.map((msg) => {
                const isTeacher = msg.sender_type === 'teacher';
                return (
                  <div key={msg.id} className={`flex flex-col ${isTeacher ? 'items-end' : 'items-start'}`}>
                    <div className="flex items-center gap-2 group">
                      
                      <button 
                        onClick={() => handleDeleteMessage(msg.id)}
                        className={`opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 p-2 transition-opacity ${msg.isTemp ? 'hidden' : ''}`}
                        title="حذف الرسالة"
                      >
                        <FaTrash className="text-xs" />
                      </button>

                      <div 
                        className={`max-w-[85%] md:max-w-md p-3.5 rounded-2xl relative shadow-md ${
                          isTeacher 
                            ? 'bg-blue-600 text-white rounded-tl-sm' 
                            : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tr-sm'
                        } ${msg.isTemp ? 'opacity-70' : ''}`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                        <div className="flex items-center justify-end gap-1 mt-1 opacity-70">
                          <span className="text-[10px]" dir="ltr">
                            {msg.isTemp ? 'إرسال...' : new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          
                          {isTeacher && !msg.isTemp && (
                            <span className="text-[10px] ml-1">
                              {msg.is_read ? <FaCheckDouble className="text-blue-300" /> : <FaCheck />}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            
            {selectedStudentId && typingUsers.has(selectedStudentId) && (
               <div className="flex justify-start mt-2">
                  <div className="bg-slate-800 text-slate-300 px-4 py-2.5 rounded-2xl rounded-tr-sm text-xs flex items-center gap-2 shadow-sm border border-slate-700">
                     <span className="flex gap-1">
                       <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                       <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></span>
                       <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></span>
                     </span>
                     <span className="font-medium text-slate-400">الطالب يكتب الآن...</span>
                  </div>
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 md:p-4 bg-slate-800 border-t border-slate-700 z-10 pb-6 md:pb-4">
            <div className="flex sm:hidden justify-between items-center text-[10px] text-slate-400 mb-2 px-2">
              <span>المتبقي: {Math.max(0, maxMessages - sentCount)} رسائل</span>
              <button onClick={() => handleUpdateMaxMessages(maxMessages + 5)} className="text-[10px] bg-slate-700 text-white px-2 py-1 rounded flex items-center gap-1">
                 <FaPlus /> 5
              </button>
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={!selectedStudentId}
                placeholder={selectedStudentId ? "اكتب رسالتك للطالب هنا..." : "اختر طالباً للرد عليه..."}
                className="flex-1 bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-none max-h-32 custom-scrollbar disabled:opacity-50"
                rows="1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || !selectedStudentId}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white h-[50px] w-[50px] rounded-full transition-colors flex items-center justify-center flex-shrink-0 shadow-lg"
              >
                <FaPaperPlane className={document.dir === 'rtl' ? 'transform rotate-180 mr-1' : ''} />
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TeacherChat;