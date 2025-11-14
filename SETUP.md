# Setup Guide for Chhattisgarh Shadi Backend

## 🎯 Quick Start

### 1. Prerequisites Check
```bash
node --version  # Should be v18+
npm --version   # Should be v9+
psql --version  # Should be v14+
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
```

Edit `.env` and configure:

#### Minimum Required for Development
```env
NODE_ENV=development
PORT=8080
DATABASE_URL="postgresql://user:password@localhost:5432/chhattisgarh_shadi"
JWT_ACCESS_SECRET="your-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_CALLBACK_URL="http://localhost:8080/api/auth/google/callback"
CORS_ORIGIN="http://localhost:3000"
```

#### Optional Services (Add as needed)
- **AWS S3**: For file uploads
- **Firebase**: For push notifications
- **Razorpay**: For payments
- **MSG91**: For SMS/OTP

### 4. Database Setup
```bash
# Generate Prisma Client
npm run prisma:generate

# Create database and run migrations
npm run prisma:migrate

# (Optional) View database
npm run prisma:studio
```

### 5. Start Server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will start at: http://localhost:8080

## 🔧 Configuration Guide

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:8080/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

### AWS S3 Setup

1. Create AWS account
2. Create S3 bucket
3. Create IAM user with S3 permissions
4. Generate access keys
5. Add credentials to `.env`

### Razorpay Setup

1. Create Razorpay account
2. Get API keys from dashboard
3. Add to `.env`

### MSG91 Setup

1. Create MSG91 account
2. Get auth key
3. Add to `.env`

### Firebase Setup

1. Create Firebase project
2. Generate service account key (JSON)
3. Convert private key to base64
4. Add credentials to `.env`

## 📝 Database Migrations

### Create New Migration
```bash
npm run prisma:migrate
```

### Reset Database (WARNING: Deletes all data)
```bash
npx prisma migrate reset
```

### View Database
```bash
npm run prisma:studio
```

## 🧪 Testing

### Test API Endpoints

1. **Health Check**
   ```bash
   curl http://localhost:8080/health
   ```

2. **Google OAuth (Browser)**
   ```
   http://localhost:8080/api/auth/google
   ```

3. **With Authentication**
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8080/api/users/me
   ```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find and kill process
lsof -ti:8080 | xargs kill -9
```

### Database Connection Error
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check database exists

### Prisma Client Not Generated
```bash
npm run prisma:generate
```

### Module Not Found
```bash
rm -rf node_modules package-lock.json
npm install
```

## 📂 Directory Structure

```
src/
├── config/         # Configuration files
├── controllers/    # Request handlers
├── middleware/     # Express middleware
├── routes/        # API routes
├── services/      # Business logic
├── socket/        # Socket.io handlers
└── utils/         # Helper functions
```

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Set up production database
- [ ] Configure CORS for production URL
- [ ] Enable HTTPS
- [ ] Set up environment variables on hosting platform
- [ ] Configure AWS S3 bucket permissions
- [ ] Set up Razorpay webhooks
- [ ] Enable Firebase in production
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Test all integrations

## 📞 Support

If you encounter issues:
1. Check this guide
2. Review error logs in `logs/` directory
3. Check environment variables
4. Verify all services are configured

## 🎉 Success!

If you see this message when starting the server:
```
Server is running on http://localhost:8080
Database connected successfully
Socket.io server initialized successfully
```

You're all set! 🎊
