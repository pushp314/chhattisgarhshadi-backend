# ============================================
# PRODUCTION DEPLOYMENT CHECKLIST
# ============================================

## Before Deploying:

1. ✅ Create new Google OAuth credentials with production redirect URI
2. ✅ Update CORS_ORIGIN to your frontend domain
3. ✅ Update API_URL to your deployment URL
4. ✅ Set NODE_ENV=production
5. ✅ Configure AWS S3 (required for file uploads in production)
6. ✅ Set up MSG91 for SMS
7. ✅ Configure Razorpay webhook URL
8. ✅ Run migrations on production database

## Environment Variables to Add in Deployment Platform:

DATABASE_URL=your_neon_postgres_url
DIRECT_URL=your_neon_direct_url
JWT_ACCESS_SECRET=your_secret_here
JWT_REFRESH_SECRET=your_secret_here
GOOGLE_CLIENT_ID=your_production_client_id
GOOGLE_CLIENT_SECRET=your_production_secret
CORS_ORIGIN=https://your-frontend-domain.com
API_URL=https://your-backend-domain.com
NODE_ENV=production
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
MSG91_AUTH_KEY=your_key
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_email
FIREBASE_PRIVATE_KEY="your_private_key"

## Post-Deployment:

1. Test health endpoint: https://your-domain.com/api/v1/health
2. Update Google OAuth redirect URIs in console
3. Configure S3 CORS settings
4. Set up monitoring/logging
5. Test authentication flow end-to-end
