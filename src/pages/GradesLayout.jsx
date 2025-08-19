import React from "react";
import GradesButtons from "./GradesButtons";
import GradesTable from "./GradesTable";
import GradeModal from "./GradeModal";
import { FaSyncAlt, FaSearch } from "react-icons/fa";
import GradesSheet from "./GradesSheet";
import BriefSheet from "./BriefSheet";

const GradesLayout = ({
    children,
    schoolName,
    teacherName,
    showAddForm,
    setShowAddForm,
    exportToExcel,
    fileInputRef,
    handleFileImport,
    setShowCurriculumModal,
    setShowRecitationModal,
    setShowHomeworkCurriculumModal,
    setShowHomeworkModal,
    setShowNotesModal,
    setShowStarsModal,
    setShowGradesModal,
    showGradeSheet,
    setShowGradeSheet,
    setShowBriefSheet,
    showBriefSheet,
    setSelectedStudent,
    navigate,
    gradeId,
    fetchDataFromLocalStorage,
    isRefreshing,
    searchQuery,
    setSearchQuery,
    filteredStudents,
    gradeName,
    sectionName,
    selectedStudent,
    gradesSectionRef,
    setEditingStudent,
    setShowEditForm,
    showEditForm,
    editingStudent,
    handleEditStudent,
    handleFileUpload,
    filePhotoInputRef,
    showCamera,
    setShowCamera,
    startCamera,
    capturePhoto,
    stopCamera,
    canvasRef,
    videoRef,
    newStudentFilePhotoInputRef,
    newStudent,
    setNewStudent,
    handleAddStudent,
    calculateTotalScore,
    calculateCategoryScore,
    students
}) => {
    return (
        <div className="p-4 md:p-8 max-w-8xl mx-auto font-['Noto_Sans_Arabic',sans-serif] text-right bg-gray-900 text-gray-100 min-h-screen" dir="rtl">
            <header className="flex flex-col md:flex-row justify-center items-center bg-gray-800 p-4 md:p-6 shadow-lg rounded-xl mb-4 md:mb-8 border border-gray-700 text-center">
                <div className="flex items-center gap-2 md:gap-4 mb-4 md:mb-0">
                    <div className="flex flex-col">
                        <h1 className="text-xl md:text-3xl font-extrabold text-blue-400">
                            {schoolName}
                        </h1>
                        <p className="text-sm md:text-lg font-medium text-gray-400">
                            {teacherName}
                        </p>
                    </div>
                    <img src="/images/moe_logo_white.png" alt="شعار وزارة التعليم" className="h-12 w-12 md:h-16 md:w-16" />
                </div>
            </header>

            <GradesButtons
                setShowAddForm={setShowAddForm} showAddForm={showAddForm}
                exportToExcel={exportToExcel} fileInputRef={fileInputRef}
                handleFileImport={handleFileImport} setShowCurriculumModal={setShowCurriculumModal}
                setShowRecitationModal={setShowRecitationModal} setShowHomeworkCurriculumModal={setShowHomeworkCurriculumModal}
                setShowHomeworkModal={setShowHomeworkModal} setShowNotesModal={setShowNotesModal}
                setShowStarsModal={setShowStarsModal} setShowGradesModal={setShowGradesModal}
                showGradeSheet={showGradeSheet} setShowGradeSheet={setShowGradeSheet}
                setShowBriefSheet={setShowBriefSheet} showBriefSheet={showBriefSheet}
                setSelectedStudent={setSelectedStudent} navigate={navigate}
                gradeId={gradeId} fetchDataFromLocalStorage={fetchDataFromLocalStorage}
                isRefreshing={isRefreshing}
            />

            <div className="relative flex items-center w-full md:w-auto mt-4 md:mt-0 mb-4">
                <FaSearch className="absolute right-3 text-gray-400" />
                <input
                    type="text"
                    placeholder="ابحث بالاسم..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full md:w-64 p-2 pr-10 border border-gray-600 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-right text-sm"
                />
            </div>
            {isRefreshing && (
                <div className="fixed top-4 right-1/2 translate-x-1/2 z-50 bg-green-500 text-white py-2 px-4 rounded-xl shadow-lg flex items-center gap-2">
                    <FaSyncAlt className="animate-spin" />
                    <span>يتم تحديث البيانات...</span>
                </div>
            )}
            
            {children}

            {showGradeSheet && (
                <GradesSheet 
                    students={students}
                    calculateTotalScore={calculateTotalScore}
                    calculateCategoryScore={calculateCategoryScore}
                    gradeName={gradeName}
                    sectionName={sectionName}
                />
            )}
            
            {showBriefSheet && (
                <BriefSheet
                    students={students}
                    calculateTotalScore={calculateTotalScore}
                    calculateCategoryScore={calculateCategoryScore}
                    gradeName={gradeName}
                    sectionName={sectionName}
                />
            )}

            {!showGradeSheet && !showBriefSheet && (
                <GradesTable
                    filteredStudents={filteredStudents}
                    gradeName={gradeName}
                    sectionName={sectionName}
                    setSelectedStudent={setSelectedStudent}
                    selectedStudent={selectedStudent}
                    setEditingStudent={setEditingStudent}
                    setShowEditForm={setShowEditForm}
                />
            )}

            {showAddForm && (
                <GradeModal
                    title="إضافة طالب جديد"
                    studentData={newStudent}
                    setStudentData={setNewStudent}
                    onSave={handleAddStudent}
                    onCancel={() => { setShowAddForm(false); setNewStudent({ name: "", nationalId: "", phone: "", parentPhone: "", photo: "" }); }}
                    isAddForm={true}
                    showCamera={showCamera}
                    setShowCamera={setShowCamera}
                    startCamera={startCamera}
                    capturePhoto={capturePhoto}
                    stopCamera={stopCamera}
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    handleFileUpload={handleFileUpload}
                    filePhotoInputRef={newStudentFilePhotoInputRef}
                />
            )}

            {showEditForm && editingStudent && (
                <GradeModal
                    title="تعديل بيانات الطالب"
                    studentData={editingStudent}
                    setStudentData={setEditingStudent}
                    onSave={handleEditStudent}
                    onCancel={() => { setShowEditForm(false); setEditingStudent(null); }}
                    isAddForm={false}
                    showCamera={showCamera}
                    setShowCamera={setShowCamera}
                    startCamera={startCamera}
                    capturePhoto={capturePhoto}
                    stopCamera={stopCamera}
                    videoRef={videoRef}
                    canvasRef={canvasRef}
                    handleFileUpload={handleFileUpload}
                    filePhotoInputRef={filePhotoInputRef}
                />
            )}

            {selectedStudent && !showGradeSheet && !showBriefSheet && (
                <div ref={gradesSectionRef} className="bg-gray-800 p-4 md:p-8 rounded-xl shadow-lg mt-4 md:mt-6 border border-gray-700" dir="rtl">
                    ... // The rest of the GradesTable content for selected student
                </div>
            )}
        </div>
    );
};

export default GradesLayout;