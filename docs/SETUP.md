# Setup Guide

## Prerequisites

- Node.js 18 or higher
- PostgreSQL 14 or higher (or use Docker)
- A Google Cloud project (for OAuth and Calendar API)
- Resend API key

## Local Development Setup

### 1. Environment Variables

Create `.env.local` files in:
- `apps/backend/.env.local`
- `.env.local` (repository root, for the frontend)

See `.env.frontend.example` and `apps/backend/.env.example` for reference.

### 2. PostgreSQL Setup

**Option A: Using Docker**
```bash
docker-compose up -d postgres
```

**Option B: Local PostgreSQL**
```bash
# Create database
psql -U postgres
CREATE DATABASE gaushala_dev;
```

### 3. Backend Setup

```bash
cd apps/backend
npm install
npm run migrate
```

### 4. Frontend Setup

```bash
# From the repository root
npm install
```

### 5. Start Development

```bash
# Terminal 1: frontend, from the repository root
npm run dev

# Terminal 2: backend, from the repository root
npm run backend:dev
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable:
   - Google Identity Services
   - Google Calendar API
4. Create OAuth 2.0 credentials (Web Application)
5. Set authorized JavaScript origins:
   - `http://localhost:3000` (dev)
   - Your Vercel production URL
6. Copy Client ID and Secret to `.env.local`
7. Generate an offline OAuth refresh token with Calendar scope and set
   `GOOGLE_CALENDAR_REFRESH_TOKEN` on the backend.

## Resend Setup

1. Go to [Resend](https://resend.com/)
2. Create an account
3. Get your API key from the dashboard
4. Add to `apps/backend/.env.local`:
   ```
   RESEND_API_KEY=your_key_here
   ```

## SMS Integration (Placeholder)

SMS is currently stubbed out. When ready, integrate with:
- Twilio
- Vonage/Nexmo
- AWS SNS

Update `apps/backend/src/services/sms.service.ts` with provider implementation.

## Production Deployment

### Frontend on Vercel

Use the repository root as the Vercel project root. The checked-in
`vercel.json` builds the Vite app into `dist` and supports direct navigation to
React routes.

Set:

```bash
VITE_API_URL=https://your-backend-host/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_HCAPTCHA_SITE_KEY=your_hcaptcha_site_key
```

### Backend

Deploy `apps/backend/Dockerfile` to a container host and attach a managed
PostgreSQL database. Copy every required value from
`apps/backend/.env.example` into the host's secret/environment settings.
The container runs migrations before starting the API.

Set `CORS_ORIGIN` and `APP_URL` to the final Vercel origin, including `https://`
and without a trailing slash.
