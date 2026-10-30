import React from 'react';

const roleMap = {
  admin: { label: 'Quản trị viên', bg: 'bg-purple-100 text-purple-700 border-purple-200' },
  teacher: { label: 'Giáo viên', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
  student: { label: 'Học viên', bg: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  parent: { label: 'Phụ huynh', bg: 'bg-amber-100 text-amber-700 border-amber-200' }
};

export default function RoleBadge({ role }) {
  const meta = roleMap[role] || { label: role, bg: 'bg-gray-100 text-gray-700 border-gray-200' };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${meta.bg}`}>
      {meta.label}
    </span>
  );
}
