# 🎓 # HirePath — Placement Readiness & Recruitment Platform

**A full-stack MERN application for managing campus placement opportunities, student profiles, and recruitment eligibility.**

PlaceReady provides a centralized platform where placement coordinators can publish company recruitment drives and students can view opportunities based on their academic eligibility.

🌐 **Live Application:** https://placeready-frontend.vercel.app/

## 🚀 Features

### 👨‍🎓 Student Portal
- Student registration and secure login
- Personalized student dashboard
- View and update academic details
- Manage technical skills
- Explore placement opportunities
- Automatic eligibility checking based on:
  - Academic branch
  - Minimum CGPA
  - Maximum active backlogs
  - Application deadline
- View eligibility status and reasons for ineligibility
- Access application links when available
- Delete student account

### 👨‍🏫 Faculty Portal
- Secure faculty login
- Faculty accounts created locally by an administrator
- Publish company placement drives
- Specify eligible branches and academic requirements
- Add job descriptions, deadlines, and application links
- View published placement opportunities
- Edit and delete recruitment drives created by the faculty account

### 🔐 Authentication & Authorization
- Password hashing using bcrypt
- JWT-based authentication
- Role-based authorization for students and faculty
- Protected Express API endpoints
- Private student dashboards
- Faculty-only company management operations

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| Frontend | React.js, Vite, CSS3 |
| Backend | Node.js, Express.js |
| Database | MongoDB, MongoDB Atlas |
| ODM | Mongoose |
| Authentication | JWT, bcryptjs |
| API Communication | REST APIs, Fetch API |
| Cloud Deployment | Vercel |
| Version Control | Git, GitHub |

## 🏗️ System Architecture

```text
                 PlaceReady
                     |
          React Frontend (Vite)
                     |
                REST APIs
                     |
             Express Backend
                     |
           Authentication Layer
              /           \
        Student JWT     Faculty JWT
              \           /
               Mongoose
                   |
             MongoDB Atlas
                   |
          -------------------
          |        |        |
       Students  Faculty  Companies
```

## 📂 Project Structure

```text
placement-portal/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── backend/
│   ├── models/
│   │   ├── Student.js
│   │   ├── Faculty.js
│   │   └── Company.js
│   ├── server.js
│   ├── createFaculty.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following:

- Node.js and npm
- Git
- MongoDB Community Server or MongoDB Atlas
- Visual Studio Code (recommended)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/PlaceReady-MERN.git
cd PlaceReady-MERN
```

### 2. Configure Backend

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
PORT=5000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_SECURE_JWT_SECRET
FRONTEND_URL=http://localhost:5173
```

Generate a JWT secret using:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Start the backend:

```bash
node server.js
```

The backend runs at:

`http://localhost:5000`

### 3. Configure Frontend

Open a second terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the frontend:

```bash
npm run dev
```

Open:

`http://localhost:5173`

## 👨‍🏫 Faculty Account Setup

Faculty registration is intentionally unavailable on the public website.

An administrator creates authorized faculty accounts using the local setup script:

```bash
cd backend
node createFaculty.js
```

Provide the requested details:

- Faculty name
- Faculty email
- Department
- Password

Passwords are securely hashed before storage in MongoDB.

Faculty can then sign in through the Faculty Login section of PlaceReady.

**Security Note:** Protect database credentials and limit access to the faculty account creation script. Never expose administrator credentials or environment files publicly.

## 📊 Placement Eligibility Logic

PlaceReady automatically evaluates each student's eligibility against the requirements of published recruitment drives.

A student is considered eligible when:

```javascript
const eligible =
  company.eligibleBranches.includes(student.branch) &&
  student.cgpa >= company.minCGPA &&
  student.backlogs <= company.maxBacklogs &&
  company.deadline >= currentDate;
```

### Example

A fictional company publishes the following criteria:

| Requirement | Value |
|---|---|
| Eligible branches | CSE, CSM, IT |
| Minimum CGPA | 8.0 |
| Maximum active backlogs | 0 |

A student with branch **CSM**, CGPA **9.01**, and **zero active backlogs** meets the academic eligibility criteria.

If a requirement is not satisfied, the application displays the reason for ineligibility.

The companies and eligibility rules used in the demonstration are fictional.

## 🔗 REST API Endpoints

### Student Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register a student |
| POST | `/api/auth/login` | Student login |
| GET | `/api/me` | Retrieve authenticated student |
| PUT | `/api/me` | Update student profile |
| DELETE | `/api/me` | Delete student account |
| GET | `/api/me/drives` | Retrieve drives with eligibility |

### Faculty Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/faculty/login` | Faculty login |
| GET | `/api/faculty/me` | Retrieve faculty profile |

### Company Management

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/faculty/companies` | View published companies |
| POST | `/api/faculty/companies` | Publish a placement drive |
| PUT | `/api/faculty/companies/:id` | Update an owned drive |
| DELETE | `/api/faculty/companies/:id` | Delete an owned drive |

Protected endpoints require a valid JWT.

## ☁️ Deployment

The application uses:

- **Frontend:** Vercel
- **Backend:** Vercel
- **Database:** MongoDB Atlas

**Live URLs**

- Frontend: https://placeready-frontend.vercel.app/
- Backend: https://place-ready-mern.vercel.app/

For frontend deployment, configure:

```env
VITE_API_URL=https://place-ready-mern.vercel.app
```

For backend deployment, configure:

```env
MONGO_URI=YOUR_ATLAS_CONNECTION_STRING
JWT_SECRET=YOUR_SECURE_SECRET
FRONTEND_URL=https://placeready-frontend.vercel.app
NODE_ENV=production
```

Configure MongoDB Atlas Network Access so the deployed backend can connect.

Do not commit `.env` files or credentials to GitHub.

## 🧪 Testing

The following application workflows can be tested:

1. Student registration and login
2. Duplicate roll-number validation
3. Student dashboard access
4. Faculty authentication
5. Faculty publishing a placement drive
6. Student viewing newly published opportunities
7. Branch and CGPA eligibility checking
8. Faculty editing and deleting a drive
9. Student profile updates
10. MongoDB data persistence

## 🔮 Future Enhancements

- Student applications for individual placement drives
- Faculty verification of student academic information
- Resume upload and profile completion
- Email notifications for new recruitment opportunities
- Placement application status tracking
- Admin dashboard with placement statistics
- Automated drive deadline reminders
- Password reset and email verification
- Improved session security and login rate limiting

## 🎯 Academic Purpose

Developed as part of **Full Stack Development Laboratory – Experiment 10**.

**Experiment:** Develop a full-stack MERN application with React, Express, and MongoDB, demonstrating frontend-backend integration and database operations.

PlaceReady extends the experiment by incorporating authentication, role-based authorization, personalized dashboards, and placement eligibility management.

## 📄 Disclaimer

PlaceReady is an academic demonstration project. Sample companies, eligibility criteria, and recruitment opportunities do not represent actual campus placement announcements.

---

**Built using MongoDB, Express.js, React.js, and Node.js.**
