# College Timetable Management System

A full-stack web application for managing college classroom timetables across departments.

## Tech Stack

- **Frontend**: React 18 (Vite)
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Real-time**: Socket.io
- **PDF**: jsPDF + AutoTable

## Prerequisites

- **Node.js** v18+ — [Download](https://nodejs.org)
- **MongoDB** running locally on `mongodb://127.0.0.1:27017`
  - [Install MongoDB Community](https://www.mongodb.com/try/download/community)
  - Or use Docker: `docker run -d -p 27017:27017 --name mongo mongo:7`

## Setup & Run

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on **http://localhost:5173**

### 3. Open the app

Navigate to **http://localhost:5173** in your browser.

## Getting Started (First Time)

1. **Register an Admin** — Go to Register, select "Admin" role, create account
2. **Login as Admin** — Use your credentials
3. **Create Departments** — Go to Manage Departments, add departments with sections (e.g., CSE with sections A, B and subsections A1, A2, B1, B2)
4. **Create Classrooms** — Go to Manage Classrooms, add rooms (e.g., CR-101, CR-102)
5. **Register HOD/Faculty** — They can now register selecting their department
6. **HOD builds timetable** — Go to Timetable, select classroom, click empty cells to add entries
7. **Faculty views schedule** — Login as faculty to see personal schedule

## User Roles

| Role | Access |
|------|--------|
| **Admin** | Full access. Create classrooms, departments, manage users, override conflicts |
| **HOD** | Manage their department's timetable. Assign lectures/labs to their sections |
| **Faculty** | Read-only. View all timetables and personal schedule |

## Auth ID Format

- Admin: `ADM-XXXX`
- HOD: `HOD-<DEPT>-XXXX`
- Faculty: `FAC-<DEPT>-XXXX`

## Features

- ✅ Role-based authentication & authorization
- ✅ Grid-based timetable view (Mon-Fri, 9AM-5PM)
- ✅ Conflict detection (classroom, faculty, section)
- ✅ Lab support (2 consecutive time slots)
- ✅ Department color coding
- ✅ Real-time updates via WebSocket
- ✅ PDF export
- ✅ Responsive design
- ✅ Filter by classroom, department, faculty

## API Endpoints

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Admin
- `POST/PUT/DELETE /api/admin/classrooms/:id`
- `POST/PUT/DELETE /api/admin/departments/:id`
- `GET/DELETE /api/admin/users/:id`
- `POST/DELETE /api/admin/timetable/:id`

### HOD
- `GET /api/hod/conflicts`
- `POST/PUT/DELETE /api/hod/timetable/:id`

### Common (Authenticated)
- `GET /api/common/timetable`
- `GET /api/common/classrooms`
- `GET /api/common/departments`
- `GET /api/common/faculty`
- `GET /api/common/my-schedule`
- `GET /api/common/stats`
