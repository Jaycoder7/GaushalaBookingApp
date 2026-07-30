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
- ✅ Admin dashboard with Google OAuth
- ✅ Google Calendar sync
- ✅ Email notifications via Resend
- ✅ SMS placeholder (ready for integration)
- ✅ CAPTCHA protection (hCaptcha)
- ✅ Rate limiting
- ✅ PostgreSQL database

## Documentation

- [Setup Guide](./docs/SETUP.md)
- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [Environment Variables](./docs/ENV.md)
