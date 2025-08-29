// src/pages/TeacherDashboard.jsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { gradesData } from "../data/mockData";
import Navbar from "../components/Navbar";
import { FaUserGraduate, FaBars, FaTimes, FaCog, FaRedo, FaDownload, FaTrash, FaFolderOpen, FaChartBar } from "react-icons/fa";
import { supabase } from "../supabaseClient";

const TeacherDashboard = () => {
  const navigate = useNavigate();

  const [totalStudents, setTotalStudents] = useState(0);
  const [averageGrade, setAverageGrade] = useState(0);
  const [studentsPerGrade, setStudentsPerGrade] = useState({});
  const [loading, setLoading] = useState(true);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [teacherName, setTeacherName] = useState("");
  const [teacherPhoto, setTeacherPhoto] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [currentSemester, setCurrentSemester] = useState("");

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalError, setModalError] = useState("");

  const [user, setUser] = useState(null);
  const [teacherId, setTeacherId] = useState(null);

  const [backups, setBackups] = useState([]);
  const [selectedBackupKey, setSelectedBackupKey] = useState(null);
  const BACKUP_LIST_KEY = "grades_backup_list";

  const [customDialog, setCustomDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => {},
    onClose: () => {},
    inputs: {},
  });

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        const currentUser = session?.user || null;
        setUser(currentUser);
        if (currentUser) {
          setTeacherId(currentUser.id);
        } else {
          navigate("/");
        }
      }
    );
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    const fetchAndCalculateData = async () => {
      setLoading(true);
      if (!teacherId) {
        setLoading(false);
        return;
      }

      try {
        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, grade_level, section')
          .eq('teacher_id', teacherId);

        if (studentsError) {
          throw studentsError;
        }

        const studentsCountPerGrade = {};
        gradesData.forEach(grade => {
          studentsCountPerGrade[grade.id] = 0;
        });

        if (studentsData) {
          setTotalStudents(studentsData.length);
          studentsData.forEach(student => {
            if (student.grade_level) {
              studentsCountPerGrade[student.grade_level] = (studentsCountPerGrade[student.grade_level] || 0) + 1;
            }
          });
        }
        setStudentsPerGrade(studentsCountPerGrade);

        const { data: studentsGradesData, error: gradesError } = await supabase
          .from('students')
          .select('grades')
          .eq('teacher_id', teacherId);

        if (gradesError) {
          throw gradesError;
        }

        let allGrades = [];
        if (studentsGradesData) {
          studentsGradesData.forEach(studentRecord => {
            if (studentRecord.grades && studentRecord.grades.tests) {
              allGrades.push(...Object.values(studentRecord.grades.tests));
            }
          });
        }

        if (allGrades.length > 0) {
          const sumOfGrades = allGrades.reduce((acc, grade) => acc + (grade || 0), 0);
          const avg = (sumOfGrades / allGrades.length).toFixed(1);
          setAverageGrade(avg);
        } else {
          setAverageGrade(0);
        }

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    const fetchSettings = async () => {
      if (!teacherId) return;
      try {
        const { data, error } = await supabase
          .from('settings')
          .select('teacher_name, school_name, current_semester, teacher_photo')
          .eq('id', 'general')
          .single();

        if (error && error.code !== 'PGRST205' && error.code !== 'PGRST116') {
          throw error;
        }

        if (data) {
          setTeacherName(data.teacher_name || "اسم المعلم");
          setSchoolName(data.school_name || "اسم المدرسة");
          setCurrentSemester(data.current_semester || "الفصل الدراسي");
          setTeacherPhoto(data.teacher_photo || "/images/default_teacher.png");
        } else {
          const { data: newSettings, error: insertError } = await supabase
            .from('settings')
            .insert([{ id: 'general' }])
            .single();
          if (insertError) {
            console.error("Error creating default settings:", insertError);
          }
        }
      } catch (err) {
        console.error("Failed to fetch settings from Supabase", err);
        setTeacherName("اسم المعلم");
        setSchoolName("اسم المدرسة");
        setCurrentSemester("الفصل الدراسي");
        setTeacherPhoto("/images/default_teacher.png");
      }
    };

    const loadBackups = async () => {
      if (!teacherId) {
        return;
      }
      try {
        const { data, error } = await supabase
          .from('backups')
          .select('id, created_at, title')
          .eq('teacher_id', teacherId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setBackups(data || []);
      } catch (err) {
        console.error("Failed to load backups:", err);
        setBackups([]);
      }
    };

    if (teacherId) {
      fetchAndCalculateData();
      fetchSettings();
      loadBackups();
    }
  }, [teacherId]);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleUpdateTeacherInfo = () => {
    setCustomDialog({
      isOpen: true,
      title: "تعديل بيانات المعلم",
      message: "يرجى إدخال البيانات الجديدة:",
      inputs: {
        teacherName: { label: "اسم المعلم", value: teacherName },
        schoolName: { label: "اسم المدرسة", value: schoolName },
        currentSemester: { label: "الفصل الدراسي", value: currentSemester },
        teacherPhoto: { label: "رابط الصورة", value: teacherPhoto },
      },
      onConfirm: async (inputs) => {
        try {
          const { error } = await supabase
            .from('settings')
            .update({
              teacher_name: inputs.teacherName,
              school_name: inputs.schoolName,
              current_semester: inputs.currentSemester,
              teacher_photo: inputs.teacherPhoto,
            })
            .eq('id', 'general');

          if (error) {
            throw error;
          }

          setTeacherName(inputs.teacherName);
          setSchoolName(inputs.schoolName);
          setCurrentSemester(inputs.currentSemester);
          setTeacherPhoto(inputs.teacherPhoto);
          setCustomDialog({ ...customDialog, isOpen: false });
        } catch (err) {
          console.error("Error updating settings:", err);
          setModalError("فشل تحديث البيانات. يرجى المحاولة مرة أخرى.");
        }
      },
      onCancel: () => setCustomDialog({ ...customDialog, isOpen: false }),
      onClose: () => setCustomDialog({ ...customDialog, isOpen: false }),
    });
  };

  const handleResetData = () => {
    setModalError("");
    setModalMessage("");
    setEmail("");
    setPassword("");
    setIsResetModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleRestoreData = () => {
    setModalError("");
    setModalMessage("");
    setEmail("");
    setPassword("");
    setSelectedBackupKey(null);
    setIsRestoreModalOpen(true);
    setIsMenuOpen(false);
  };

  const handleResetConfirm = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalMessage("");

    if (!user || !teacherId) {
      setModalError("يجب أن تكون مسجلاً للدخول لإجراء هذه العملية.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      let errorMessage = "فشل المصادقة: البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة.";
      }
      setModalError(errorMessage);
      return;
    }

    if (data.user && data.user.id === user.id) {
      setIsResetModalOpen(false);
      setCustomDialog({
        isOpen: true,
        title: "أخذ نسخة احتياطية قبل الحذف",
        message: "هل ترغب في أخذ نسخة احتياطية من البيانات الحالية قبل حذفها؟",
        onConfirm: () => {
          handleBackupData(() => {
            setCustomDialog({ ...customDialog, isOpen: false });
            showResetConfirmation();
          });
        },
        onCancel: () => {
          setCustomDialog({ ...customDialog, isOpen: false });
          showResetConfirmation();
        },
        onClose: () => setCustomDialog({ ...customDialog, isOpen: false })
      });
    } else {
      setModalError("البريد الإلكتروني الذي أدخلته لا يتطابق مع المستخدم الحالي.");
    }
  };

  const showResetConfirmation = () => {
    setCustomDialog({
      isOpen: true,
      title: "تأكيد الحذف النهائي",
      message: "هل أنت متأكد من حذف كافة بيانات الطلاب؟ هذا الإجراء لا يمكن التراجع عنه.",
      onConfirm: async () => {
        try {
          const { error: deleteGradesError } = await supabase
            .from('grades')
            .delete()
            .eq('teacher_id', teacherId);

          const { error: deleteStudentsError } = await supabase
            .from('students')
            .delete()
            .eq('teacher_id', teacherId);

          if (deleteGradesError || deleteStudentsError) {
            throw new Error("فشل حذف البيانات");
          }

          setModalMessage("تم حذف بيانات الطلاب بنجاح.");
          setTimeout(() => {
            setCustomDialog({ ...customDialog, isOpen: false });
            window.location.reload();
          }, 2000);
        } catch (err) {
          setCustomDialog({ ...customDialog, isOpen: false });
          setModalError("فشل حذف البيانات. يرجى المحاولة مرة أخرى.");
          console.error("Error deleting data:", err);
        }
      },
      onCancel: () => setCustomDialog({ ...customDialog, isOpen: false }),
      onClose: () => setCustomDialog({ ...customDialog, isOpen: false })
    });
  };

  const handleRestoreConfirm = async (e) => {
    e.preventDefault();
    setModalError("");
    setModalMessage("");

    if (!user || !teacherId) {
      setModalError("يجب أن تكون مسجلاً للدخول لإجراء هذه العملية.");
      return;
    }

    if (!selectedBackupKey) {
      setModalError("الرجاء اختيار نسخة احتياطية للاستعادة.");
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      let errorMessage = "فشل المصادقة: البريد الإلكتروني أو كلمة المرور غير صحيحة.";
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة.";
      }
      setModalError(errorMessage);
      return;
    }

    if (data.user && data.user.id === user.id) {
      setIsRestoreModalOpen(false);
      try {
        const { data: backupData, error: fetchError } = await supabase
          .from('backups')
          .select('data')
          .eq('id', selectedBackupKey)
          .eq('teacher_id', teacherId)
          .single();

        if (fetchError || !backupData || !backupData.data) {
          throw new Error("النسخة الاحتياطية المختارة غير موجودة أو فارغة.");
        }

        setCustomDialog({
          isOpen: true,
          title: "تأكيد الاسترداد",
          message: "هل أنت متأكد من استعادة البيانات؟ هذا الإجراء سيحل محل البيانات الحالية.",
          onConfirm: async () => {
            const parsedBackup = backupData.data;

            await supabase.from('students').delete().eq('teacher_id', teacherId);
            await supabase.from('grades').delete().eq('teacher_id', teacherId);

            const { error: studentsInsertError } = await supabase
              .from('students')
              .insert(parsedBackup.students);
            
            const { error: gradesInsertError } = await supabase
              .from('grades')
              .insert(parsedBackup.grades);

            if (studentsInsertError || gradesInsertError) {
              throw new Error("فشل استعادة البيانات.");
            }

            setModalMessage("تم استعادة بيانات الطلاب بنجاح.");
            setTimeout(() => {
              setCustomDialog({ ...customDialog, isOpen: false });
              window.location.reload();
            }, 2000);
          },
          onCancel: () => setCustomDialog({ ...customDialog, isOpen: false }),
          onClose: () => setCustomDialog({ ...customDialog, isOpen: false }),
        });
      } catch (err) {
        setModalError("حدث خطأ أثناء استعادة البيانات.");
        console.error("Restore error:", err);
      }
    } else {
      setModalError("البريد الإلكتروني الذي أدخلته لا يتطابق مع المستخدم الحالي.");
    }
  };

  const handleBackupData = async (callback = () => {}) => {
    if (!user || !teacherId) {
      setModalError("يجب أن تكون مسجلاً للدخول لحفظ نسخة احتياطية.");
      return;
    }

    setCustomDialog({
      isOpen: true,
      title: "حفظ نسخة احتياطية",
      message: "أدخل عنوانًا لهذه النسخة الاحتياطية (اختياري).",
      inputs: {
        backupTitle: { label: "عنوان النسخة الاحتياطية", value: "" },
      },
      onConfirm: async (inputs) => {
        try {
          const title = inputs.backupTitle || `نسخة احتياطية بتاريخ: ${new Date().toLocaleString('ar-EG')}`;
          const { data: studentsData, error: studentsError } = await supabase
            .from('students')
            .select('*')
            .eq('teacher_id', teacherId);
          
          const { data: gradesData, error: gradesError } = await supabase
            .from('grades')
            .select('*')
            .eq('teacher_id', teacherId);

          if (studentsError || gradesError) {
            throw new Error("فشل جلب البيانات لحفظ النسخة الاحتياطية.");
          }

          if (studentsData.length === 0) {
            setCustomDialog({
              isOpen: true,
              title: "لا يمكن الحفظ",
              message: "لا توجد بيانات طلاب لحفظها.",
              onConfirm: () => setCustomDialog({ ...customDialog, isOpen: false }),
              onClose: () => setCustomDialog({ ...customDialog, isOpen: false }),
            });
            return;
          }

          const backupData = {
            students: studentsData,
            grades: gradesData,
          };

          const { error: insertError } = await supabase
            .from('backups')
            .insert([{ teacher_id: teacherId, title: title, data: backupData }]);

          if (insertError) {
            throw insertError;
          }

          setCustomDialog({
            isOpen: true,
            title: "تم بنجاح",
            message: "تم حفظ نسخة احتياطية من بيانات الطلاب بنجاح.",
            onConfirm: () => {
              setCustomDialog({ ...customDialog, isOpen: false });
              callback();
            },
            onClose: () => {
              setCustomDialog({ ...customDialog, isOpen: false });
              callback();
            },
          });

        } catch (err) {
          console.error("Error creating backup:", err);
          setModalError("فشل حفظ النسخة الاحتياطية.");
        }
      },
      onCancel: () => setCustomDialog({ ...customDialog, isOpen: false }),
      onClose: () => setCustomDialog({ ...customDialog, isOpen: false }),
    });
  };

  const handleDeleteBackup = (backupId) => {
    setIsRestoreModalOpen(false);

    setCustomDialog({
      isOpen: true,
      title: "تأكيد الحذف",
      message: "هل أنت متأكد من حذف هذه النسخة الاحتياطية؟",
      onConfirm: async () => {
        try {
          const { error } = await supabase
            .from('backups')
            .delete()
            .eq('id', backupId)
            .eq('teacher_id', teacherId);

          if (error) {
            throw error;
          }

          const updatedBackups = backups.filter(backup => backup.id !== backupId);
          setBackups(updatedBackups);
          setCustomDialog({ ...customDialog, isOpen: false });
          setTimeout(() => setIsRestoreModalOpen(true), 300);
        } catch (err) {
          console.error("Error deleting backup:", err);
          setModalError("فشل حذف النسخة الاحتياطية.");
          setCustomDialog({ ...customDialog, isOpen: false });
          setTimeout(() => setIsRestoreModalOpen(true), 300);
        }
      },
      onCancel: () => {
        setCustomDialog({ ...customDialog, isOpen: false });
        setTimeout(() => setIsRestoreModalOpen(true), 300);
      },
      onClose: () => {
        setCustomDialog({ ...customDialog, isOpen: false });
        setTimeout(() => setIsRestoreModalOpen(true), 300);
      },
    });
  };

  const CustomDialog = ({ isOpen, title, message, inputs, onConfirm, onCancel, onClose }) => {
    const [inputValues, setInputValues] = useState(inputs ? Object.fromEntries(Object.keys(inputs).map(key => [key, inputs[key].value])) : {});

    const handleInputChange = (e) => {
      const { name, value } = e.target;
      setInputValues(prev => ({ ...prev, [name]: value }));
    };

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
        <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
          <h3 className="text-xl font-bold text-blue-400 mb-4">{title}</h3>
          <p className="text-gray-300 mb-6">{message}</p>

          {inputs && (
            <div className="space-y-4 mb-6 text-right">
              {Object.keys(inputs).map(key => (
                <div key={key}>
                  <label className="block text-gray-400 text-sm mb-1">{inputs[key].label}</label>
                  <input
                    type="text"
                    name={key}
                    value={inputValues[key]}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-6">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition"
              >
                إلغاء
              </button>
            )}
            {onConfirm && (
              <button
                type="button"
                onClick={() => onConfirm(inputValues)}
                className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                تأكيد
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const handleNavigateToPortfolio = () => {
    navigate("/portfolio");
    setIsMenuOpen(false);
  };


  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-['Noto_Sans_Arabic',sans-serif]">
      <Navbar />
      <CustomDialog {...customDialog} />

      <button
        onClick={toggleMenu}
        className="fixed top-4 left-4 z-50 p-3 rounded-full bg-gray-800 text-white hover:bg-gray-700 transition-colors duration-300"
        aria-label="القائمة الجانبية"
      >
        <FaBars className="h-6 w-6" />
      </button>

      <div
        className={`fixed inset-y-0 right-0 z-40 w-64 bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out
                   ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-blue-400">القائمة</h2>
            <button onClick={toggleMenu} className="text-gray-400 hover:text-white transition-colors duration-300">
              <FaTimes className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center mb-8">
            <img src={teacherPhoto} alt="صورة المعلم" className="h-24 w-24 rounded-full mx-auto mb-4 object-cover border-4 border-blue-500" />
            <h4 className="text-lg font-bold text-white mb-1">{teacherName}</h4>
            <p className="text-sm text-gray-400">{schoolName}</p>
            <p className="text-sm text-gray-400">{currentSemester}</p>
            <button onClick={handleUpdateTeacherInfo} className="mt-4 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition flex items-center gap-2 mx-auto">
              <FaCog /> تعديل البيانات
            </button>
          </div>

          <div className="space-y-4">
            <button onClick={handleNavigateToPortfolio} className="w-full py-3 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition">
              <FaFolderOpen /> ملف الإنجاز
            </button>
            <button onClick={handleResetData} className="w-full py-3 bg-red-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-red-700 transition">
              <FaRedo /> إعادة تعيين
            </button>
            <button onClick={handleRestoreData} className="w-full py-3 bg-green-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-green-700 transition">
              <FaDownload /> استرداد
            </button>
            <button onClick={() => handleBackupData()} className="w-full py-3 bg-gray-700 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-gray-600 transition">
              <FaDownload /> حفظ نسخة احتياطية
            </button>
          </div>
        </div>
      </div>

      {isMenuOpen && (
        <div
          onClick={toggleMenu}
          className="fixed inset-0 bg-black opacity-50 z-30"
        ></div>
      )}

      {isResetModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-red-400 mb-4">تأكيد إعادة التعيين</h3>
            <p className="text-gray-300 mb-6">لإعادة تعيين بيانات الطلاب، يرجى إدخال بياناتك للمصادقة:</p>
            {modalError && <p className="text-red-500 mb-4">{modalError}</p>}
            {modalMessage && <p className="text-green-500 mb-4">{modalMessage}</p>}
            <form onSubmit={handleResetConfirm} className="space-y-4">
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex justify-between items-center mt-6">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition"
                >
                  تأكيد الحذف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isRestoreModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-[100]">
          <div className="bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md mx-4 text-center">
            <h3 className="text-xl font-bold text-green-400 mb-4">اختيار نسخة للاسترداد</h3>
            <p className="text-gray-300 mb-6">للاسترداد، يرجى إدخال بياناتك للمصادقة:</p>
            {modalError && <p className="text-red-500 mb-4">{modalError}</p>}
            {modalMessage && <p className="text-green-500 mb-4">{modalMessage}</p>}
            <form onSubmit={handleRestoreConfirm} className="space-y-4">
              <input
                type="email"
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="password"
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-md bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {backups.length > 0 ? (
                <ul className="text-right space-y-2 mb-6 max-h-60 overflow-y-auto">
                  {backups.map((backup) => (
                    <li
                      key={backup.id}
                      className={`flex justify-between items-center p-3 rounded-lg cursor-pointer transition-colors duration-200
                                 ${selectedBackupKey === backup.id ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}
                      onClick={() => setSelectedBackupKey(backup.id)}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-semibold">{backup.title}</span>
                        <span className="text-sm text-gray-400">
                          بتاريخ: {new Date(backup.created_at).toLocaleString("ar-EG", {
                            year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteBackup(backup.id); }}
                        className="text-red-400 hover:text-red-200"
                      >
                        <FaTrash />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-400 mb-6">لا توجد نسخ احتياطية متاحة.</p>
              )}

              <div className="flex justify-between items-center mt-6">
                <button
                  type="button"
                  onClick={() => setIsRestoreModalOpen(false)}
                  className="px-6 py-2 rounded-lg bg-gray-600 text-white hover:bg-gray-700 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={!selectedBackupKey}
                  className={`px-6 py-2 rounded-lg bg-green-600 text-white transition ${!selectedBackupKey ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-700'}`}
                >
                  تأكيد الاسترداد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className={`p-4 md:p-8 max-w-7xl mx-auto transition-all duration-300 ${isMenuOpen ? 'md:mr-64' : ''}`}>
        <div className="text-center mb-16">
          <div className="flex justify-center items-center gap-4 mb-4">
            <img
              src="/images/moe_logo_white.png"
              alt="شعار وزارة التعليم"
              className="h-24 md:h-32"
            />
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-blue-400 leading-tight">{schoolName}</h1>
          <p className="mt-2 text-md md:text-xl text-gray-300">لوحة تحكم المعلم لإدارة الفصول</p>
          <div className="mt-4 text-center">
            <div className="inline-flex items-center gap-4 p-2 bg-gray-800 rounded-full border border-gray-700">
              <img src={teacherPhoto} alt="صورة المعلم" className="h-10 w-10 rounded-full object-cover"/>
              <div>
                <span className="block text-sm font-semibold text-white">{teacherName}</span>
                <span className="block text-xs text-gray-400">{currentSemester}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {gradesData.map((grade) => (
            <div
              key={grade.id}
              onClick={() => navigate(`/grades/${grade.id}`)}
              className="relative rounded-3xl shadow-lg overflow-hidden transform transition-all duration-300 hover:scale-105 hover:shadow-2xl cursor-pointer
                         bg-gray-800 border border-gray-700 hover:border-blue-500"
            >
              <div className="p-8 text-center flex flex-col items-center">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-gray-700 text-blue-400 mx-auto mb-6">
                  <FaUserGraduate className="h-10 w-10" />
                </div>
                <h3 className="text-3xl font-bold mb-1 text-white">{grade.name}</h3>
                <p className="text-xl font-light opacity-80 text-gray-300">
                  {loading ? '...' : `${studentsPerGrade[grade.id] || 0} طالب`}
                </p>
              </div>
              <div className="flex justify-center items-center bg-gray-700 text-blue-400 py-4">
                <span className="text-md font-semibold">عرض الفصول →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};


export default TeacherDashboard;