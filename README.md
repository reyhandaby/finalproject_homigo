# Homigo — Property Rental Web App

## Tech Stack
- Frontend: Next.js App Router, React, TailwindCSS, TanStack Query, RHF + Zod, Axios
- Backend: Node.js, Express, Prisma ORM, PostgreSQL (Supabase compatible), JWT, Bcrypt, Nodemailer, Cloudinary

## Monorepo Structure
- `homigo-web/` — Next.js application (client)
- `homigo-api/` — Express API (server)

## Environment Variables
Copy `.env.example` in both apps and fill values.

### homigo-api/.env
```
DATABASE_URL=postgresql://USER:PASS@HOST:PORT/DB
JWT_SECRET=changeme
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
APP_URL=http://localhost:3000
API_URL=http://localhost:4000
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
OPENCAGE_API_KEY=
```

### homigo-web/.env
```
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_OPENCAGE_API_KEY=
```

## Install & Run
```
# API
cd homigo-api
npm install
npm run prisma:generate
npm run dev

# Web
cd ../homigo-web
npm install
npm run dev
```

## Prisma
Define schema in `homigo-api/prisma/schema.prisma`. Apply to DB:
```
cd homigo-api
npm run prisma:migrate
```

## Cron Jobs
Auto-cancel unpaid bookings and send H-1 reminders:
```
cd homigo-api
npm run cron
```

## Features Implemented
- Registration (user & tenant), email verification, login, reset password
- Property, room, category CRUD APIs
- Server-side pagination, filtering, sorting on properties
- Booking flow, payment proof upload, approve/reject
- Reviews with tenant reply
- Sales report (JSON/CSV) and property availability
- Frontend pages for landing, auth, listing, detail, booking, upload proof, dashboard, categories, room create, reports, profile

## Notes
- Use Supabase Postgres connection string for `DATABASE_URL`.
- Set `OPENCAGE_API_KEY` to enable city autocomplete.
