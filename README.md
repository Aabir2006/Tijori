# Tijori — Escrow Platform for Freelance Deals

**Demo only**: No real payments, no real auth. Built for hackathon (~8 hours).

## Stack
- **Backend**: FastAPI + uvicorn, `psycopg2` (no ORM), Anthropic Python SDK
- **Database**: PostgreSQL (Render managed free tier)
- **AI**: Anthropic Claude / Google Gemini for dispute verdicts
- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4, shadcn/ui, Sonner

---

## Quick Start (Local)

```bash
# 1. Clone and enter
cd tijori

# 2. Create virtualenv & install
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt

# 3. Start local PostgreSQL (Docker)
docker run -d --name tijori-db \
  -e POSTGRES_USER=user -e POSTGRES_PASSWORD=pass -e POSTGRES_DB=tijori \
  -p 5432:5432 postgres:16

# 4. Configure env
cp backend/.env.example backend/.env
# Edit backend/.env → add your GEMINI_API_KEY (DATABASE_URL already set for local)

# 5. Run server
cd backend
python -m uvicorn main:app --reload --port 8000

# 6. Seed demo data (optional)
curl -X POST http://localhost:8000/api/dev/seed -H "Content-Type: application/json" -d '{}'

# 7. Run tests
cd ../backend-tests
./test.sh http://localhost:8000

# 8. Run Frontend
cd ../frontend
npm install
npm run dev
# Open http://localhost:3000
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | `postgresql://user:pass@localhost:5432/tijori` | PostgreSQL connection string |
| `GEMINI_API_KEY` | Yes | — | API key from https://aistudio.google.com/app/apikey |
| `AI_MODEL` | No | `gemini-1.5-flash-latest` | Model for dispute verdicts |
| `ALLOW_SEED` | No | `false` | Enable `POST /api/dev/seed` (dev only) |

---

## API Contract

See [`CONTRACT.md`](CONTRACT.md) — **single source of truth** for frontend & backend.

Key points:
- **Statuses**: `CREATED` → `FUNDED` → `DELIVERED` → `COMPLETED` / `DISPUTED` → `RESOLVED_*`
- **Auth**: Header `x-user-role` (seller|buyer|admin) + `x-user-name` on every request
- **Money**: Integer rupees (no paise, no floats)
- **Errors**: `{ "error": { "code": "...", "message": "..." } }` — 400/403/404/409

---

## Deploy to Render (Free Tier)

### One-time setup
1. Push this repo to GitHub
2. In Render dashboard: **New → Web Service** → connect repo
3. Render auto-detects `render.yaml` — review and **Create Web Service**
   - This provisions **both** the web service **and** a PostgreSQL database (free tier)
4. In service **Environment** tab, add:
   - `GEMINI_API_KEY` = your key (mark as **Secret**)
   - `AI_MODEL` = `gemini-1.5-flash-latest` (or your choice)
   - `ALLOW_SEED` = `true` (set to `false` after demo)
   - `DATABASE_URL` is **auto-linked** from the database (no manual entry needed)
5. Deploy

### Render Settings (if not using render.yaml)
- **Build Command**: `pip install -r backend/requirements.txt`
- **Start Command**: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Python Version**: 3.11 (set in Render dashboard or via `PYTHON_VERSION` env var)

### Render Free Tier Notes
- **PostgreSQL free tier**: 90 days, then expires (fine for hackathon)
- **Web service free tier**: spins down after 15 min inactivity (cold start ~30s)
- **Data persists** across deploys (unlike SQLite on ephemeral disk)
- After first deploy, call `POST /api/dev/seed` to populate demo data

### Verify deploy
```bash
# Health check
curl https://your-app.onrender.com/api/health
# → {"ok":true}

# Seed demo data
curl -X POST https://your-app.onrender.com/api/dev/seed \
  -H "Content-Type: application/json" -d '{}'
# → {"ok":true,"dealsCreated":5}

# Run tests against deployed URL
./backend-tests/test.sh https://your-app.onrender.com
```

---

## Project Structure

```
tijori/
├── CONTRACT.md              # API contract (frontend + backend)
├── render.yaml              # Render deployment config (web + postgres)
├── backend/
│   ├── main.py              # App, routes (YOU write this)
│   ├── db.py                # DB connection, table creation (YOU write this)
│   ├── helpers.py           # Header parsing, require_role, assert_status, log_event, error handlers (YOU write this)
│   ├── ai.py                # AI verdict (Google Gemini SDK) — THIS REPO
│   ├── seed.py              # Demo data loader — THIS REPO
│   ├── requirements.txt     # Python deps — THIS REPO
│   └── .env.example         # Env template — THIS REPO
├── backend-tests/
│   └── test.sh              # Integration tests (curl + jq) — THIS REPO
└── README.md                # This file
```

---

## Running Tests

```bash
# Local
./backend-tests/test.sh http://localhost:8000

# Deployed
./backend-tests/test.sh https://your-app.onrender.com
```

Requires: `curl`, `jq` (standard on most Linux/macOS; `brew install jq` on Mac).

---

## Fintech Concepts (Quick Reference)

| Concept | In This Project |
|---------|-----------------|
| **Escrow** | Money held by platform until both parties agree (or admin resolves) |
| **State Machine** | Deal status transitions are strict (see contract); invalid → 409 |
| **Audit Trail** | Every status change writes an `events` row (who, when, from→to) |
| **Integer Money** | `amount` stored as integer rupees — avoids floating-point bugs |
| **Conditional Update** | `UPDATE ... WHERE status = ?` prevents double-submit races |
| **Atomic Transaction** | Status change + event insert = single DB transaction |

---

## License
MIT — hackathon demo code.