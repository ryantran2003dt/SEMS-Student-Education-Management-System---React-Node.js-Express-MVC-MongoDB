import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Calendar,
  CheckSquare,
  Sparkles,
  FileText,
  Award,
  BarChart3,
  Clock,
  GraduationCap,
  ClipboardList
} from 'lucide-react';

export default function Sidebar({ role }) {
  const getNavLinks = () => {
    switch (role) {
      case 'admin':
        return [
          { to: '/admin', label: 'Tổng quan hệ thống', icon: LayoutDashboard, end: true },
          { to: '/admin/users', label: 'Quản lý Tài khoản', icon: Users },
          { to: '/admin/academic', label: 'Môn & Khóa học', icon: BookOpen },
          { to: '/admin/classes', label: 'Quản lý Lớp & Lịch', icon: Calendar },
          { to: '/admin/reports', label: 'Báo cáo & Phân tích', icon: BarChart3 }
        ];
      case 'teacher':
        return [
          { to: '/teacher', label: 'Bảng điều khiển', icon: LayoutDashboard, end: true },
          { to: '/teacher/classes', label: 'Lớp học phụ trách', icon: BookOpen },
          { to: '/teacher/attendance', label: 'Điểm danh buổi học', icon: CheckSquare },
          { to: '/teacher/assignments', label: 'AI Assignment Studio', icon: Sparkles },
          { to: '/teacher/grading', label: 'Chấm điểm & Nhận xét', icon: ClipboardList }
        ];
      case 'student':
        return [
          { to: '/student', label: 'Bảng học tập', icon: LayoutDashboard, end: true },
          { to: '/student/classes', label: 'Lịch học & Buổi học', icon: Calendar },
          { to: '/student/assignments', label: 'Nhiệm vụ & Bài tập', icon: FileText },
          { to: '/student/progress', label: 'Tiến độ & Năng lực', icon: BarChart3 },
          { to: '/student/certificates', label: 'Chứng nhận', icon: Award }
        ];
      case 'parent':
        return [
          { to: '/parent', label: 'Tổng quan con', icon: LayoutDashboard, end: true },
          { to: '/parent/attendance', label: 'Theo dõi Điểm danh', icon: CheckSquare },
          { to: '/parent/grades', label: 'Điểm số & Nhận xét', icon: FileText }
        ];
      default:
        return [];
    }
  };

  const links = getNavLinks();

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between hidden md:flex shrink-0">
      <div className="space-y-1.5">
        <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Chức năng chính
        </div>
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>

      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 text-xs text-indigo-900">
        <div className="flex items-center gap-2 font-semibold mb-1 text-indigo-700">
          <Sparkles className="w-4 h-4" />
          <span>Trợ lý AI Giáo dục</span>
        </div>
        <p className="text-slate-600 leading-relaxed">
          Tạo và kiểm định đề bài tự động bám sát chương trình học.
        </p>
      </div>
    </aside>
  );
}
