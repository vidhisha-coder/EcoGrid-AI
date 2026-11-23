# EcoGrid AI — Backend

FastAPI backend for the EcoGrid AI environmental-issue reporting platform. It provides JWT-based authentication, AI-powered image analysis via Google Gemini Vision, and a full REST API for managing reports, comments, and users.

---

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.11+ |
| PostgreSQL | 14+ |
| pip | 23+ |

---

## Quick Start

### 1. Clone & enter the directory

```bash
git clone <repo-url>
cd ecogrid-ai/backend
```

### 2. Create a virtual environment

```bash
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/ecogrid
SECRET_KEY=change-me-to-a-long-random-string
GEMINI_API_KEY=your-google-gemini-api-key
UPLOAD_DIR=./uploads
```

> **Getting a Gemini API key**: Visit [Google AI Studio](https://aistudio.google.com/app/apikey) and create a free API key.

### 5. Create the PostgreSQL database

```sql
CREATE DATABASE ecogrid;
```

### 6. Run database migrations

The app creates tables automatically on startup via SQLAlchemy, but you can also use Alembic for version-controlled migrations:

```bash
# Generate initial migration
alembic revision --autogenerate -m "initial"

# Apply migrations
alembic upgrade head
```

### 7. Start the development server

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health check**: http://localhost:8000/health

---

## API Overview

All endpoints are prefixed with `/api/v1`.

### Authentication (`/api/v1/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user, returns JWT |
| POST | `/auth/login` | Login, returns JWT |
| GET | `/auth/me` | Get current user profile |

### Reports (`/api/v1/reports`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/reports` | Create report (multipart form + optional image) |
| GET | `/reports` | List reports (filtered by status/category/priority) |
| GET | `/reports/{id}` | Get single report with details |
| PUT | `/reports/{id}` | Update report |
| DELETE | `/reports/{id}` | Delete report (authority only) |
| GET | `/reports/map/hotspots` | Lat/lng clusters for map |
| GET | `/reports/analytics/summary` | Dashboard stats |

### Comments (`/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/reports/{id}/comments` | Add comment |
| GET | `/reports/{id}/comments` | List comments |

### Users (`/api/v1/users`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users` | List all users (authority only) |
| PUT | `/users/{id}/role` | Update user role (authority only) |
| GET | `/users/volunteers` | Volunteers list for assignment dropdown |

---

## User Roles

| Role | Capabilities |
|------|-------------|
| `citizen` | File reports, view own reports, add comments |
| `volunteer` | View pending + assigned reports, update status |
| `authority` | Full access — manage users, delete reports, change roles |

---

## AI Features

- **Image Analysis**: Upload a photo and Gemini Vision automatically detects the category, priority, tags, and recommendations.
- **Duplicate Detection**: Each new report is compared against recent pending reports via Gemini text similarity to flag duplicates.

---

## Project Structure

```
backend/
├── main.py                  # FastAPI app entrypoint
├── requirements.txt
├── .env.example
├── alembic.ini
├── alembic/
│   ├── env.py
│   ├── script.py.mako
│   └── versions/
└── app/
    ├── core/
    │   ├── config.py        # Settings (pydantic-settings)
    │   ├── database.py      # SQLAlchemy engine & session
    │   └── security.py      # JWT, password hashing
    ├── models/
    │   ├── user.py
    │   ├── report.py
    │   └── comment.py
    ├── schemas/
    │   ├── user.py
    │   ├── report.py
    │   └── comment.py
    ├── services/
    │   └── ai_service.py    # Gemini Vision integration
    └── api/
        ├── auth.py
        ├── reports.py
        ├── comments.py
        └── users.py
```

---

## Running Tests (optional)

```bash
pip install pytest httpx
pytest tests/ -v
```

---

## Production Notes

- Change `SECRET_KEY` to a cryptographically random 64-character string.
- Set `allow_origins` in CORS middleware to your frontend domain instead of `"*"`.
- Use a production ASGI server: `gunicorn main:app -k uvicorn.workers.UvicornWorker`.
- Store uploaded images on a cloud bucket (S3, GCS) instead of local disk.
