// src/components/StudentChat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { FaPaperPlane, FaTimes, FaInfoCircle, FaCommentSlash, FaUserCircle } from 'react-icons/fa';

const StudentChat = ({ studentId, teacherId, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  
  const [isTeacherOnline, setIsTeacherOnline] = useState(false);
  const [maxMessages, setMaxMessages] = useState(5);
  const [sentCount, setSentCount] = useState(0);
  const [teacherName, setTeacherName] = useState("المعلم");

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const globalChannelRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 1. نظام الاتصال والكتابة المشترك واستقبال الإشعار اللحظي لتحديث الحد
  useEffect(() => {
    if (!studentId || !teacherId) return;

    const globalChannel = supabase.channel('chat_global', {
        config: { presence: { key: studentId } }
    });
    globalChannelRef.current = globalChannel;

    globalChannel
      .on('presence', { event: 'sync' }, () => {
        const state = globalChannel.presenceState();
        let teacherOnline = false;
        for (const key in state) {
           if (state[key].some(user => user.type === 'teacher' && user.user_id === teacherId)) {
             teacherOnline = true;
           }
        }
        setIsTeacherOnline(teacherOnline);
      })
      .on('broadcast', { event: 'update_limit' }, (payload) => {
         // تحديث الحد فوراً إذا كان الإشعار موجه لهذا الطالب
         if (payload.payload.studentId === studentId) {
             setMaxMessages(payload.payload.newLimit);
         }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await globalChannel.track({ user_id: studentId, type: 'student' });
        }
      });

    return () => {
      supabase.removeChannel(globalChannel);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [studentId, teacherId]);

  // 2. جلب وتحديث الرسائل ورصيد الطالب واسم المعلم
  useEffect(() => {
    if (!studentId || !teacherId) return;

    const fetchInitialData = async () => {
      setLoading(true);
      
      const { data: settingsData } = await supabase.from('settings').select('*').limit(1).single();
      if (settingsData && settingsData.teacher_name) {
          setTeacherName(settingsData.teacher_name);
      } else if (settingsData && settingsData.name) {
          setTeacherName(settingsData.name);
      }

      const { data: studentData } = await supabase.from('students').select('max_allowed_messages').eq('id', studentId).single();
      if (studentData?.max_allowed_messages !== undefined) setMaxMessages(studentData.max_allowed_messages);

      const { data: messagesData, error } = await supabase.from('messages').select('*').eq('student_id', studentId).eq('teacher_id', teacherId).order('created_at', { ascending: true });

      if (!error && messagesData) {
        setMessages(messagesData);
        setSentCount(messagesData.filter(m => m.sender_type === 'student').length);
      }

      await supabase.from('messages').update({ is_read: true }).eq('student_id', studentId).eq('teacher_id', teacherId).eq('sender_type', 'teacher').eq('is_read', false);
      setLoading(false);
    };

    fetchInitialData();

    // الاستماع للرسائل الجديدة
    const msgSubscription = supabase.channel(`public:messages_${studentId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `student_id=eq.${studentId}` }, (payload) => {
        setMessages(prev => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev.filter(m => !(m.isTemp && m.content === payload.new.content)), payload.new];
        });
        if (payload.new.sender_type === 'teacher') {
            supabase.from('messages').update({ is_read: true }).eq('id', payload.new.id);
        } else {
            setSentCount(prev => prev + 1);
        }
      })
      .subscribe();

    const studentSubscription = supabase.channel(`public:students_${studentId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students', filter: `id=eq.${studentId}` }, (payload) => {
         if (payload.new.max_allowed_messages !== undefined) {
             setMaxMessages(payload.new.max_allowed_messages);
         }
      })
      .subscribe();

    return () => { 
      supabase.removeChannel(msgSubscription); 
      supabase.removeChannel(studentSubscription);
    };
  }, [studentId, teacherId]);

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (globalChannelRef.current) {
      globalChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { studentId, isTyping: true } });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (globalChannelRef.current) {
        globalChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { studentId, isTyping: false } });
      }
    }, 2000);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sentCount >= maxMessages) return;

    const messageText = newMessage.trim();
    setNewMessage(""); 

    if (globalChannelRef.current) {
      globalChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { studentId, isTyping: false } });
    }

    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      student_id: studentId,
      teacher_id: teacherId,
      sender_type: 'student',
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
        student_id: studentId,
        teacher_id: teacherId,
        sender_type: 'student',
        content: messageText,
        is_read: false
      }]).select().single();

    if (error) {
      setMessages(prev => prev.filter(m => m.id !== tempId));
    } else {
      setMessages(prev => prev.map(m => m.id === tempId ? data : m));
    }
  };

  const isLimitReached = sentCount >= maxMessages;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-0 md:p-4" dir="rtl">
      <div className="bg-slate-900 w-full h-full md:max-w-md md:h-[650px] md:rounded-3xl shadow-2xl border-0 md:border border-slate-700 flex flex-col animate-fadeIn overflow-hidden">
        
        <div className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
               <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center border-2 border-slate-600">
                  <FaUserCircle className="text-3xl text-slate-400" />
               </div>
               <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-800 ${isTeacherOnline ? 'bg-green-500' : 'bg-slate-500'}`}></div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white leading-tight">{teacherName}</h3>
              <p className={`text-xs font-medium mt-0.5 ${isTeacherOnline ? 'text-green-400' : 'text-slate-400'}`}>
                {isTeacherOnline ? 'متصل الآن' : 'غير متصل'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="text-center">
                <p className="text-[10px] text-slate-400 mb-0.5">الرسائل المسموحة</p>
                <div className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${isLimitReached ? "bg-red-500/20 text-red-400" : "bg-blue-500/20 text-blue-400"}`}>
                  {sentCount} / {maxMessages}
                </div>
             </div>
            <button onClick={onClose} className="p-2.5 text-slate-400 hover:text-red-400 bg-slate-700/50 hover:bg-slate-700 rounded-full transition-colors">
              <FaTimes />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 custom-scrollbar bg-[#0f172a] relative pb-6">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-3">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center">
                 <FaInfoCircle className="text-3xl opacity-50" />
              </div>
              <p className="text-sm font-medium">ابدأ المحادثة الآن</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isStudent = msg.sender_type === 'student';
              return (
                <div key={msg.id} className={`flex ${isStudent ? 'justify-start' : 'justify-end'}`}>
                  <div 
                    className={`max-w-[85%] p-3.5 rounded-2xl relative shadow-md ${
                      isStudent 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-sm'
                    } ${msg.isTemp ? 'opacity-70' : ''}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <div className="text-[10px] opacity-60 mt-2 text-left flex justify-end items-center gap-1" dir="ltr">
                      {msg.isTemp && <span className="text-blue-200 text-[9px]">جاري الإرسال...</span>}
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 bg-slate-800 border-t border-slate-700 z-10 pb-6 md:pb-4">
          {isLimitReached ? (
            <div className="flex items-center justify-center gap-2 p-3 bg-red-900/20 border border-red-800/30 rounded-2xl text-red-400 text-sm font-bold">
              <FaCommentSlash /> لقد استنفدت الحد المسموح لك من الرسائل
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2 items-end">
              <textarea
                value={newMessage}
                onChange={handleTyping}
                placeholder="اكتب رسالتك..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-2xl px-4 py-3.5 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm resize-none max-h-32 custom-scrollbar"
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
                disabled={!newMessage.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white h-[50px] w-[50px] rounded-full transition-colors flex items-center justify-center flex-shrink-0 shadow-lg"
              >
                <FaPaperPlane className={document.dir === 'rtl' ? 'transform rotate-180 mr-1' : ''} />
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default StudentChat;