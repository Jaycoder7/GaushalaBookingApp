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
- `apps/frontend/.env.local`

See `.env.example` files for reference.

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
cd apps/frontend
npm install
```

### 5. Start Development

```bash
# From root
npm run dev
```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable:
   - Google+ API
   - Google Calendar API
4. Create OAuth 2.0 credentials (Web Application)
5. Set authorized redirect URIs:
   - `http://localhost:3000/auth/callback` (dev)
   - `https://yourdomain.com/auth/callback` (production)
6. Copy Client ID and Secret to `.env.local`

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
