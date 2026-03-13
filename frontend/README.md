# Job Monitor Frontend

React + Vite frontend for the Job Monitor project.

## Local development

Install dependencies:

```bash
npm ci
```

Run the dev server:

```bash
npm run dev
```

By default, the frontend calls the backend at `http://127.0.0.1:8000` when `VITE_API_URL` is not set.

## Docker mode

The Docker frontend is built with:

```text
VITE_API_URL=""
```

That makes the app call relative paths like `/auth/login`, and Nginx proxies those requests to the backend container.

## Vercel deployment

Use these settings in Vercel:

- Framework preset: `Vite`
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`

Set this environment variable in Vercel:

```text
VITE_API_URL=https://your-backend-domain.example.com
```

Notes:

- Use an `https://` backend URL for production. A Vercel site served over HTTPS cannot safely call a plain `http://` backend.
- `VITE_API_URL` must be the variable name. Do not use the backend URL as the key.
- Preview deployments are supported by the backend CORS regex for `*.vercel.app`.

## Backend CORS

The backend supports:

- explicit origins via `BACKEND_CORS_ORIGINS`
- Vercel preview URLs via `BACKEND_CORS_ORIGIN_REGEX`

Example backend env value:

```text
BACKEND_CORS_ORIGINS=["https://your-project.vercel.app"]
```

If you use a custom frontend domain, add that domain to `BACKEND_CORS_ORIGINS` too.

## Verification

```bash
npm run lint
npm run build
```
