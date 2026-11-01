import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import useAuthStore from '../stores/authStore';

export default function StudentLayout() {
  const { user } = useAuthStore();

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'student' && user.role !== 'admin') {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex flex-col md:flex-row flex-1 min-w-0 max-w-7xl w-full mx-auto">
        <Sidebar role="student" />
        <main className="min-w-0 flex-1 p-3 sm:p-5 lg:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
