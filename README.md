# ReLoop AI - Circular Waste Intelligence Platform

VYNEDAM Talent Hunt 2K26 - Problem 14 MVP

Pipeline: **Waste Image -> AI Classification -> Waste Batch -> Explainable Recycler
Matching -> Material Passport -> ESG Dashboard**

---

## 1. Folder structure

```
reloop-ai/
  backend/
    app/
      routers/          classify.py, batches.py, matches.py, dashboard.py
      services/          classifier.py (vision), matching.py (scoring), insights.py (ESG)
      main.py            FastAPI app + CORS
      database.py        SQLAlchemy engine/session
      models.py          ORM tables (mirrors supabase_schema.sql)
      schemas.py         Pydantic request/response models
      seed.py            seeds 9 simulated recyclers
    supabase_schema.sql  run this once in Supabase SQL editor
    requirements.txt
    .env.example
  frontend/
    src/
      pages/             Landing, Scanner, CreateBatch, Matching, Passport, Dashboard
      components/        Navbar, StatusBadge, ScoreBar
      api.js             single fetch wrapper for every backend call
    package.json
    .env.example
```

## 2. Architecture

**Modular monolith.** One FastAPI process, four clear modules (classification,
batches/traceability, matching, dashboard), one Postgres database. No
microservices, queues, or Kubernetes - this keeps the whole system
understandable by four beginner developers while still being explainable as
"vision, matching and ESG have clear service boundaries" to judges.

```
React (Vite) --HTTP/JSON--> FastAPI --SQLAlchemy--> Supabase Postgres
```

## 3. Data flow

1. User uploads an image on the **Scanner** screen -> `POST /api/classify`
   returns `material`, `confidence`, `recyclability`.
2. If confidence is below the threshold, the UI requires human
   verification/correction before continuing.
3. User fills in quantity/location/condition on **Create Batch** ->
   `POST /api/batches` creates a `waste_batches` row and three
   `traceability_events` (COLLECTED, CLASSIFIED, BATCH_CREATED).
4. **Matching** screen calls `GET /api/batches/{id}/matches`, which scores
   every recycler that accepts that material (40/25/20/15 = 100 breakdown)
   and returns them ranked.
5. Selecting a recycler calls `POST /api/matches/{id}/select`, which marks
   the batch `MATCHED` and logs a `MATCHED` traceability event.
6. **Material Passport** (`GET /api/batches/{id}/timeline`) renders every
   event. Controlled buttons call `POST /api/batches/{id}/status` to move
   the batch through `PICKUP_SCHEDULED -> RECEIVED -> RECYCLED`.
7. **ESG Dashboard** (`GET /api/dashboard`) aggregates real batch data live.

## 4. Dependencies

Backend: `fastapi`, `uvicorn`, `sqlalchemy`, `psycopg2-binary`, `pydantic`,
`python-multipart`, `Pillow`, `numpy`, `python-dotenv` (see `requirements.txt`).

Frontend: `react`, `react-router-dom`, `chart.js`, `react-chartjs-2`,
`tailwindcss`, `vite` (see `package.json`).

## 5. Environment variables

**backend/.env** (copy from `.env.example`)
```
DATABASE_URL=postgresql://postgres.xxxx:PASSWORD@aws-0-<region>.pooler.supabase.com:5432/postgres
FRONTEND_ORIGINS=http://localhost:5173,https://your-frontend.vercel.app
CLASSIFICATION_CONFIDENCE_THRESHOLD=0.6
```

**frontend/.env** (copy from `.env.example`)
```
VITE_API_URL=http://localhost:8000
```

## 6. Database setup (Supabase)

1. Create a project at https://supabase.com.
2. Project -> SQL Editor -> New query -> paste the contents of
   `backend/supabase_schema.sql` -> Run.
3. Project -> Settings -> Database -> Connection string -> copy the
   **Session pooler** URI (works well from Render) into `DATABASE_URL`.

## 7. Exact setup commands

**Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env            # then edit DATABASE_URL
python -m app.seed              # seeds 9 simulated recyclers
uvicorn app.main:app --reload --port 8000
```

**Frontend**
```bash
cd frontend
npm install
cp .env.example .env            # VITE_API_URL=http://localhost:8000
npm run dev
```

Open http://localhost:5173

---

## RUN LOCALLY

Same as section 7 above. Run backend and frontend in two terminals.

## TEST THE FULL FLOW

1. `curl http://localhost:8000/api/health` -> `{"status":"ok", ...}`
2. Open the app, go to **Scanner**, upload any waste photo, click **Analyze
   Waste** -> material/confidence/recyclability appear.
3. Try a low-confidence image (or any ambiguous photo) -> a material
   correction chip row appears; pick a material to continue.
4. Click **Create Material Batch**, fill quantity/location/condition,
   submit -> you land on **Matching** with a `WST-####` batch code shown.
5. On **Matching**, ranked recycler cards appear with a score breakdown
   that sums to the total shown. Click **Select this recycler**.
6. You land on **Material Passport** -> COLLECTED through MATCHED are
   already checked off. Click **Mark as Pickup Scheduled**, then
   **Mark as Received**, then **Mark as Recycled**.
7. Go to **ESG Dashboard** -> totals, diversion rate, charts and the
   ReLoop Insight reflect the batch you just created.

## EXPECTED RESULTS

