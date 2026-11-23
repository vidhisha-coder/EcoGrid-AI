# EcoGrid AI 🌍

**AI-Powered Community & Environmental Intelligence Platform**

EcoGrid AI is a full-stack platform that combines AI-powered image analysis (Google Gemini Vision), interactive maps, and community collaboration to identify, report, and resolve environmental issues.

---

## 🏗️ Architecture

```
ecogrid-ai/
├── backend/          # FastAPI + PostgreSQL
└── frontend/         # React + TypeScript
```

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL 14+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/app/apikey))

---

## ⚙️ Backend Setup

```bash
cd ecogrid-ai/backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Configure environment
copy .env.example .env
# Edit .env with your database URL and Gemini API key

# Create the PostgreSQL database
# In psql: CREATE DATABASE ecogrid;

# Run migrations
alembic upgrade head

# Start the backend server
uvicorn main:app --reload --port 8000
```

Backend API docs available at: http://localhost:8000/docs

---

## 🎨 Frontend Setup

```bash
cd ecogrid-ai/frontend

# Install dependencies
npm install

# Start the development server
npm start
```

Frontend available at: http://localhost:3000

---

## 🔑 Environment Variables

### Backend `.env`
| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SECRET_KEY` | JWT secret key (use a long random string) |
| `GEMINI_API_KEY` | Google Gemini API key |
| `UPLOAD_DIR` | Directory for uploaded images |

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **Citizen** | Report environmental issues, view map, track own reports |
| **Volunteer** | View and update assigned tasks |
| **Authority** | Full admin dashboard, assign volunteers, view analytics, manage users |

> **Note:** Register as Citizen or Volunteer. Authority accounts must be manually promoted via the Admin Users page by an existing Authority, or directly in the database.

---

## 🤖 AI Features (Gemini Vision)

When a citizen uploads an image with a report:
1. **Image Analysis** — Gemini Vision analyzes the image and returns:
   - Environmental issue category
   - Priority level (low/medium/high/critical)
   - Description of visible issues
   - Confidence score
   - Tags and recommendations
2. **Duplicate Detection** — Checks new reports against existing ones
3. **Auto-classification** — Pre-fills category and priority fields

---

## 📊 Key Features

- 🗺️ **Interactive Map** — All reports plotted with priority-colored markers
- 📸 **Image Upload** — Drag & drop image upload with AI instant analysis
- 📈 **Analytics Dashboard** — Charts and statistics for environmental trends
- 🔔 **Status Tracking** — Real-time status updates (pending → assigned → resolved)
- 💬 **Comments** — Discussion threads on each report
- 👤 **Admin Panel** — User management and role assignment

---

## 🛠️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login and get JWT |
| GET | `/api/v1/reports` | List all reports |
| POST | `/api/v1/reports` | Create report + AI analysis |
| GET | `/api/v1/reports/{id}` | Get report details |
| PUT | `/api/v1/reports/{id}` | Update report status |
| GET | `/api/v1/reports/map/hotspots` | Map hotspot data |
| GET | `/api/v1/reports/analytics/summary` | Analytics data |
| GET | `/api/v1/users` | List users (authority) |

Full interactive docs at http://localhost:8000/docs

---

## 📁 Database Schema

```
users           — User accounts with roles
reports         — Environmental issue reports
comments        — Discussion on reports
```

---

## 🌿 Built With

- **FastAPI** — High-performance Python web framework
- **React + TypeScript** — Type-safe frontend
- **PostgreSQL** — Relational database
- **SQLAlchemy** — Python ORM
- **Google Gemini Vision** — AI image analysis
- **React-Leaflet** — Interactive maps
- **Recharts** — Data visualization
- **Tailwind CSS** — Utility-first styling


## Local setup (Windows / PowerShell)

### Backend
1. Open a terminal in `backend`.
2. Create and activate a virtual environment:
   ```powershell
   py -3.11 -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
3. Install packages:
   ```powershell
   python -m pip install --upgrade pip
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and set your own PostgreSQL password and Gemini API key:
   ```powershell
   Copy-Item .env.example .env
   ```
5. Create the PostgreSQL database named `ecogrid` if it does not already exist, then run:
   ```powershell
   alembic upgrade head
   uvicorn main:app --reload --port 8000
   ```
6. API documentation: http://127.0.0.1:8000/docs

### Frontend
1. Open a second terminal in `frontend`.
2. Install dependencies and start the app:
   ```powershell
   npm install
   npm start
   ```
3. Open http://localhost:3000

The project ZIP intentionally excludes `.env`, Python virtual environments, `node_modules`, and generated cache files. Create your local `.env` from `.env.example` and install dependencies after extracting.
