# Neon PostgreSQL Setup Guide

This guide explains how to set up Neon PostgreSQL for the Rating App backend.

## Prerequisites

- A Neon account (https://neon.tech)
- Node.js installed

## Step 1: Create a Neon Account

1. Go to [Neon](https://neon.tech)
2. Sign up for a free account
3. Verify your email address

## Step 2: Create a Neon Project

1. After signing in, click **Create Project**
2. Select a region closest to your users
3. Enter a project name (e.g., "rating-app")
4. Click **Create Project**
5. Copy the connection string (it will look like `postgresql://...`)

## Step 3: Configure Environment Variables

### Backend

Create or update `backend/.env`:

```env
DATABASE_URL=postgresql://username:password@ep-xxx.region.aws.neon.tech/rating_app?sslmode=require
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
NODE_ENV=development
PORT=5000
```

**Important**: Replace the placeholder values with your actual Neon connection string and other credentials.

## Step 4: Initialize the Database

```bash
cd backend
npm install
npm run db:init
```

This will:
1. Connect to your Neon PostgreSQL database
2. Create all required tables (users, stores, ratings)
3. Create all indexes

## Step 5: Seed the Database

```bash
npm run db:seed
```

This will create the following test accounts:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.com | Admin@123 |
| Customer | customer@test.com | Customer@123 |
| Store Owner | owner@test.com | StoreOwner@123 |

It will also create a sample store and rating.

## Step 6: Start the Backend

```bash
npm run dev
```

## Step 7: Test the Connection

Visit `http://localhost:5000/health` to verify the database connection.

You should see:

```json
{
  "status": "OK",
  "database": "Connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Production Deployment

### Vercel Environment Variables

Add these environment variables in your Vercel project settings:

```
DATABASE_URL=your_neon_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d
GOOGLE_CLIENT_ID=your_google_client_id
NODE_ENV=production
PORT=5000
```

### Neon Connection Pooling

Neon provides built-in connection pooling. For production:

1. Use the connection string provided by Neon
2. The `sslmode=require` parameter is important for security
3. Neon handles connection pooling automatically

## Troubleshooting

### Connection Refused

- Verify your Neon project is active
- Check that the connection string is correct
- Ensure `sslmode=require` is included

### SSL Error

- Neon requires SSL connections
- Make sure your connection string includes `?sslmode=require`

### Table Does Not Exist

- Run `npm run db:init` to create the schema
- Then run `npm run db:seed` to populate with test data

### Permission Denied

- Verify your database user has the correct permissions
- Check that the database name in the connection string matches your Neon database

## Security Notes

- Never commit `.env` files to version control
- Use environment variables for all credentials
- Neon provides SSL by default
- The connection string contains sensitive information - keep it secure

## Neon Free Tier Limits

Neon's free tier includes:
- 0.5 GB of storage
- 24/7 availability for the first month
- 100 hours of compute time per month

For production workloads, consider upgrading to a paid plan.
