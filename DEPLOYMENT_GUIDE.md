# Deployment Guide - Render

## Quick Fix for Current Error

The deployment error you encountered was due to missing environment variables. I've fixed the code to make AWS, MSG91, and Razorpay **optional**. However, you still need to set the **required** environment variables in Render.

### 1. Set Environment Variables in Render

Go to your Render dashboard → Select your service → Environment tab → Add these variables:

> **⚠️ IMPORTANT: Do NOT set the PORT variable!**
> 
> Render automatically sets `PORT` (usually 10000). Your server is already configured to use `process.env.PORT`, so it will work automatically. Adding PORT manually may cause issues.

### 1. Database (REQUIRED)
```
DATABASE_URL=your-postgresql-connection-string
```
**Get this from:** Render's PostgreSQL service or external provider

### 2. JWT Secrets (REQUIRED)
```bash
# Generate strong secrets using:
openssl rand -base64 32

JWT_ACCESS_SECRET=<generated-secret-32-chars-min>
JWT_REFRESH_SECRET=<generated-secret-32-chars-min>
```

### 3. Google OAuth (REQUIRED)
```
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```
**Get from:** https://console.cloud.google.com/apis/credentials

### 4. CORS Configuration
```
CORS_ORIGIN=https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
```

## Optional Environment Variables

These are **NOT required** for the server to start. Add them only when you want to enable specific features:

### AWS S3 (for file uploads)
```
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_REGION=ap-south-1
```
**When not set:** File upload features will be disabled

### MSG91 (for SMS OTP)
```
MSG91_AUTH_KEY=your-msg91-auth-key
MSG91_SENDER_ID=CGSHAD
```
**When not set:** Phone OTP verification will be disabled

### Razorpay (for payments)
```
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```
**When not set:** Payment features will be disabled

### Firebase (for push notifications)
```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-service-account-email
```
**When not set:** Push notifications will be disabled

## Deployment Steps

### 1. Set Environment Variables in Render

1. Go to: https://dashboard.render.com/
2. Select your service
3. Click "Environment" in the left sidebar
4. Add each environment variable one by one
5. Click "Save Changes"

### 2. Trigger Redeploy

After adding the environment variables:
1. Go to "Manual Deploy" section
2. Click "Deploy latest commit"
3. Or push a new commit to trigger auto-deploy

### 3. Monitor Deployment

Check the logs for:
- ✅ `Database connected successfully`
- ✅ `Server is running on http://localhost:8080`
- ⚠️ Warning messages about disabled services (these are OK!)

Example expected logs:
```
✅ AWS S3 Client initialized successfully
✅ Razorpay client initialized successfully  
✅ MSG91 API client initialized successfully
⚠️  Firebase configuration is incomplete. Push notifications will not work.
✅ Database connected successfully
✅ Server is running on http://localhost:8080
```

## Production Checklist

Before going live:

- [ ] Set strong JWT secrets (min 32 characters)
- [ ] Configure proper CORS_ORIGIN (not `*`)
- [ ] Set DATABASE_URL with SSL enabled
- [ ] Enable AWS S3 for file uploads
- [ ] Enable MSG91 for OTP verification
- [ ] Enable Razorpay for payments
- [ ] Enable Firebase for push notifications
- [ ] Set NODE_ENV=production
- [ ] Test all critical user flows

## Troubleshooting

### Issue: "ZodError: Required" for environment variables

**Solution:** You forgot to add a required env var. Check the error message for which variable is missing and add it to Render's environment settings.

### Issue: "S3 storage is not configured"

**Expected behavior:** This means AWS credentials are not set. File uploads will not work until you add AWS credentials.

### Issue: "Payment service is not configured"

**Expected behavior:** This means Razorpay credentials are not set. Payment features will not work until you add Razorpay credentials.

### Issue: "SMS service not configured"

**Expected behavior:** This means MSG91 credentials are not set. Phone OTP will not work until you add MSG91 credentials.

## Support

If you encounter issues:
1. Check Render logs for specific error messages
2. Verify all REQUIRED env vars are set correctly
3. Ensure DATABASE_URL is accessible from Render
4. Check that Google OAuth credentials are valid

## Security Notes

- Never commit `.env` file to Git
- Use strong, random JWT secrets
- Enable SSL for PostgreSQL connection
- Rotate secrets regularly in production
- Use Render's environment variable encryption
