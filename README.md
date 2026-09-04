# Rating App - FullStack Intern Coding Challenge

A Store Rating application with three roles: **System Administrator**, **Normal User (Customer)**, and **Store Owner**. Single login with role-based access.

## Tech Stack

- **Frontend**: React + TypeScript + Vite (deployable to Vercel)
- **Backend**: Express + TypeScript + PostgreSQL (deployable to Render)
- **Auth**: JWT-based, role-based access control (RBAC)
- **Validation**: Name (20-60), Address (max 400), Password (8-16 with uppercase + special), Email, Rating (1-5)

> **Note**: Firebase Cloud Functions are NOT required. The app runs entirely on the
> free-friendly stack of Vercel (frontend) + Render (backend) + a free PostgreSQL
> provider (e.g. Neon). Firebase is only used as an optional client-side Google
> Sign-In convenience; it is not part of authentication.

## Project Structure

```
backend/            Express + TypeScript + PostgreSQL API
  src/
    config/         Database pool (pg)
    middleware/     JWT auth + validation
    controllers/    HTTP handlers
    services/       Business logic
    routes/         API route definitions
    types/          TypeScript types
  db/
    schema.sql      Database schema
    init.js         Creates schema
    seed.ts         Seeds test accounts
frontend/           React + TypeScript + Vite SPA
  src/
    context/        AuthContext (JWT session)
    services/       Axios API clients
    pages/          Login, Signup, Landing, Admin + Customer + Store Owner dashboards
    components/     Navbar, ChangePassword, StarRating, etc.
render.yaml         Render backend deployment config
```

## Local Setup

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env   # then fill in your PostgreSQL DATABASE_URL & JWT_SECRET
npm run db:init        # create schema
npm run db:seed        # create test accounts (optional)
npm run dev            # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # set VITE_API_URL=http://localhost:5000
npm run dev            # starts on http://localhost:3000
```

## Test Accounts (after `npm run db:seed`)

| Role         | Email            | Password        |
|--------------|------------------|-----------------|
| Admin        | admin@test.com   | Admin@123       |
| Customer     | customer@test.com| Customer@123    |
| Store Owner  | owner@test.com   | StoreOwner@123  |

## API Endpoints

### Auth (`/api/auth`)
- `POST /signup` - register a CUSTOMER or STORE_OWNER
- `POST /login` - login with email/password + role
- `GET /me` - get current user (auth required)
- `PUT /change-password` - change password (auth required)
- `POST /google` - login/register via Google ID token

### Admin (`/api/admin`) - ADMIN only
- `GET /dashboard`
- `GET /users`, `GET /users/:id`, `POST /users`, `PUT /users/:id`
- `GET /stores`, `GET /stores/:id`, `POST /stores`, `PUT /stores/:id`
- `GET /ratings`, `GET /ratings/:id`, `POST /ratings`, `PUT /ratings/:id`, `DELETE /ratings/:id`
- `GET /customers`, `GET /store-owners`
- All listing endpoints support `name`/`email`/`address`/`role` filtering and `sortBy`/`order` sorting.

### Customer (`/api/customer`) - CUSTOMER only
- `GET /stores?search=` - list stores with overall rating and the user's rating
- `POST /ratings` - submit a rating (1-5)
- `PUT /ratings/:ratingId` - modify an existing rating

### Store Owner (`/api/store-owner`) - STORE_OWNER only
- `GET /dashboard` - store info, average rating, total ratings
- `GET /ratings` - users who rated the owner's store
- `GET /profile` - profile with store details

## Deployment

### Backend (Render)
1. Push the repo to GitHub.
2. Create a new **Web Service** on Render (or use `render.yaml`).
   - Root directory: `backend`
   - Build command: `npm install && npm run build`
   - Start command: `npm start`
3. Set environment variables:
   - `DATABASE_URL` (e.g. a Neon free-tier Postgres connection string)
   - `JWT_SECRET` (a long random string)
   - `NODE_ENV=production`
4. On first deploy, run `npm run db:init && npm run db:seed` (e.g. via a Render shell/console).

### Frontend (Vercel)
1. Import the `frontend/` directory as a Vercel project.
2. Set the environment variable `VITE_API_URL` to your Render backend URL (e.g. `https://<service>.onrender.com`).
3. Deploy. The bundled `vercel.json` rewrites all routes to `index.html` for SPA routing.

### Database
- Use any free PostgreSQL provider (e.g. Neon, Supabase, ElephantSQL). Point `DATABASE_URL` at it.

## Current Database Schema

- **users**: id, name, email, address, password_hash, google_id, role (ADMIN | CUSTOMER | STORE_OWNER)
- **stores**: id, name, email, address, store_owner_id
- **ratings**: id, user_id, store_id, rating (1-5), unique (user_id, store_id)
