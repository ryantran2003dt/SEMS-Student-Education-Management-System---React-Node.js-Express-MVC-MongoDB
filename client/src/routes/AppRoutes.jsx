import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from '../stores/authStore';

// Layouts
import AdminLayout from '../layouts/AdminLayout';
import TeacherLayout from '../layouts/TeacherLayout';
import StudentLayout from '../layouts/StudentLayout';
import ParentLayout from '../layouts/ParentLayout';

// Auth
import Login from '../pages/auth/Login';

// Admin
import AdminDashboard from '../pages/admin/AdminDashboard';
import UserManagement from '../pages/admin/UserManagement';
import AcademicManagement from '../pages/admin/AcademicManagement';
import ClassManagement from '../pages/admin/ClassManagement';
import AnalyticsReport from '../pages/admin/AnalyticsReport';

// Teacher
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import TeacherClasses from '../pages/teacher/TeacherClasses';
import AttendanceSheet from '../pages/teacher/AttendanceSheet';
import AssignmentStudio from '../pages/teacher/AssignmentStudio';
import GradingSubmissions from '../pages/teacher/GradingSubmissions';

// Student
import StudentDashboard from '../pages/student/StudentDashboard';
import StudentSchedule from '../pages/student/StudentSchedule';
import StudentAssignments from '../pages/student/StudentAssignments';
import TakeAssignment from '../pages/student/TakeAssignment';
import StudentProgress from '../pages/student/StudentProgress';
import StudentCertificates from '../pages/student/StudentCertificates';

// Parent
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentAttendance from '../pages/parent/ParentAttendance';
import ParentGrades from '../pages/parent/ParentGrades';

// Shared AI Chat
import AIChat from '../pages/shared/AIChat';
import MessageCenter from '../pages/shared/MessageCenter';

export default function AppRoutes() {
  const { user } = useAuthStore();

  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Admin routes */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="academic" element={<AcademicManagement />} />
        <Route path="classes" element={<ClassManagement />} />
        <Route path="reports" element={<AnalyticsReport />} />
        <Route path="messages" element={<MessageCenter />} />
      </Route>

      {/* Teacher routes */}
      <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<TeacherDashboard />} />
        <Route path="classes" element={<TeacherClasses />} />
        <Route path="attendance" element={<AttendanceSheet />} />
        <Route path="assignments" element={<AssignmentStudio />} />
        <Route path="grading" element={<GradingSubmissions />} />
        <Route path="ai-chat" element={<AIChat />} />
        <Route path="messages" element={<MessageCenter />} />
      </Route>

      {/* Student routes */}
      <Route path="/student" element={<StudentLayout />}>
        <Route index element={<StudentDashboard />} />
        <Route path="classes" element={<StudentSchedule />} />
        <Route path="assignments" element={<StudentAssignments />} />
        <Route path="assignments/:id" element={<TakeAssignment />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="certificates" element={<StudentCertificates />} />
        <Route path="ai-chat" element={<AIChat />} />
        <Route path="messages" element={<MessageCenter />} />
      </Route>

      {/* Parent routes */}
      <Route path="/parent" element={<ParentLayout />}>
        <Route index element={<ParentDashboard />} />
        <Route path="attendance" element={<ParentAttendance />} />
        <Route path="grades" element={<ParentGrades />} />
        <Route path="messages" element={<MessageCenter />} />
      </Route>

      {/* Default Catch-all */}
      <Route
        path="*"
        element={
          user ? (
            <Navigate to={`/${user.role}`} replace />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
