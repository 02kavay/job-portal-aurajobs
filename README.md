# AuraJobs - Premium AI-Powered Job Portal

AuraJobs is a high-performance, modern job search and recruiting platform built using Next.js (frontend) and Express.js (backend) with Prisma ORM. It features local AI-driven candidate ranking, automated resume text-parsing, and a premium glassmorphic dark design system.

---

## 🚀 Running the Project Locally

### 1. Start the Backend API
Navigate to the `backend/` directory, install packages, and boot the server:
```bash
cd backend
npm install
npm run dev
```
* The backend runs at: **`http://localhost:5000`**
* Health Check: **`http://localhost:5000/health`**
* SQLite Database is used by default, seeded with sample Seekers, Recruiters, Admins, and Job listings.

### 2. Start the Frontend
In a new terminal window, navigate to the `frontend/` directory and boot the Next.js server:
```bash
cd frontend
npm install
npm run dev
```
* The website runs at: **`http://localhost:3000`**

---

## 🔑 Demo / Testing Credentials
Open **`http://localhost:3000/login`** and use the click-to-autofill buttons, or log in manually with:

* **Admin Account**:
  * Email: `admin@example.com`
  * Password: `password123`
* **Recruiter Account**:
  * Email: `recruiter@example.com`
  * Password: `password123`
* **Job Seeker Account**:
  * Email: `seeker@example.com`
  * Password: `password123`

---

## 🛠️ Key Features
1. **Moderator Admin Dashboard**: Complete telemetry counters, user directories, and cascade-deletion controls to remove spam listings or user accounts.
2. **AI Resume Text Extractor**: Seekers can upload PDF/TXT resumes; the system automatically parses names, titles, technical skills, education, and years of experience.
3. **Smart Matching & Recommendation**: Local cosine-similarity algorithm ranks applicants for recruiters, and recommends matching jobs for seekers based on skill overlays and experience weights.
