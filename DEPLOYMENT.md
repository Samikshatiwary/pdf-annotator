# Deployment Guide — PDF Annotator

Architecture: **Backend** (Express + Socket.IO + MongoDB) on **Render**, **Frontend** (React + Vite static build) on **Vercel**, database on **MongoDB Atlas**.

Deploy the **backend first** — you need its public URL to configure the frontend.

---

## 1. Backend → Render

The repo already contains [`render.yaml`](render.yaml), a Blueprint that defines the service.

1. Push any local changes to GitHub (Render deploys from the repo):
   ```bash
   git add render.yaml pdf-annotator-frontend/vercel.json DEPLOYMENT.md
   git commit -m "Add deployment config"
   git push
   ```
2. In the [Render dashboard](https://dashboard.render.com): **New → Blueprint**, select the `Samikshatiwary/pdf-annotator` repo. Render reads `render.yaml` and creates the `pdf-annotator-backend` web service.
3. When prompted, fill in the **secret** env vars (the `sync: false` ones):

   | Variable | Value |
   |---|---|
   | `MONGODB_URI` | your Atlas connection string |
   | `JWT_SECRET` | a long random string |
   | `JWT_REFRESH_SECRET` | a **different** long random string |
   | `OPENAI_API_KEY` | your OpenAI key |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google OAuth creds |
   | `GOOGLE_REDIRECT_URI` | `https://<backend>.onrender.com/api/cloud/google/callback` |
   | `DROPBOX_APP_KEY` / `DROPBOX_APP_SECRET` | Dropbox creds |
   | `DROPBOX_REDIRECT_URI` | `https://<backend>.onrender.com/api/cloud/dropbox/callback` |
   | `FRONTEND_URL` | your Vercel URL (set after step 2 below — you can start with a guess and update) |

   > Generate a secret quickly: `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`
4. Deploy. When it's live, note the URL, e.g. `https://pdf-annotator-backend.onrender.com`.
5. Verify: open `https://<backend>.onrender.com/health` → should return `{"status":"OK",...}`.

### MongoDB Atlas — allow Render to connect
In Atlas → **Network Access**, add `0.0.0.0/0` (allow from anywhere), since Render web services don't have a static outbound IP on lower tiers. Confirm the DB user in your `MONGODB_URI` has read/write on the target database.

### ⚠️ Uploaded files & plan choice
Uploaded PDFs are stored on the server's disk. `render.yaml` defaults to the **Starter** plan (~$7/mo) with a **persistent disk** so files survive redeploys.
- **Want free instead?** Edit `render.yaml`: set `plan: free` and delete the `disk:` block. Uploaded PDFs will then be wiped on every redeploy/restart, and the service cold-starts after ~15 min idle. Fine for a demo; not for real use.
- **Production-grade?** Migrate uploads to object storage (S3 / Cloudinary) later — that removes the single-instance disk constraint entirely.

---

## 2. Frontend → Vercel

The frontend contains [`vercel.json`](pdf-annotator-frontend/vercel.json) (Vite framework + SPA rewrite so React Router deep links work).

1. In [Vercel](https://vercel.com/new), import the `Samikshatiwary/pdf-annotator` repo.
2. **Set Root Directory to `pdf-annotator-frontend`** (critical — it's a monorepo). Vercel auto-detects Vite (build `npm run build`, output `dist`).
3. Add **Environment Variables** (point them at your Render backend from step 1):

   | Variable | Value |
   |---|---|
   | `VITE_API_BASE_URL` | `https://<backend>.onrender.com/api` |
   | `VITE_BACKEND_URL` | `https://<backend>.onrender.com` |
   | `VITE_WEBSOCKET_URL` | `wss://<backend>.onrender.com` |
   | `VITE_GOOGLE_CLIENT_ID` | your Google client ID (optional) |
   | `VITE_DROPBOX_APP_KEY` | your Dropbox app key (optional) |

   > Note `wss://` (secure WebSocket) for the socket URL, and `/api` on the base URL.
4. Deploy. Note the URL, e.g. `https://pdf-annotator.vercel.app`.

---

## 3. Wire the two together

1. Back in Render, set `FRONTEND_URL` = your Vercel URL (e.g. `https://pdf-annotator.vercel.app`) and redeploy the backend. This adds it to the CORS allow-list.
2. If using Google/Dropbox OAuth, add the redirect URIs (the `.../callback` URLs above) to the **Google Cloud Console** and **Dropbox App Console** authorized-redirect lists.

---

## 4. Smoke test

- Open the Vercel URL, register/login (auth uses a Bearer token in localStorage — works across the two domains).
- Upload a PDF, add a highlight/drawing.
- Open the same doc in two tabs to confirm real-time (Socket.IO) sync.
- Check the browser Network tab: API calls hit `https://<backend>.onrender.com/api/...` with no CORS errors.

## Notes
- Auth is via `Authorization: Bearer` tokens in localStorage, so no cross-site-cookie configuration is required.
- CORS on the backend already allows any origin and reflects it; `FRONTEND_URL` is used for the primary allow entry.
- Redeploys happen automatically on `git push` to `main` (`autoDeploy: true` on Render; Vercel does this by default).