| Step | Expected result |
|---|---|
| Health check | `{"status":"ok","service":"reloop-ai-backend"}` |
| Classify | One of plastic/paper/cardboard/glass/metal/organic + confidence 0-1 |
| Low confidence | UI blocks batch creation until a material chip is confirmed |
| Batch creation | Batch code like `WST-8731`, status `BATCH_CREATED` |
| Matching | 1+ cards, scores sum to `material_match+capacity_fit+distance+reliability` |
| Match selection | Batch status becomes `MATCHED`, other proposed matches rejected |
| Passport | Timeline shows COLLECTED, CLASSIFIED, BATCH_CREATED, MATCHED in order |
| Status updates | Backward/duplicate transitions return HTTP 400 |
| Dashboard | Numbers match what you created; insight names the top material |

## DEBUGGING GUIDE (15 most likely errors)

1. **CORS error in browser console** - `FRONTEND_ORIGINS` in backend `.env`
   doesn't include your frontend's exact origin (including port/https).
2. **`psycopg2.OperationalError: could not connect`** - wrong `DATABASE_URL`,
   or you used the "Direct connection" string instead of the pooler on
   Render (pooler is required on most PaaS free tiers).
3. **`sqlalchemy.exc.OperationalError` on Render but works locally** -
   Supabase free tier pauses inactive projects; open the Supabase dashboard
   to wake it up.
4. **`422 Unprocessable Entity` on `/api/classify`** - form field must be
   named exactly `image`; check `api.js` matches.
5. **`400 material_type must be one of [...]`** - frontend sent a material
   outside the six frozen classes; check the correction chip list.
6. **Matches list is empty** - no recycler in `recycler_materials` accepts
   that `material_type`; run `python -m app.seed` again (delete rows first
   if you already seeded).
7. **`relation "waste_batches" does not exist`** - you didn't run
   `supabase_schema.sql` and `Base.metadata.create_all` failed silently;
   check backend startup logs.
8. **Vite dev server shows a blank page** - `VITE_API_URL` missing/wrong in
   `frontend/.env`; restart `npm run dev` after editing env files.
9. **Images won't upload** - file type isn't JPEG/PNG/WEBP; the backend
   explicitly rejects other types.
10. **`404 Batch not found`** - batch ID in the URL query string doesn't
    exist (e.g. you refreshed after a DB reset); go back to Scanner.
11. **Status update returns 400 "already at X"** - you tried to skip or
    repeat a lifecycle stage; only the immediate next stage is allowed.
12. **Charts don't render** - `chart.js` components must be registered in
    `Dashboard.jsx` (already done); check the browser console for a
    "not a registered scale" error if you add new chart types.
13. **`ModuleNotFoundError: No module named 'app'`** - run uvicorn from the
    `backend/` folder, not from `backend/app/`.
14. **Render build fails on `psycopg2-binary`** - add a `runtime.txt` with a
    Python version Render supports (3.11 or 3.12) if the default image lacks
    build tools.
15. **Vercel shows old data after redeploy** - `VITE_API_URL` is baked in at
    build time; update the Vercel environment variable and trigger a new
    deploy, not just a refresh.

## DEPLOYMENT

**Backend on Render**
1. Push this repo to GitHub.
2. Render -> New -> Web Service -> connect the repo, root directory `backend`.
3. Build command: `pip install -r requirements.txt`
4. Start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `DATABASE_URL`, `FRONTEND_ORIGINS`,
   `CLASSIFICATION_CONFIDENCE_THRESHOLD`.
6. Deploy, then note the Render URL (e.g. `https://reloop-api.onrender.com`).

**Frontend on Vercel**
1. Vercel -> New Project -> import the repo, root directory `frontend`.
2. Framework preset: Vite.
3. Environment variable: `VITE_API_URL=https://reloop-api.onrender.com`.
4. Deploy, then note the Vercel URL.
5. Go back to Render and update `FRONTEND_ORIGINS` to include that Vercel URL,
   then redeploy the backend so CORS allows it.

## FINAL VERIFICATION CHECKLIST (Problem 14 MVP)

- [ ] `GET /api/health` returns 200
- [ ] Image upload classifies into exactly one of the six waste classes
- [ ] Response includes material, confidence, recyclability
- [ ] Low-confidence results require human verification/correction
- [ ] Batch creation stores material_type, quantity, source_location,
      condition, image_url, confidence, status, created_at
- [ ] Batch receives a readable code (`WST-####`)
- [ ] 8-10 simulated recyclers seeded with accepted materials
- [ ] Matching score breakdown always sums material(40)+capacity(25)+
      distance(20)+reliability(15) = total out of 100
- [ ] Frontend shows the full score breakdown, not just the total
- [ ] Matching uses no LLM - deterministic scoring only
- [ ] Every batch has a full lifecycle timeline (7 event types)
- [ ] Status updates are controlled (only forward, one step at a time)
- [ ] Every status change creates a traceability event
- [ ] ESG dashboard shows total processed, diverted, diversion rate,
      active batches
- [ ] Dashboard charts use real batch data, not invented numbers
- [ ] No carbon-equivalent figures are shown (none implemented in this MVP)
- [ ] One deterministic ESG insight generated from real aggregates
- [ ] All 9 required backend routes present with exact contracts
- [ ] CORS configured for both localhost and deployed frontend URL
- [ ] No Kubernetes/Kafka/Redis/MQTT/blockchain/microservices/IoT/payments/
      mobile app/generic chatbot introduced
- [ ] Deployed and reachable on Vercel (frontend) + Render (backend)
