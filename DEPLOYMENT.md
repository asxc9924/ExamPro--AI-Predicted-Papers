# ExamEdge — Deployment Guide

## Architecture

```
GitHub Repo (monorepo)
├── frontend/   ← Next.js 15
└── backend/    ← Express.js API
         ↓
    Vercel (one deployment, two services)
    ├── /              → frontend (Next.js)
    └── /_/backend     → backend  (Express serverless)
```

---

## Option A — Vercel Monorepo (Recommended) ✅

Both frontend and backend deploy together from the **same** GitHub repo.

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/examedge.git
git push -u origin main
```

### 2. Connect to Vercel
- Go to vercel.com → New Project → Import your repo
- Vercel auto-detects the root `vercel.json` with `experimentalServices`
- **No extra settings needed** — both services deploy automatically

### 3. Environment Variables on Vercel
Go to: **Project → Settings → Environment Variables**

Add these for the **backend** service:

| Variable | Value |
|----------|-------|
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | 64-char random string |
| `JWT_REFRESH_SECRET` | different 64-char random string |
| `JWT_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `GOOGLE_CLIENT_ID` | from Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | from Google Cloud Console |
| `GOOGLE_CALLBACK_URL` | `https://your-project.vercel.app/_/backend/api/auth/google/callback` |
| `RAZORPAY_KEY_ID` | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | from Razorpay dashboard |
| `RAZORPAY_WEBHOOK_SECRET` | from Razorpay webhook settings |
| `CLOUDINARY_CLOUD_NAME` | your cloud name |
| `CLOUDINARY_API_KEY` | your API key |
| `CLOUDINARY_API_SECRET` | your API secret |
| `EMAIL_HOST` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` |
| `EMAIL_USER` | `your@gmail.com` |
| `EMAIL_PASS` | Gmail App Password (16 chars) |
| `EMAIL_FROM` | `ExamEdge <noreply@examedge.in>` |
| `CLIENT_URL` | `https://your-project.vercel.app` |
| `NODE_ENV` | `production` |

Add these for the **frontend** service:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `/_/backend/api` |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_...` |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |

### 4. Google Cloud Console — Authorised Redirect URIs
Add this URI in your OAuth 2.0 Client:
```
https://your-project.vercel.app/_/backend/api/auth/google/callback
```

### 5. Razorpay Webhook URL
In Razorpay Dashboard → Webhooks → Add:
```
https://your-project.vercel.app/_/backend/api/payment/webhook
```

### 6. Seed the database (run once)
```bash
cd backend
MONGODB_URI="mongodb+srv://..." node utils/seed.js
```

---

## Option B — Separate Deployment

| Service | Platform | Command |
|---------|----------|---------|
| Backend | **Render** | `node server.js` |
| Frontend | **Vercel** | `npm run build` |

### Render Settings
```
Root Directory  →  backend
Build Command   →  npm install
Start Command   →  node server.js
Health Path     →  /health
```

### Vercel Settings (frontend only)
Delete the root `vercel.json` or set Root Directory to `frontend`.
Set `NEXT_PUBLIC_API_URL` to your Render URL: `https://examedge-api.onrender.com/api`

---

## URL Reference

| Resource | Vercel Monorepo URL |
|----------|---------------------|
| Frontend | `https://your-project.vercel.app/` |
| API health | `https://your-project.vercel.app/_/backend/health` |
| Auth | `https://your-project.vercel.app/_/backend/api/auth/...` |
| Google OAuth callback | `https://your-project.vercel.app/_/backend/api/auth/google/callback` |
| Razorpay webhook | `https://your-project.vercel.app/_/backend/api/payment/webhook` |

---

## Common Errors

| Error | Fix |
|-------|-----|
| `ERESOLVE` dependency conflict | Already fixed — `multer-storage-cloudinary` removed |
| `xss-clean` not found | Already fixed — replaced with inline sanitizer |
| CORS error | Make sure `CLIENT_URL` env var matches your exact Vercel URL |
| Google OAuth redirect mismatch | Add `/_/backend/api/auth/google/callback` to Google Console |
| `Cannot find module` on Vercel | Check `backend/vercel.json` `includeFiles` covers all folders |

