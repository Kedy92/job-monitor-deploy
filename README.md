# Job Monitor

Job Monitor is a full-stack SaaS-style web application for tracking job opportunities, monitoring job pages, and improving applications with AI-assisted CV tools.

Live app:

- Frontend: https://www.jobmonitor.online
- API: https://api.jobmonitor.online
- API docs: https://api.jobmonitor.online/docs

## Core Features

- User registration and JWT login
- Authenticated dashboard with user-specific data
- Job/application tracking with CRUD operations
- Application status pipeline: applied, interview, offer, rejected
- URL monitors that scrape pages on a schedule
- Manual "run now" monitor checks
- Monitor run history with match, no-match, and error states
- Keyword/ATS matching for job descriptions
- AI-assisted CV generation with saved CV versions
- PDF download for generated CV drafts
- Email notifications for monitor matches

## Tech Stack

- Frontend: React, Vite, Tailwind CSS, React Router, lucide-react
- Backend: FastAPI, SQLAlchemy, Alembic, Pydantic
- Database: PostgreSQL
- Background jobs: APScheduler
- Scraping: requests, BeautifulSoup
- AI: Anthropic Claude integration with local fallback logic
- PDF: ReportLab
- Deployment: Vercel frontend, AWS EC2 backend, Docker, Nginx, Let's Encrypt HTTPS

## Architecture

```text
Browser
  -> Vercel frontend
  -> https://api.jobmonitor.online
  -> Nginx on AWS EC2
  -> FastAPI Docker container
  -> PostgreSQL Docker container
```

The production EC2 setup uses `docker-compose.server.yml`. PostgreSQL data is stored in a named Docker volume so it survives container restarts.

## Assignment Fit

This project satisfies the core requirements for the web framework project:

- React frontend with interactive UI
- FastAPI backend
- Database-backed dynamic data
- Full CRUD for monitors and applications
- Authentication
- Deployed frontend and backend
- Git history with multiple commits

It also includes higher-grade/VG-oriented functionality:

- Scheduled scraping
- Manual asynchronous-style monitor checks
- AI/LLM-powered CV generation
- ATS/keyword matching
- Email notifications
- Dockerized deployment
- HTTPS domain setup
- Professional SaaS-style UI

## Local Development

Backend:

```bash
cd backend
cp .env.example .env
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Docker:

```bash
cp backend/.env.example backend/.env
docker compose up --build
```

## Environment Variables

Backend variables are documented in [backend/.env.example](backend/.env.example).

Frontend variables are documented in [frontend/.env.example](frontend/.env.example).

Never commit real `.env` files, private keys, database passwords, or API keys.

## Useful Commands

Run backend migrations:

```bash
cd backend
alembic upgrade head
```

Build frontend:

```bash
cd frontend
npm run build
```

Run backend tests:

```bash
cd backend
pytest
```

## Production Notes

The current production backend is served from AWS EC2 with:

- Nginx reverse proxy
- Let's Encrypt certificate for `api.jobmonitor.online`
- FastAPI bound locally on port `8000`
- PostgreSQL running in Docker on the same EC2 instance

The server compose file intentionally binds the backend to `127.0.0.1:8000` so it is only exposed through Nginx.
