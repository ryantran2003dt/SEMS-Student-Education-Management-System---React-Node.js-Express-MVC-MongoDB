const Attendance = require('../models/Attendance');
const { ClassSession, Class } = require('../models/Class');
const { ParentStudentLink } = require('../models/Profiles');
const notificationService = require('./notificationService');

class AttendanceService {
  async recordAttendance(sessionId, attendanceRecords, requestingUser) {
    const session = await ClassSession.findById(sessionId).populate('classId');
    if (!session) throw new Error('Không tìm thấy buổi học');

    if (requestingUser && requestingUser.role === 'teacher') {
      const classTeacherId = session.classId?.teacherId?.toString();
      const userId = (requestingUser.id || requestingUser._id).toString();
      if (classTeacherId !== userId) {
        throw new Error('Bạn không có quyền điểm danh lớp học của giáo viên khác');
      }
    }

    const markedByUserId = requestingUser.id || requestingUser._id;

    const bulkOps = attendanceRecords.map(item => ({
      updateOne: {
        filter: { sessionId, studentId: item.studentId },
        update: {
          $set: {
            classId: session.classId?._id || session.classId,
            status: item.status,
            notes: item.notes || '',
            markedBy: markedByUserId,
            markedAt: new Date()
          }
        },
        upsert: true
      }
    }));

    if (bulkOps.length > 0) {
      await Attendance.bulkWrite(bulkOps);
    }

    // Mark session as completed
    session.status = 'completed';
    await session.save();

    // Notify parents of students who are absent or late
    try {
      const nonPresentRecords = attendanceRecords.filter(r => r.status !== 'present');
      for (const rec of nonPresentRecords) {
        const parentLinks = await ParentStudentLink.find({ studentUserId: rec.studentId, status: 'verified' });
        const statusText = rec.status === 'unexcused' ? 'vắng không phép' : rec.status === 'late' ? 'đi trễ' : 'vắng có phép';
        for (const link of parentLinks) {
          await notificationService.createNotification({
            recipientId: link.parentUserId,
            title: 'Cập nhật điểm danh của con',
            message: `Buổi học "${session.title}" (Lớp ${session.classId?.name || ''}): con được ghi nhận ${statusText}. ${rec.notes ? `Ghi chú: ${rec.notes}` : ''}`,
            type: 'attendance',
            link: '/parent/attendance'
          });
        }
      }
    } catch (notifErr) {
      console.warn('[Notification Error]', notifErr.message);
    }

    return await this.getSessionAttendance(sessionId, requestingUser);
  }

  async getSessionAttendance(sessionId, requestingUser = null) {
    const session = await ClassSession.findById(sessionId).populate('classId');
    if (!session) throw new Error('Không tìm thấy buổi học');

    if (requestingUser && requestingUser.role === 'teacher') {
      const classTeacherId = session.classId?.teacherId?.toString();
      const userId = (requestingUser.id || requestingUser._id).toString();
      if (classTeacherId !== userId) {
        throw new Error('Bạn không có quyền xem điểm danh của lớp khác');
      }
    }

    return await Attendance.find({ sessionId })
      .populate('studentId', 'fullName email phone avatar')
      .populate('markedBy', 'fullName');
  }

  async getStudentAttendance(studentId, classId = null) {
    const query = { studentId };
    if (classId) query.classId = classId;

    const records = await Attendance.find(query)
      .populate('sessionId')
      .populate('classId', 'name code')
      .sort({ createdAt: -1 });

    const total = records.length;
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const excused = records.filter(r => r.status === 'excused').length;
    const unexcused = records.filter(r => r.status === 'unexcused').length;

    // Rate: present (100%), late (80%), excused (50%), unexcused (0%)
    const attendanceScore = total > 0
      ? Math.round(((present * 1 + late * 0.8 + excused * 0.5) / total) * 100)
      : 100;

    return {
      records,
      stats: {
        total,
        present,
        late,
        excused,
        unexcused,
        attendanceRate: attendanceScore
      }
    };
  }

  async getClassAttendanceStats(classId) {
    const records = await Attendance.find({ classId });
    const total = records.length;
    if (total === 0) {
      return { total: 0, attendanceRate: 100, present: 0, late: 0, absent: 0 };
    }
    const present = records.filter(r => r.status === 'present').length;
    const late = records.filter(r => r.status === 'late').length;
    const absent = records.filter(r => r.status === 'unexcused' || r.status === 'excused').length;

    return {
      total,
      present,
      late,
      absent,
      attendanceRate: Math.round(((present + late * 0.8) / total) * 100)
    };
  }
}

module.exports = new AttendanceService();
