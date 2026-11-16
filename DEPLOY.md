# NO ONE LABS — Production deployment

Do not deploy until you approve. Architecture: **Vercel (frontend)** + **Railway (API + SQLite + uploads volume)**.

## 1. Backend (Railway)

1. Create a Railway project from this repo.
2. Add a **persistent volume** mounted at `/data`.
3. Deploy using the included `Dockerfile`.
4. Set backend env vars (below).
5. Copy the public API URL (e.g. `https://….up.railway.app`).

## 2. Frontend (Vercel)

1. Import the same repo into Vercel.
2. Framework: Vite. Build: `npm run build`. Output: `dist`.
3. Set `VITE_API_URL` to the Railway API URL (no trailing slash).
4. Deploy.
5. Copy the Vercel URL into Railway `FRONTEND_URL`.
6. Redeploy Railway once so CORS/cookies pick up the frontend origin.

## 3. Owner unlock

1. Set real `OWNER_EMAIL` and `OWNER_BOOTSTRAP_PASSWORD` (≥10 chars) on Railway.
2. Redeploy API.
3. Open `https://YOUR_VERCEL_APP/admin/login` and sign in with that email/password.

## Environment variables

### Railway (API)

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | yes | `production` |
| `PORT` | yes | `3001` (or Railway-assigned) |
| `DATA_DIR` | yes | `/data` (volume mount) |
| `FRONTEND_URL` | yes | Exact Vercel URL, no trailing slash |
| `OWNER_EMAIL` | yes | Owner allowlist (comma-separated OK). Keep `PENDING` until ready |
| `OWNER_BOOTSTRAP_PASSWORD` | yes for first login | Min 10 chars; hashed after first success |
| `SESSION_SECRET` | yes | Long random string |

### Vercel (frontend)

| Variable | Required | Notes |
|---|---|---|
| `VITE_API_URL` | yes | Railway API origin, no trailing slash |

## Notes

- `/admin` APIs stay owner-only via backend session + email allowlist.
- SQLite DB: `$DATA_DIR/data/noone.db`
- Uploads: `$DATA_DIR/uploads`
- Local: leave `VITE_API_URL` empty and use `npm run dev` (Vite proxy).
