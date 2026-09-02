# Google Authentication Setup Guide

This guide explains how to configure Google Authentication for the Rating App.

## Prerequisites

- A Google account
- Access to Google Cloud Console

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click **New Project**
4. Enter a project name (e.g., "Rating App")
5. Click **Create**

## Step 2: Configure OAuth Consent Screen

1. In the Google Cloud Console, go to **APIs & Services** > **OAuth consent screen**
2. Select **External** user type (unless you have a Google Workspace organization)
3. Click **Create**
4. Fill in the required fields:
   - **App name**: Your application name (e.g., "5 Star Reviews")
   - **User support email**: Your email address
   - **Developer contact information**: Your email address
5. Click **Save and Continue**
6. On the **Scopes** page, click **Add or Remove Scopes**
7. Select the following scopes:
   - `email`
   - `profile`
8. Click **Update** then **Save and Continue**
9. On the **Test users** page, add any Google accounts you want to test with (while in testing mode)
10. Click **Save and Continue**
11. Click **Back to Dashboard**

## Step 3: Create OAuth Client ID

1. In the Google Cloud Console, go to **APIs & Services** > **Credentials**
2. Click **+ Create Credentials** > **OAuth client ID**
3. Select **Web application** as the application type
4. Enter a name (e.g., "Rating App Web Client")
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173` (for local development)
   - `http://localhost:3000` (if using different port)
   - Your production Vercel domain (e.g., `https://your-app.vercel.app`)
6. Under **Authorized redirect URIs**, add:
   - `http://localhost:5173`
   - Your production Vercel domain
7. Click **Create**
8. Copy the **Client ID** (you'll need this for both frontend and backend)

## Step 4: Configure Environment Variables

### Backend

Create or update `backend/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_here
```

### Frontend

Create or update `frontend/.env`:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

**Important**: The Client ID is safe to use in frontend code. Do NOT expose any client secrets.

## Step 5: Update Database Schema

If you have an existing database, run this SQL to add the `google_id` column:

```sql
ALTER TABLE users
ADD COLUMN google_id VARCHAR(255) UNIQUE NULL AFTER password_hash;

CREATE INDEX idx_users_google_id ON users(google_id);
```

Or drop and recreate the database using the updated `schema.sql`.

## Step 6: Install Dependencies

### Backend

```bash
cd backend
npm install
```

### Frontend

```bash
cd frontend
npm install
```

## Step 7: Run the Application

### Backend

```bash
cd backend
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

## Step 8: Test Google Authentication

1. Open the application at `http://localhost:5173`
2. Navigate to the Login or Signup page
3. Click the "Continue with Google" button
4. Sign in with your Google account
5. You should be redirected to the customer dashboard

## Production Deployment

### Vercel Environment Variables

Add these environment variables in your Vercel project settings:

```
GOOGLE_CLIENT_ID=your_client_id_here
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

### Update Google Cloud Console

1. Go to **APIs & Services** > **Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add your production Vercel domain to **Authorized JavaScript origins**
4. Add your production Vercel domain to **Authorized redirect URIs**

### Publish OAuth Consent Screen

When ready for production:

1. Go to **APIs & Services** > **OAuth consent screen**
2. Click **Publish App**
3. Confirm to make the app available to all users

## Troubleshooting

### "Invalid Google token" error

- Verify `GOOGLE_CLIENT_ID` matches the Client ID from Google Cloud Console
- Ensure the Client ID is correct (no extra spaces or characters)
- Check that the frontend is using the same Client ID as the backend

### Google button not appearing

- Check browser console for JavaScript errors
- Verify `VITE_GOOGLE_CLIENT_ID` is set correctly
- Ensure the Google script is loaded (check Network tab)

### CORS errors

- Verify your frontend origin is listed in Google Cloud Console's authorized origins
- Check that the backend CORS configuration allows your frontend origin

### "Email not verified" error

- Google accounts must have verified email addresses
- In development, ensure test users are added to the OAuth consent screen

## Security Notes

- Never expose the Google Client Secret in frontend code
- The Client ID is public and safe to use in frontend
- Backend verifies tokens using the Client ID (no secret needed)
- Google-created accounts are always assigned the `CUSTOMER` role
- Existing email accounts are automatically linked when using Google auth
