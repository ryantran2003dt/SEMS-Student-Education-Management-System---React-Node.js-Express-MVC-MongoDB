const User = require('../models/User');
const { StudentProfile, TeacherProfile, ParentProfile, ParentStudentLink } = require('../models/Profiles');
const { Subject, Course, Curriculum, Lesson } = require('../models/Academic');
const { Class, ClassSession } = require('../models/Class');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const { Certificate } = require('../models/Certificate');

async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('[Seed] Database already contains records. Skipping seed.');
    return;
  }

  console.log('[Seed] Seeding database with initial users, courses, classes, assignments, and mock data...');

  // 1. Create Users
  const adminUser = await User.create({
    fullName: 'Trần Quản Trị',
    email: 'admin@sems.edu.vn',
    password: 'password123',
    role: 'admin',
    phone: '0901234567'
  });

  const teacherUser = await User.create({
    fullName: 'ThS. Nguyễn Văn Nam',
    email: 'teacher@sems.edu.vn',
    password: 'password123',
    role: 'teacher',
    phone: '0912345678'
  });

  const studentUser = await User.create({
    fullName: 'Lê Hoàng Long',
    email: 'student@sems.edu.vn',
    password: 'password123',
    role: 'student',
    phone: '0987654321'
  });

  const studentUser2 = await User.create({
    fullName: 'Nguyễn Thị Mai',
    email: 'mai.student@sems.edu.vn',
    password: 'password123',
    role: 'student',
    phone: '0987654322'
  });

  const parentUser = await User.create({
    fullName: 'Trần Thị Lan',
    email: 'parent@sems.edu.vn',
    password: 'password123',
    role: 'parent',
    phone: '0933445566'
  });

  // 2. Create Profiles
  await TeacherProfile.create({
    userId: teacherUser._id,
    teacherCode: 'GV001',
    specialization: 'Khoa học Máy tính & Công nghệ Phần mềm',
    degree: 'Thạc sĩ Khoa học Máy tính',
    biography: 'Hơn 8 năm kinh nghiệm giảng dạy lập trình fullstack và cố vấn dự án.'
  });

  await StudentProfile.create({
    userId: studentUser._id,
    studentCode: 'HV0001',
    dateOfBirth: new Date('2004-05-15'),
    gender: 'Nam',
    school: 'Đại học Quốc gia',
    target: 'Thành thạo lập trình Web Fullstack và áp dụng AI',
    notes: 'Học viên chăm chỉ, tiếp thu nhanh'
  });

  await StudentProfile.create({
    userId: studentUser2._id,
    studentCode: 'HV0002',
    dateOfBirth: new Date('2005-09-20'),
    gender: 'Nữ',
    school: 'Đại học Kinh tế',
    target: 'Ứng dụng Tin học và Tự động hóa vào công việc'
  });

  await ParentProfile.create({
    userId: parentUser._id,
    occupation: 'Kế toán trưởng',
    emergencyPhone: '0933445566',
    address: '123 Đường Nguyễn Huệ, Quận 1, TP.HCM'
  });

  await ParentStudentLink.create({
    parentUserId: parentUser._id,
    studentUserId: studentUser._id,
    relationship: 'Mẹ',
    status: 'verified'
  });

  // 3. Subjects & Courses
  const subjectWeb = await Subject.create({
    name: 'Lập trình Web & Ứng dụng Hiện đại',
    code: 'WEB-DEV',
    description: 'Chương trình phát triển ứng dụng Web toàn diện với React, Node.js, Express và MongoDB.',
    level: 'Trung cấp - Nâng cao'
  });

  const subjectOffice = await Subject.create({
    name: 'Tin học Văn phòng Quản trị Dữ liệu',
    code: 'OFFICE-PRO',
    description: 'Ứng dụng Excel, Power Query, phân tích và tự động hóa xử lý bảng tính.',
    level: 'Cơ bản - Nâng cao'
  });

  const courseMern = await Course.create({
    subjectId: subjectWeb._id,
    name: 'Lập trình Fullstack MERN & Kiến trúc MVC',
    code: 'FS-MERN-01',
    targetAudience: 'Sinh viên, người đi làm muốn làm chủ phát triển Web hiện đại',
    objective: 'Nắm vững MVC, RESTful API, React Hooks, Mongoose và tích hợp AI.',
    durationHours: 48,
    expectedSessions: 12
  });

  const curriculum = await Curriculum.create({
    courseId: courseMern._id,
    version: '1.0',
    learningOutcomes: [
      'Xây dựng RESTful API chuẩn mực theo mô hình MVC + Service Layer',
      'Thiết kế Schemas và tối ưu hóa truy vấn MongoDB với Mongoose',
      'Triển khai xác thực bảo mật JWT, RBAC và middleware an toàn',
      'Xây dựng giao diện Single Page Application với React và Tailwind'
    ],
    topics: [
      'Kiến trúc MVC và Thiết kế Cơ sở Dữ liệu',
      'REST API & Tầng Dịch vụ (Service Layer)',
      'Xác thực JWT & Phân quyền RBAC',
      'Frontend ReactJS & Tích hợp Dịch vụ AI'
    ],
    isCurrent: true
  });

  // Lessons
  const lesson1 = await Lesson.create({
    courseId: courseMern._id,
    curriculumId: curriculum._id,
    sessionNumber: 1,
    title: 'Tổng quan Kiến trúc MVC và Cấu trúc Hệ thống',
    topic: 'Kiến trúc MVC và Thiết kế Cơ sở Dữ liệu',
    objectives: [
      'Hiểu rõ sự phân tách trách nhiệm giữa Model, View, Controller và Service Layer',
      'Thiết kế sơ đồ quan hệ thực thể cho hệ thống giáo dục SEMS'
    ]
  });

  const lesson2 = await Lesson.create({
    courseId: courseMern._id,
    curriculumId: curriculum._id,
    sessionNumber: 2,
    title: 'Xây dựng REST API & Middleware Bảo mật với Express',
    topic: 'REST API & Tầng Dịch vụ (Service Layer)',
    objectives: [
      'Triển khai JWT Authentication và RBAC Middleware',
      'Xử lý lỗi tập trung và cấu hình bảo mật Helmet / Rate Limit'
    ]
  });

  const lesson3 = await Lesson.create({
    courseId: courseMern._id,
    curriculumId: curriculum._id,
    sessionNumber: 3,
    title: 'Quy trình AI Tạo & Kiểm định Bài tập Giáo dục',
    topic: 'Tích hợp Dịch vụ AI và Kiểm định Chất lượng',
    objectives: [
      'Nắm vững quy trình Human-in-the-loop: AI sinh bản nháp -> Giáo viên duyệt',
      'Đánh giá bài tập theo ma trận năng lực và chuẩn đầu ra bài học'
    ]
  });

  // 4. Classes & Sessions
  const classWeb = await Class.create({
    code: 'WEB2026-K1',
    name: 'Lớp Web Fullstack MERN K01',
    courseId: courseMern._id,
    teacherId: teacherUser._id,
    studentIds: [studentUser._id, studentUser2._id],
    scheduleDescription: 'Thứ 2 - Thứ 4 (18:30 - 20:30)',
    room: 'Phòng Lab 02 - Tầng 3',
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // started 7 days ago
    status: 'ongoing'
  });

  // Sessions
  const session1 = await ClassSession.create({
    classId: classWeb._id,
    lessonId: lesson1._id,
    sessionNumber: 1,
    title: 'Buổi 1: Tổng quan Kiến trúc MVC và Cấu trúc Hệ thống',
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    startTime: '18:30',
    endTime: '20:30',
    room: 'Phòng Lab 02',
    status: 'completed'
  });

  const session2 = await ClassSession.create({
    classId: classWeb._id,
    lessonId: lesson2._id,
    sessionNumber: 2,
    title: 'Buổi 2: Xây dựng REST API & Middleware Bảo mật với Express',
    date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
    startTime: '18:30',
    endTime: '20:30',
    room: 'Phòng Lab 02',
    status: 'completed'
  });

  const session3 = await ClassSession.create({
    classId: classWeb._id,
    lessonId: lesson3._id,
    sessionNumber: 3,
    title: 'Buổi 3: Quy trình AI Tạo & Kiểm định Bài tập Giáo dục',
    date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // in 3 days
    startTime: '18:30',
    endTime: '20:30',
    room: 'Phòng Lab 02',
    status: 'scheduled'
  });

  // 5. Attendance
  await Attendance.create({
    classId: classWeb._id,
    sessionId: session1._id,
    studentId: studentUser._id,
    status: 'present',
    notes: 'Đi đúng giờ, tham gia phát biểu tích cực',
    markedBy: teacherUser._id
  });

  await Attendance.create({
    classId: classWeb._id,
    sessionId: session1._id,
    studentId: studentUser2._id,
    status: 'present',
    notes: 'Có mặt đầy đủ',
    markedBy: teacherUser._id
  });

  await Attendance.create({
    classId: classWeb._id,
    sessionId: session2._id,
    studentId: studentUser._id,
    status: 'late',
    notes: 'Đến muộn 15 phút có báo trước lý do kẹt xe',
    markedBy: teacherUser._id
  });

  await Attendance.create({
    classId: classWeb._id,
    sessionId: session2._id,
    studentId: studentUser2._id,
    status: 'present',
    notes: 'Có mặt',
    markedBy: teacherUser._id
  });

  // 6. Assignments
  // Assignment 1: Published & Graded
  const assignment1 = await Assignment.create({
    title: 'Bài tập 01: Thiết kế Mongoose Model & Triển khai MVC Pattern',
    description: 'Học viên hoàn thành các câu hỏi trắc nghiệm và câu hỏi tự luận về cấu trúc MVC và thiết kế database schema cho hệ thống SEMS.',
    classId: classWeb._id,
    lessonId: lesson1._id,
    teacherId: teacherUser._id,
    difficulty: 'Trung bình',
    topic: 'Kiến trúc MVC và Thiết kế Cơ sở Dữ liệu',
    curriculumAlignment: 'Mục tiêu: Hiểu rõ nguyên lý MVC, Model schema và tách biệt Controller / Service',
    source: 'manual',
    status: 'published',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    maxScore: 100,
    questions: [
      {
        questionText: 'Trong mô hình MVC kết hợp Service Layer, tầng nào chịu trách nhiệm chính về tính toán quy tắc nghiệp vụ (Business Logic)?',
        type: 'multiple_choice',
        options: [
          'A. Controller',
          'B. Service Layer',
          'C. Route',
          'D. Model'
        ],
        correctAnswer: 'B. Service Layer',
        points: 30,
        explanation: 'Service Layer là nơi tập trung toàn bộ logic nghiệp vụ, giúp Controller mỏng và dễ kiểm thử.'
      },
      {
        questionText: 'Tại sao không nên lưu mật khẩu dạng văn bản rõ (plain text) trong MongoDB?',
        type: 'multiple_choice',
        options: [
          'A. Vì làm tăng kích thước document vượt quá 16MB',
          'B. Vì nguy cơ rò rỉ thông tin cá nhân và vi phạm chuẩn bảo mật dữ liệu',
          'C. Vì MongoDB không hỗ trợ tìm kiếm chuỗi ký tự mật khẩu',
          'D. Vì tốc độ truy vấn sẽ bị chậm lại 50%'
        ],
        correctAnswer: 'B. Vì nguy cơ rò rỉ thông tin cá nhân và vi phạm chuẩn bảo mật dữ liệu',
        points: 30,
        explanation: 'Bảo mật là tiêu chí sống còn, luôn phải băm mật khẩu bằng thuật toán an toàn như bcrypt.'
      },
      {
        questionText: 'Trình bày ngắn gọn lợi ích của việc kiểm định bài tập do AI tạo trước khi giáo viên xuất bản cho học sinh.',
        type: 'essay',
        options: [],
        correctAnswer: 'Đảm bảo tính chính xác khoa học, phù hợp mục tiêu bài học và tránh lỗi ảo giác AI.',
        points: 40,
        explanation: 'Giáo viên giữ vai trò chuyên môn quyết định cuối cùng (Human-in-the-loop).'
      }
    ]
  });

  // Student 1 submitted and graded
  await Submission.create({
    assignmentId: assignment1._id,
    classId: classWeb._id,
    studentId: studentUser._id,
    answers: [
      {
        questionIndex: 0,
        studentAnswer: 'B. Service Layer',
        selectedOption: 1,
        pointsAwarded: 30,
        teacherNote: 'Chính xác!'
      },
      {
        questionIndex: 1,
        studentAnswer: 'B. Vì nguy cơ rò rỉ thông tin cá nhân và vi phạm chuẩn bảo mật dữ liệu',
        selectedOption: 1,
        pointsAwarded: 30,
        teacherNote: 'Hiểu đúng nguyên lý bảo mật.'
      },
      {
        questionIndex: 2,
        studentAnswer: 'Việc kiểm định trước giúp giáo viên rà soát lỗi nội dung, đảm bảo câu hỏi sát với bài giảng trên lớp và phù hợp với năng lực học sinh, tránh việc AI sinh câu hỏi quá trừu tượng hoặc sai lệch kiến thức.',
        pointsAwarded: 35,
        teacherNote: 'Câu trả lời rất đầy đủ, nắm bắt tốt tinh thần Human-in-the-loop.'
      }
    ],
    status: 'graded',
    score: 95,
    maxScore: 100,
    feedback: 'Bài làm xuất sắc! Em nắm rất vững kiến trúc phần mềm và nguyên lý bảo mật.',
    gradedBy: teacherUser._id,
    gradedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  });

  // Assignment 2: AI Generated Draft in pending_review
  await Assignment.create({
    title: 'Bài tập AI Nháp: Xây dựng REST API & Middleware Bảo mật',
    description: 'Bản nháp do AI sinh tự động dựa trên giáo trình Buổi 2. Cần giáo viên kiểm tra, xem kết quả kiểm định chất lượng và duyệt xuất bản.',
    classId: classWeb._id,
    lessonId: lesson2._id,
    teacherId: teacherUser._id,
    difficulty: 'Trung bình',
    topic: 'REST API & Tầng Dịch vụ (Service Layer)',
    curriculumAlignment: 'Chuẩn kiến thức & kỹ năng: JWT Auth, RBAC, Rate Limiting',
    source: 'ai',
    status: 'pending_review',
    dueDate: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000),
    maxScore: 100,
    questions: [
      {
        questionText: 'Mã trạng thái HTTP (Status Code) nào sau đây là chuẩn mực nhất khi người dùng chưa đăng nhập nhưng cố tình truy cập tài nguyên bảo mật?',
        type: 'multiple_choice',
        options: [
          'A. 200 OK',
          'B. 401 Unauthorized',
          'C. 404 Not Found',
          'D. 500 Internal Server Error'
        ],
        correctAnswer: 'B. 401 Unauthorized',
        points: 25,
        explanation: 'HTTP 401 biểu thị yêu cầu chưa được xác thực danh tính.'
      },
      {
        questionText: 'Thư viện nào sau đây thường được sử dụng trong Express để thiết lập các tiêu đề HTTP Headers bảo mật nhằm phòng chống tấn công XSS và clickjacking?',
        type: 'multiple_choice',
        options: [
          'A. Helmet',
          'B. Lodash',
          'C. Moment.js',
          'D. Chalk'
        ],
        correctAnswer: 'A. Helmet',
        points: 25,
        explanation: 'Helmet tự động gán các security headers an toàn.'
      },
      {
        questionText: 'Giải thích sự khác biệt cơ bản giữa xác thực (Authentication) và phân quyền (Authorization) trong hệ thống quản lý học viên.',
        type: 'essay',
        options: [],
        correctAnswer: 'Authentication xác minh danh tính người dùng (Bạn là ai?), Authorization xác định quyền hạn người dùng (Bạn được phép làm gì?).',
        points: 50,
        explanation: 'Đánh giá khả năng phân biệt 2 trụ cột an toàn thông tin.'
      }
    ],
    aiMetadata: {
      modelUsed: 'SEMS Curriculum AI Engine v2.4',
      generatedPrompt: 'Generate assessment for REST API & Middleware at Medium level',
      validationScore: 94,
      validationReport: {
        alignmentValid: true,
        difficultyAppropriate: true,
        rubricComplete: true,
        suggestions: [
          'Bản nháp đã bám sát 100% mục tiêu buổi học số 2.',
          'Các câu hỏi phân loại được nhận biết và thông hiểu.',
          'Giáo viên có thể duyệt ngay hoặc bổ sung thời gian làm bài trước khi xuất bản.'
        ]
      },
      verifiedByTeacher: false
    }
  });

  // 7. Certificate for Student 1
  await Certificate.create({
    certificateCode: 'SEMS-CERT-2026-00001',
    studentId: studentUser._id,
    courseId: courseMern._id,
    classId: classWeb._id,
    issueDate: new Date(),
    averageScore: 95,
    attendanceRate: 90,
    status: 'valid',
    approvedBy: adminUser._id
  });

  console.log('[Seed] Database successfully populated with initial data!');
  console.log('--- DEMO ACCOUNTS READY ---');
  console.log('1. Admin:   admin@sems.edu.vn   / password123');
  console.log('2. Teacher: teacher@sems.edu.vn / password123');
  console.log('3. Student: student@sems.edu.vn / password123');
  console.log('4. Parent:  parent@sems.edu.vn  / password123');
}

module.exports = seedDatabase;
