# InterviewAI – AI-Powered Smart Interview Preparation & Career Intelligence Platform

InterviewAI is an enterprise-grade, modern, full-stack AI-driven career intelligence and interview training platform. It equips engineering candidates and students with real-time AI mock interviews, automated resume ATS analysis, job description alignment matching, adaptive questioning, behavioral STAR analysis, and personalized learning roadmaps powered by Google Gemini AI.

---

## 🚀 Key Features

- **JWT Authentication & RBAC**: Secure sign up, login, refresh token lifecycle, password recovery, and role-based access control (`USER` and `ADMIN`).
- **Real-Time AI Mock Interviews**:
  - Technical, HR, Coding, Behavioral (STAR method), and Mixed interviews.
  - Adaptive questioning: AI dynamically adjusts question difficulty based on live performance.
  - Voice Mode: Text-to-Speech question prompts and Speech-to-Text response capture via Web Speech API.
  - Granular 6-dimensional scoring (Technical, Communication, Confidence, Completeness, Problem Solving, Relevance).
- **Company-Specific Interview Prep**: Practice inspired by real engineering patterns at Google, Amazon, Microsoft, Netflix, Meta, TCS, Infosys, and more.
- **AI Resume & ATS Intelligence**:
  - Extracts skills, experience, and educational background.
  - Computes ATS compatibility scores and highlights missing critical industry keywords.
  - Generates actionable bullet-point rewriting suggestions.
- **Job Description Matching**: Compares user resumes against target job postings to generate match percentages and skill gap breakdowns.
- **Interactive Coding Practice**: Algorithmic problem solver with code review (analyzing time/space complexity, edge cases, and code quality without running unsafe arbitrary code on the server).
- **MCQ Practice Engine**: Categorized practice across Java, Spring Boot, React, JavaScript, MongoDB, DBMS, SQL, DSA, and OOP with timer and detailed answer explanations.
- **Gamification & Analytics**:
  - XP points, level progressions (Beginner $\to$ Intermediate $\to$ Advanced $\to$ Interview Master).
  - Daily streaks, achievement badges, and optional public leaderboard with privacy controls.
  - Interactive Recharts visualizing performance over time, topic mastery, and weekly momentum.
- **Exportable PDF Reports**: Download comprehensive interview summary reports including strengths, weaknesses, and a 5-day personalized preparation roadmap.
- **Interactive OpenAPI / Swagger Documentation**: Full REST API explorer available at `/api/docs/swagger.json` and in the integrated API documentation viewer.

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS with dark/light mode
- **Routing**: React Router DOM
- **Charts**: Recharts
- **Icons**: Lucide React
- **Animations**: Motion
- **HTTP Client**: Axios & Fetch API
- **PDF Generation**: jsPDF

### Backend & Live Server
- **Engine**: Node.js & Express + TypeScript (container-ready dev/production server running on port 3000)
- **Spring Boot 3.2.4 (Java 21)**: Maven source structure in `backend/` with Spring Security, Spring Data MongoDB, Bean Validation, and SpringDoc OpenAPI 3.0.
- **Authentication**: JWT (Access Token + Refresh Token), BCrypt Password Hashing
- **Database**: MongoDB (and embedded high-performance document store)
- **AI Engine**: Google Gemini API (`gemini-3.8-flash`) via `@google/genai`

---

## 📁 Project Structure

```
InterviewAI/
├── backend/                         # Java 21 Spring Boot Backend
│   ├── pom.xml
│   └── src/
│       ├── main/
│       │   ├── java/com/interviewai/
│       │   │   ├── controller/
│       │   │   ├── model/
│       │   │   ├── repository/
│       │   │   ├── security/
│       │   │   └── InterviewAiApplication.java
│       │   └── resources/application.yml
├── server/                          # Full-Stack TypeScript Express Backend
│   ├── routes/                      # REST API Endpoints
│   │   ├── authRoutes.ts            # Auth & JWT management
│   │   ├── userRoutes.ts            # Candidate profile management
│   │   ├── resumeRoutes.ts          # Resume upload & ATS AI analysis
│   │   ├── jobDescRoutes.ts         # Job description matching
│   │   ├── interviewRoutes.ts       # Mock interview engine & adaptive loop
│   │   ├── aiRoutes.ts              # Gemini AI standalone endpoints
│   │   ├── dashboardRoutes.ts       # Stats & Recharts analytics
│   │   ├── mcqRoutes.ts             # MCQ category testing
│   │   ├── adminRoutes.ts           # Admin management
│   │   └── gamificationRoutes.ts    # Leaderboard & badges
│   ├── ai.ts                        # Gemini AI integration service
│   ├── auth.ts                      # JWT verification & RBAC middleware
│   ├── db.ts                        # Document database service & seeds
│   ├── swagger.ts                   # OpenAPI 3.0 specification
│   └── types.ts                     # TypeScript interfaces
├── src/                             # React Client Application
│   ├── components/                  # Reusable UI components & layouts
│   ├── pages/                       # Full SaaS views
│   ├── context/                     # Auth, Theme, and Notification contexts
│   ├── services/                    # API client layer
│   ├── types/                       # Frontend state models
│   ├── App.tsx                      # Root router and app shell
│   └── main.tsx                     # React DOM entry point
├── server.ts                        # Unified Full-Stack Server
├── metadata.json
└── package.json
```

---

## ⚙️ Environment Variables

Copy `.env.example` to `.env`:

```env
# Gemini API Key (managed via AI Studio Secrets)
GEMINI_API_KEY=""

# Server Configuration
PORT=3000
MONGODB_URI="mongodb://localhost:27017/interviewai"
JWT_SECRET="interviewai_super_secret_jwt_key_2025_prod_secure_random"
JWT_EXPIRATION="86400000"
REFRESH_TOKEN_EXPIRATION="604800000"

# SMTP Email
EMAIL_USERNAME="noreply@interviewai.com"
EMAIL_PASSWORD=""

# Frontend API URL
VITE_API_URL="/api"
```

---

## 🏃 Running the Application

### 1. Live Web Application (Vite + Express Full-Stack)
The development server powers both the React frontend and all backend REST APIs on port 3000:
```bash
# Install dependencies
npm install

# Start full-stack development server
npm run dev
```
Open your browser at `http://localhost:3000`.

### 2. Standalone Java Spring Boot Backend
```bash
cd backend
mvn clean install
mvn spring-boot:run
```
Swagger UI will be accessible at `http://localhost:8080/swagger-ui.html`.

---

## 👥 Demo Accounts

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@interviewai.com` | `Admin@12345` |
| **Candidate** | `alex@university.edu` | `Pass@12345` |

---

## 📜 REST APIs Summary

- `POST /api/auth/register` – Register new user
- `POST /api/auth/login` – Login & receive JWT tokens
- `GET /api/users/profile` – Fetch current user profile
- `POST /api/resume/upload` – Upload & analyze resume
- `POST /api/interviews/start` – Start an AI mock interview
- `POST /api/interviews/:id/answer` – Submit answer for real-time AI critique
- `POST /api/interviews/:id/complete` – Finalize session & generate roadmap
- `GET /api/dashboard/stats` – Dashboard stats & Recharts data
- `GET /api/mcq/questions` – Multiple choice technical questions
- `GET /api/admin/dashboard` – Admin platform telemetry
- `GET /api/docs/swagger.json` – OpenAPI 3.0 specification
