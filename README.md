# NekoStream API

Express and MongoDB authentication API for NekoStream. It runs locally with `src/server.js` and on Vercel through `api/[...path].js`.

## Local development

```powershell
Copy-Item .env.example .env
npm install
npm run dev
```

Set a running MongoDB URL and two different secrets of 32+ characters in `.env`. The local health endpoint is `http://localhost:5000/api/health`.

## Vercel deployment

1. Push this folder's contents to a separate repository. Do not copy or commit `.env`.
2. Import the repository in Vercel; no build command or custom output directory is needed.
3. Add `MONGODB_URI` (MongoDB Atlas), `CLIENT_ORIGIN=https://neko-stream-rho.vercel.app`, `JWT_ACCESS_SECRET`, and `JWT_REFRESH_SECRET` in Vercel Environment Variables. Also set `NODE_ENV=production`.
4. Set the frontend's build-time variable to `VITE_API_BASE_URL=https://YOUR-API.vercel.app/api` and redeploy the frontend. Requests that use session cookies must set `credentials: 'include'` (or `withCredentials: true` in Axios).

Production session cookies use `SameSite=None; Secure` so browsers can send them between the separate frontend and API `*.vercel.app` domains. Browser privacy settings may still block third-party cookies. A custom frontend and API domain under the same site is the most reliable setup.
