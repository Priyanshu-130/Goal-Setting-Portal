# 🎯 PerformX – Goal Setting & Performance Management Portal

PerformX is a modern enterprise performance management portal designed to streamline goal setting, employee appraisal, and continuous performance tracking inside organizations.

The platform supports three major user roles:

- Employees
- Managers
- Administrators

It provides secure workflows, real-time validations, quarterly performance tracking, and centralized reporting using a modern full-stack architecture.

---

# 🚀 Live Demo

### 🌐 Live Website
https://goal-setting-portal.vercel.app/

### 💻 GitHub Repository
https://github.com/priyanshu-130/Goal-Setting-Portal

---

# 🛠️ Tech Stack

## Frontend
- React 18
- Vite
- Framer Motion
- Lucide React Icons
- CSS3

## Backend & Database
- Supabase
- PostgreSQL
- Supabase Authentication

## Security
- Row Level Security (RLS)
- Protected Database Policies
- Role-Based Access Control

---

# ✨ Features

## 👨‍💼 Employee Portal
- Create and manage goals
- Assign goal weightages
- Quarterly self check-ins
- Track progress and achievements
- Goal validation system

## 👩‍💼 Manager Dashboard
- Review employee goals
- Approve or reject submissions
- Provide feedback for rework
- Monitor team performance

## 🛡️ Admin Console
- Organization-wide KPI management
- Generate reports
- Export CSV/Excel files
- Manage performance cycles
- Audit activity logs

---

# 📊 Goal Validation System

The application contains a built-in validation engine that ensures:

- Total goal weightage must equal exactly 100%
- Invalid submissions are blocked automatically
- Real-time feedback is shown to users

---

# 🔒 Database Structure

Main database tables used in the project:

| Table Name | Purpose |
|---|---|
| `profiles` | Stores user profile & role information |
| `goals` | Stores employee goals |
| `check_ins` | Quarterly appraisal tracking |
| `audit_logs` | Activity & compliance logs |

---

# 🔑 Demo Credentials

## Employee
Email: `harshi@demo.com`  
Password: `demo123`

## Manager
Email: `janhvi@demo.com`  
Password: `demo123`

## Admin
Email: `anshu@demo.com`  
Password: `demo123`

---

# ⚙️ Local Setup

## 1. Clone Repository

```bash
git clone https://github.com/priyanshu-130/Goal-Setting-Portal.git
cd Goal-Setting-Portal
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

# 📌 Future Improvements

- Notification system
- AI-powered performance insights
- Mobile responsive optimization
- Advanced analytics dashboard
- Role-based activity feed

---

# 📄 License

This project is created for educational and portfolio purposes.
