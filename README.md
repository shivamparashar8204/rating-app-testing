# Rating App - FullStack Intern Coding Challenge

## Setup Instructions

### Prerequisites
- Node.js 16+ and npm
- PostgreSQL 12+

### Backend Setup

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

3. Update `.env` with your PostgreSQL credentials

4. Initialize database:
```bash
npm run db:init
```

5. Start development server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

## API Endpoints

- `GET /health` - Database connection health check
- `GET /api` - API status check

## Database Schema

- **users**: User accounts with roles (ADMIN, USER, STORE_OWNER)
- **stores**: Store information with owner reference
- **ratings**: User ratings for stores (1-5 scale, one per user per store)