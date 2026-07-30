# Environment Variables

## Backend (`apps/backend/.env.local`)

```bash
# Database
DATABASE_URL=postgresql://gaushala:gaushala_dev_password@localhost:5432/gaushala_dev

# Server
NODE_ENV=development
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here (NEVER commit this)
GOOGLE_ADMIN_EMAIL=admin@gaushala.com (whitelist)

# Google Calendar
GOOGLE_CALENDAR_ID=primary

# Resend Email
RESEND_API_KEY=your_api_key_here (NEVER commit this)
RESEND_FROM_EMAIL=noreply@gaushala.com

# SMS (placeholder - integrate later)
SMS_PROVIDER=stub
# SMS_API_KEY=
# SMS_FROM_PHONE=

# hCaptcha
HCAPTCHA_SECRET_KEY=your_secret_key_here (NEVER commit this)

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=10

# JWT (for internal use)
JWT_SECRET=your_jwt_secret_here (NEVER commit this)
```

## Frontend (`.env.local`)

```bash
# API
VITE_API_URL=http://localhost:5000/api

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# hCaptcha
VITE_HCAPTCHA_SITE_KEY=your_site_key_here

# Environment
VITE_APP_ENV=development
```

## Important Security Notes

- ✅ **NEVER** commit `.env.local` files
- ✅ Use `.env.example` as template (safe to commit)
- ✅ Backend secrets (API keys) should NEVER be exposed to frontend
- ✅ Frontend only needs public keys (hCaptcha site key, Google Client ID)
- ✅ Store secrets in CI/CD provider (GitHub Secrets) for production
- ✅ Use environment-specific env files for staging/production
