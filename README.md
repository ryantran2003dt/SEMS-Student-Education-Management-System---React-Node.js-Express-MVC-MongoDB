# SEMS - Hệ Thống Quản Lý Giáo Dục & Đào Tạo (Student Education Management System)

> Hệ thống website quản lý toàn diện hoạt động đào tạo tại trung tâm giáo dục, xây dựng theo mô hình **MVC + Service Layer** với **ReactJS, Node.js/Express và MongoDB**, tích hợp **AI Assignment Studio (Human-in-the-loop)** hỗ trợ giảng viên tạo và kiểm định bài tập bám sát chuẩn đầu ra.

---

## 1. Kiến Trúc Hệ Thống (MVC + Service Layer)

Dự án được cấu trúc theo chuẩn **Modular Monolith** kết hợp **MVC** và **Service Layer**:

```
d:\WebApp TinHocDeHieu\
├── client/                     # Frontend ReactJS + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/         # Navbar, Sidebar, StatCard, Modal, RoleBadge
│   │   ├── layouts/            # AdminLayout, TeacherLayout, StudentLayout, ParentLayout
│   │   ├── pages/
│   │   │   ├── auth/           # Login (kèm 1-click Demo Account Switcher)
│   │   │   ├── admin/          # Admin Dashboard, Users, Academic, Classes, Reports
│   │   │   ├── teacher/        # Teacher Dashboard, Classes, AttendanceSheet, AssignmentStudio, Grading
│   │   │   ├── student/        # Student Dashboard, Classes, Assignments, TakeAssignment, Progress, Certs
│   │   │   └── parent/         # Parent Dashboard, Child Attendance, Grades & Teacher Feedback
│   │   ├── services/           # Axios instance, Interceptors, JWT Token handling
│   │   ├── stores/             # Zustand Auth store
│   │   └── routes/             # AppRoutes (Bảo vệ phân quyền theo vai trò)
│   └── package.json
│
├── server/                     # Backend Node.js / Express.js (MVC Pattern)
│   ├── src/
│   │   ├── config/             # database.js (Hỗ trợ MongoDB hoặc In-Memory Fallback), env.js
│   │   ├── models/             # Mongoose Schemas (User, Profiles, Academic, Class, Attendance, Assignment, Submission, Certificate)
│   │   ├── controllers/        # Controllers mỏng, nhận request & gọi service (Auth, User, Academic, Class, Attendance, Assignment, AI, Analytics)
│   │   ├── services/           # Business Logic Layer (Tính điểm, Kiểm tra chứng nhận, Sinh đề & Kiểm định AI, Phân tích tiến độ)
│   │   ├── routes/             # RESTful API Endpoints
│   │   ├── middlewares/        # JWT Authentication, RBAC Role Checks, Error Handler, Multer File Upload
│   │   ├── seed/               # Tự động khởi tạo dữ liệu mẫu phong phú
│   │   ├── app.js              # Cấu hình Express, Helmet, Cors, Rate Limiter
│   │   └── server.js           # Khởi động HTTP Server & DB Connection
│   ├── uploads/                # Lưu trữ tệp bài tập / tài liệu đính kèm
│   ├── .env                    # Biến môi trường
│   └── package.json
│
└── package.json                # Root scripts điều phối
```

---

## 2. Tài Khoản Thử Nghiệm Trực Quan (4 Vai Trò)

Hệ thống đã được nạp sẵn dữ liệu mẫu thực tế. Tại màn hình Đăng Nhập, bạn có thể **nhấn trực tiếp vào 1 trong 4 nút Demo** hoặc đăng nhập bằng thông tin dưới đây:

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Nhiệm vụ chính |
| :--- | :--- | :--- | :--- |
| **Quản trị viên (Admin)** | `admin@sems.edu.vn` | `password123` | Toàn quyền quản lý tài khoản, môn/khóa học, mở lớp, phân công GV, báo cáo xếp hạng & cấp chứng nhận. |
| **Giáo viên (Teacher)** | `teacher@sems.edu.vn` | `password123` | Điểm danh từng buổi học (Có mặt, Đi trễ, Vắng có phép/không phép); Dùng **AI Assignment Studio** tạo nháp đề bài, kiểm định và duyệt; Chấm điểm & nhận xét. |
| **Học viên (Student)** | `student@sems.edu.vn` | `password123` | Xem lịch học các buổi, làm bài tập trắc nghiệm/tự luận, xem điểm số, nhận xét của GV và chứng nhận tốt nghiệp. |
| **Phụ huynh (Parent)** | `parent@sems.edu.vn` | `password123` | Sổ liên lạc điện tử: theo dõi chuyên cần của con, xem điểm số từng bài nộp, nhận xét GV và khuyến nghị phối hợp tại nhà. |

