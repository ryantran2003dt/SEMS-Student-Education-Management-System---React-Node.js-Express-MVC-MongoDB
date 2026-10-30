import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import useAuthStore from '../stores/authStore';

export default function TeacherLayout() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'teacher' && user.role !== 'admin') {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        <Sidebar role="teacher" />
        <main className="flex-1 p-6 sm:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
