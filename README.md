# 🎯 HirePath — Placement Readiness & Recruitment Platform

### From Preparation to Placement

**HirePath** is a full-stack MERN application designed to help students evaluate their technical readiness, identify skill gaps, follow personalized preparation roadmaps, track their improvement, and explore campus recruitment opportunities.

Unlike conventional placement portals that primarily display recruitment drives and academic eligibility, HirePath integrates **technical assessments, company-specific skill-gap analysis, personalized preparation plans, and performance analytics** into a unified platform.

---

## 🌐 Live Application

**Live Website:** https://hirepath-frontend.vercel.app

**GitHub Repository:** https://github.com/sreenidhithota12-dotcom/HirePath-MERN

---

## ✨ Key Features

### 🎓 Student Portal

#### 1. Student Authentication and Profile Management
- Secure student registration and login.
- JWT-based authentication and bcrypt password hashing.
- Personalized dashboard containing academic details.
- Profile management for branch, CGPA, backlogs, and technical skills.
- Role-based access to student-specific functionality.

#### 2. Technical Readiness Assessment
- Interactive MCQ-based technical assessments.
- Covers five fundamental computer science subjects:
  - Data Structures and Algorithms (DSA)
  - Object-Oriented Programming (OOP)
  - Database Management Systems (DBMS)
  - Operating Systems (OS)
  - Computer Networks (CN)
- Server-side answer validation and automatic scoring.
- Topic-wise performance evaluation.
- Assessment results and attempt history stored in MongoDB.

#### 3. Company-Specific Skill Gap Analysis

HirePath compares the student's latest technical assessment results with proficiency targets configured by faculty for individual companies.

**Skill Gap Formula:**

`Skill Gap = max(0, Company Target Score − Student Score)`

For example:

| Subject | Student Score | Company Target | Skill Gap |
|---|---:|---:|---:|
| DSA | 50% | 80% | 30 points |
| OOP | 75% | 70% | 0 points |
| DBMS | 60% | 75% | 15 points |

The system identifies subjects requiring improvement, tracks achieved targets, and calculates the average measured gap for each company.

Academic eligibility and technical preparation readiness are evaluated separately.

#### 4. Personalized Preparation Roadmap
- Automatically generates company-specific preparation plans.
- Prioritizes technical subjects according to calculated skill gaps.
- Provides predefined topic-specific learning and practice tasks.
- Allows students to mark tasks as completed.
- Saves preparation progress in MongoDB.
- Displays task completion percentages.
- Supports reassessment to evaluate further improvement.

**Priority Classification:**

| Skill Gap | Priority |
|---|---|
| 25 points or more | High |
| 1–24 points | Medium |
| 0 points | Target Achieved |
| No assessment available | Assessment Needed |

#### 5. Performance Analytics
- Latest technical assessment score.
- Average performance across saved attempts.
- Assessment history and performance trends.
- Topic-wise score visualization.
- Identification of strongest and lowest-scoring subjects.
- Comparison between earlier and recent attempts.

#### 6. Placement Opportunities
- Browse placement drives published by faculty.
- Academic eligibility checking using branch, CGPA, active backlogs, and application deadline.
- Interactive company cards that open detailed job-information popups.
- Complete job descriptions and technical proficiency requirements.
- Clear explanations for academic ineligibility.
- Links to company careers websites when available.

### 👨‍🏫 Faculty Portal

- Secure faculty authentication.
- Dedicated faculty dashboard.
- Publish new placement opportunities.
- View and manage company records.
- Edit and delete placement drives created by the authenticated faculty member.
- Configure eligible branches, minimum CGPA, maximum backlogs, deadlines, and careers URLs.
- Define company-specific technical assessment targets.
- Make updated placement opportunities accessible to students.

---

## 🛠️ Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite, JavaScript, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JSON Web Tokens (JWT), bcryptjs |
| API Communication | REST APIs, Fetch API |
| Deployment | Vercel |
| Version Control | Git, GitHub |

---

## 🏗️ System Architecture

```text
                  HIREPATH
                      |
               React Frontend
                      |
                 REST APIs
                      |
              Express Backend
                      |
            JWT Authentication
                      |
         +------------+------------+
         |                         |
    Student Module            Faculty Module
         |                         |
    Assessments               Company Management
    Skill Gap Analysis        Technical Requirements
    Preparation Roadmap       Recruitment Criteria
    Performance Analytics
    Placement Opportunities
         |                         |
         +------------+------------+
                      |
                   Mongoose
                      |
                 MongoDB Atlas
```

---

## 🔄 Core Workflow

```text
          Faculty Publishes Company
                     |
          Defines Technical Targets
                     |
           Student Takes Assessment
                     |
          Backend Evaluates Answers
                     |
           Scores Saved in MongoDB
                     |
       Company-Specific Skill Analysis
                     |
         Weak Technical Topics Found
                     |
      Personalized Roadmap Generated
                     |
       Student Completes Practice Tasks
                     |
          Student Retakes Assessment
                     |
           Performance Analytics
```

The recommendation system uses **rule-based score comparison and task prioritization**, rather than relying on externally generated AI responses.

---

## 🗄️ Database Design

HirePath uses MongoDB Atlas with Mongoose schemas.

