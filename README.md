# Gaushala Booking App

A web app for booking Gaushala visits with visitor booking flow and admin dashboard management.

## Project Structure

```
.
├── src/                    # React + TypeScript frontend
├── index.html              # Vite frontend entry point
├── apps/
│   └── backend/            # Node.js + Express + TypeScript
├── packages/
│   └── shared/             # Shared types and utilities
├── vercel.json             # Frontend deployment configuration
├── docker-compose.yml      # Local development environment
└── README.md
```

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Docker (optional, for local DB)

### Setup

1. **Clone the repo**
   ```bash
   git clone https://github.com/Jaycoder7/GaushalaBookingApp.git
   cd GaushalaBookingApp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.frontend.example` to `.env.local`
   - Copy `apps/backend/.env.example` to `apps/backend/.env.local`
   - Fill in required values (see setup docs)

4. **Start PostgreSQL**
   ```bash
   docker-compose up -d postgres
   # OR use your local PostgreSQL instance
   ```

5. **Run migrations**
   ```bash
   cd apps/backend
   npm run migrate
   ```

6. **Start the development servers in separate terminals**
   ```bash
   npm run dev
   npm run backend:dev
   ```
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Features

- ✅ Visitor booking without authentication
- ✅ Token-based booking cancellation
- ✅ Admin dashboard with whitelisted Google sign-in
- ✅ Booking management, manual bookings, CSV export, and no-show tracking
- ✅ Weekly schedule configuration and individual slot blocking
- ✅ Google Calendar sync when OAuth refresh credentials are configured
- ✅ Email notifications via Resend
- ✅ SMS placeholder (ready for integration)
- ✅ CAPTCHA protection (hCaptcha)
- ✅ IP and phone-number rate limiting
- ✅ PostgreSQL database

## Production topology

- Frontend: Vercel, using the root `vercel.json`
- Backend: any Node/Docker host, using `apps/backend/Dockerfile`
- Database: managed PostgreSQL

The frontend needs `VITE_API_URL`, `VITE_GOOGLE_CLIENT_ID`, and
`VITE_HCAPTCHA_SITE_KEY` in Vercel. The backend needs the variables documented
in `apps/backend/.env.example` on its own host. Run the database migration
before serving traffic; the Docker image does this automatically.

## Documentation

- [Setup Guide](./docs/SETUP.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Environment Variables](./docs/ENV.md)