---

## 3. Điểm Nổi Bật: AI Assignment Studio (Human-in-the-loop)

1. **Sinh Đề Bằng AI:** Giáo viên chọn lớp, buổi học, chủ đề, mức độ khó (Dễ / Trung bình / Khó) và số lượng câu hỏi.
2. **Khớp Chuẩn Đầu Ra:** Hệ thống lấy đúng chuẩn kiến thức bài học đã được phê duyệt trong chương trình để sinh câu hỏi trắc nghiệm kèm đáp án và câu tự luận.
3. **Kiểm Định Tiêu Chí:** Chấm điểm độ phù hợp của đề bài (0 - 100 điểm), kiểm tra phân bố độ khó và barem chấm điểm.
4. **Giáo Viên Duyệt (Human-in-the-loop):** Đề bài luôn ở trạng thái `pending_review` (chờ duyệt). Giáo viên có toàn quyền kiểm tra, chỉnh sửa, bấm **Phê Duyệt** và **Xuất Bản** cho học viên. Học viên chỉ nhìn thấy bài tập khi giáo viên đã xuất bản.
5. **Tin Nhắn Nội Bộ:** Giáo viên, học viên và phụ huynh trao đổi theo quan hệ lớp học đã xác minh; quản lý có thể nhắn với mọi tài khoản. Hỗ trợ tin nhắn chữ, sticker, ảnh và tệp học tập tối đa 20 MB; tin nhắn tự cập nhật khi hộp thư đang mở, còn tệp đính kèm chỉ người trong cuộc trò chuyện mới truy cập được.

---

## 4. Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### Bước 1: Khởi động Backend (Server)

Chỉ quản trị viên cấu hình Gemini trên máy chủ. Giáo viên và học viên không cần nhập hoặc lưu API key. Để dùng Google Gemini, quản trị viên tạo file `server/.env.local` (file này không được Git theo dõi) và thêm:

```env
GEMINI_API_KEY=your_gemini_api_key
```

Sau đó khởi động lại backend để nạp cấu hình. Không ghi key trực tiếp vào mã nguồn hoặc commit key lên Git.
Nếu Gemini tạm quá tải (HTTP 503), backend chuyển sang các model Flash dự phòng đang được hỗ trợ.

```powershell
cd server
npm start
```
*Backend sẽ lắng nghe tại `http://localhost:5000` (nếu máy chưa bật MongoDB service, hệ thống tự động kích hoạt in-memory database fallback để bạn chạy thử nghiệm ngay lập tức).*

### Bước 2: Khởi động Frontend (Client)

Mở một cửa sổ dòng lệnh thứ hai:

```powershell
cd client
npm run dev
```
*Frontend sẽ chạy tại `http://localhost:5173` và tự động proxy các request `/api` sang server port 5000.*

---

## 5. Tiêu Chuẩn Bảo Mật & Kỹ Thuật

- **Bảo mật:** Mật khẩu được mã hóa an toàn bằng `bcryptjs` với salt 10 rounds, xác thực phiên bằng `jsonwebtoken` (JWT), bảo vệ API bằng `helmet`, `cors`, và `express-rate-limit`.
- **Kiểm soát truy cập cấp đối tượng (Object-Level Authorization):** Giáo viên chỉ thao tác trên lớp được phân công; học viên chỉ xem dữ liệu học tập của chính mình; phụ huynh chỉ xem con đã được liên kết xác minh.