| Collection | Description |
|---|---|
| Students | Student profiles, credentials, academic details, and skills |
| Faculties | Authorized faculty account information |
| Companies | Recruitment drives, eligibility criteria, and technical requirements |
| Assessments | Student assessment attempts and topic-wise scores |
| RoadmapProgress | Company-specific preparation task completion records |

### Relationships

- One student can complete multiple assessments.
- One faculty member can publish multiple placement drives.
- Each company may have different technical proficiency requirements.
- Each student's preparation progress is stored separately for each company.

---

## 🔌 REST API Endpoints

### Student Authentication and Profile

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register student |
| POST | `/api/auth/login` | Student login |
| GET | `/api/me` | Retrieve student profile |
| PUT | `/api/me` | Update student profile |
| DELETE | `/api/me` | Delete student account |
| GET | `/api/me/drives` | Retrieve placement drives and eligibility |

### Faculty Management

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/faculty/login` | Faculty login |
| GET | `/api/faculty/me` | Retrieve faculty profile |
| GET | `/api/faculty/companies` | Retrieve company records |
| POST | `/api/faculty/companies` | Publish placement drive |
| PUT | `/api/faculty/companies/:id` | Update placement drive |
| DELETE | `/api/faculty/companies/:id` | Delete placement drive |

### Technical Assessment

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/assessments/questions` | Fetch technical MCQs |
| POST | `/api/assessments/submit` | Submit and evaluate answers |
| GET | `/api/assessments/history` | Retrieve assessment history |

### Skill Analysis and Preparation

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/skill-analysis` | Calculate company-specific skill gaps |
| GET | `/api/roadmap/:companyId` | Generate preparation roadmap |
| PATCH | `/api/roadmap/:companyId/progress` | Update task completion |

Student-specific endpoints use JWT authentication. Faculty management APIs are protected by faculty authorization.

---

## 📁 Project Structure

```text
HirePath-MERN/
|
├── backend/
│   ├── models/
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   ├── Company.js
│   │   ├── Assessment.js
│   │   └── RoadmapProgress.js
│   |
│   ├── routes/
│   │   ├── assessment.js
│   │   ├── skillAnalysis.js
│   │   └── roadmap.js
│   |
│   ├── server.js
│   └── package.json
|
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Assessment.css
│   │   └── main.jsx
│   |
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
|
├── .gitignore
└── README.md
```

---

## 💻 Installation and Setup

### Prerequisites

- Node.js and npm
- Git
- MongoDB Atlas account or compatible MongoDB database

### 1. Clone Repository

```bash
git clone https://github.com/sreenidhithota12-dotcom/HirePath-MERN.git
cd HirePath-MERN
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` folder:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret
PORT=5000
```

Start the backend:

```bash
npm start
```

### 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
```

For a standard local setup, create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Alternatively, if using the Vite development proxy configured to forward `/api` requests to the backend, leave `VITE_API_URL` empty.

Start the frontend:

```bash
npm run dev
```

Open the address displayed by Vite.

Faculty accounts are provisioned separately by the application administrator; public faculty registration is not enabled.

---

## 🔐 Security Implementation

- bcrypt-based password hashing.
- JWT token verification.
- Student and faculty role separation.
- Protected student-specific APIs.
- Backend-based assessment grading.
- Faculty ownership verification for modifying placement drives.
- Request validation for company records and assessment submissions.
- Configured CORS origins.
- Environment variables for sensitive configuration.

---

## 🚀 Deployment

HirePath uses Vercel for frontend and backend hosting, with MongoDB Atlas as the database.

**Frontend:** https://hirepath-frontend.vercel.app/

**Backend:** https://place-ready-mern.vercel.app/

Production environment variables are configured through the Vercel dashboard.

The frontend uses `VITE_API_URL` to communicate with the deployed Express API.

---

## 📸 Application Modules

The implemented interface includes:

1. Student Dashboard
2. Faculty Dashboard
3. Placement Opportunities and Company Details Popup
4. Technical Readiness Assessment
5. Assessment Results and History
6. Company-Specific Skill Gap Analysis
7. Personalized Preparation Roadmap
8. Performance Analytics

---

## 🔮 Future Enhancements

- Larger question banks and difficulty-based technical assessments.
- Coding challenges with automated evaluation.
- Resume parsing and job-description matching.
- Adaptive preparation recommendations.
- Mock interview evaluation.
- Advanced placement analytics for faculty.
- Improved assessment integrity and server-validated time limits.

---

## ⚠️ Demonstration Data Disclaimer

This application has been developed for academic and demonstration purposes.

Company careers website links may refer to real organizations; however, sample job descriptions, eligibility criteria, technical proficiency targets, and recruitment deadlines are illustrative.

HirePath does not claim that these sample recruitment opportunities are currently open or that its configured assessment targets are official employer requirements.

Technical readiness scores are preparation indicators and do not guarantee placement or recruitment eligibility.

---

## 👥 Contributors

Developed collaboratively as a Full Stack Development academic project.

The project involves frontend interface development, backend API design, database integration, role-based authentication, assessment scoring, skill-gap analysis, preparation roadmaps, analytics, and deployment.

---

### ⭐ HirePath — From Preparation to Placement

*Assess your skills. Identify your gaps. Prepare with purpose.*
