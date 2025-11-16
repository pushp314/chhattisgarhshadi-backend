# 🔒 Security & Performance Optimization Guide

## ✅ What Was Optimized

### **Security Improvements**
1. ✅ **NoSQL Injection Protection** - Added `express-mongo-sanitize`
2. ✅ **HTTP Parameter Pollution Prevention** - Added `hpp` middleware
3. ✅ **Request Size Limits** - Limited JSON/URL-encoded payloads to 10MB
4. ✅ **CORS Optimization** - Added preflight cache (24 hours)
5. ✅ **Helmet Security Headers** - Already configured with environment-specific settings
6. ✅ **Rate Limiting** - Already implemented in auth routes
7. ✅ **JWT Token Security** - Separate access/refresh tokens with secure secrets

### **Performance Improvements**
1. ✅ **Response Compression** - Optimized gzip compression (6 level, >1KB threshold)
2. ✅ **Database Indexes** - Already well-indexed (User, Profile, Match, Message tables)
3. ✅ **Connection Pooling** - Configured Prisma with connection limits
4. ✅ **Slow Query Logging** - Development mode logs queries >1 second
5. ✅ **Singleton Pattern** - Prisma client uses singleton to prevent connection leaks

---

## 🚨 Critical Production Checklist

### **Before Deploying to Production:**

#### 1. **Environment Variables**
```bash
# ❌ NEVER use these in production:
NODE_ENV=development
CORS_ORIGIN=*
JWT_ACCESS_SECRET="weak-secret"

# ✅ Use strong values:
NODE_ENV=production
CORS_ORIGIN=https://your-actual-domain.com
JWT_ACCESS_SECRET="<64-char random string>"
```

Generate strong secrets:
```bash
# Generate JWT secrets
openssl rand -base64 64

# Or in Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

#### 2. **CORS Configuration**
Update `.env` for production:
```env
# Development
CORS_ORIGIN=*

# Production (single domain)
CORS_ORIGIN=https://app.chhattisgarhshaadi.com

# Production (multiple domains)
CORS_ORIGIN=https://app.chhattisgarhshaadi.com,https://www.chhattisgarhshaadi.com
```

#### 3. **Database Security**
- ✅ Use connection pooling (already configured)
- ✅ Use environment-specific connection strings
- ✅ Enable SSL mode (`sslmode=require` already in DATABASE_URL)
- ⚠️ Rotate database credentials regularly

#### 4. **API Keys & Secrets**
Replace all placeholder values:
```env
# ❌ Remove placeholders:
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
MSG91_AUTH_KEY="your-msg91-auth-key"
RAZORPAY_WEBHOOK_SECRET="your-razorpay-webhook-secret"

# ✅ Use real production keys
```

#### 5. **Razorpay Payment Security**
```env
# Development (test mode)
RAZORPAY_KEY_ID="rzp_test_xxxxx"
RAZORPAY_KEY_SECRET="test_secret"

# Production (live mode)
RAZORPAY_KEY_ID="rzp_live_xxxxx"
RAZORPAY_KEY_SECRET="live_secret"
RAZORPAY_WEBHOOK_SECRET="<from Razorpay dashboard>"
```

**Setup Webhook:**
1. Go to Razorpay Dashboard → Webhooks
2. Add URL: `https://your-backend.com/api/v1/payments/webhook`
3. Copy webhook secret to `.env`

---

## 🚀 Performance Best Practices

### **1. Database Query Optimization**

**✅ Already Implemented:**
- Indexes on frequently queried fields (email, phone, googleId)
- Composite indexes for complex queries
- Soft delete indexes (deletedAt)

**Additional Tips:**
```javascript
// ❌ Bad - N+1 query problem
const users = await prisma.user.findMany();
for (const user of users) {
  const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
}

// ✅ Good - Use include
const users = await prisma.user.findMany({
  include: { profile: true }
});

// ✅ Good - Select only needed fields
const users = await prisma.user.findMany({
  select: { id: true, email: true, profile: { select: { firstName: true } } }
});
```

### **2. Caching Strategy** (Future Enhancement)

Consider adding Redis for:
- Session management
- OTP storage (instead of database)
- Frequently accessed data (subscription plans, etc.)

```bash
npm install redis ioredis
```

### **3. Image Optimization**

**✅ Already Implemented:**
- Sharp for image compression
- Resize to 1200x1200
- Generate 300x300 thumbnails
- S3 storage with presigned URLs

### **4. API Response Optimization**

**Current implementation:**
- Compression enabled for responses >1KB
- JSON with reasonable limits (10MB)

**Future improvements:**
```javascript
// Add pagination to all list endpoints
const matches = await prisma.match.findMany({
  take: 20,  // Limit results
  skip: (page - 1) * 20,  // Pagination
  orderBy: { createdAt: 'desc' }
});
```

---

## 🛡️ Security Monitoring

### **Logging Best Practices**

**✅ Already Configured:**
- Winston logger with file rotation
- Different log levels for dev/prod
- Sanitization warnings logged

**Monitor these logs:**
```bash
# Check for suspicious activity
tail -f logs/combined.log | grep "Sanitized request"
tail -f logs/combined.log | grep "Rate limit exceeded"
tail -f logs/combined.log | grep "Slow query"
```

### **Security Headers** (via Helmet)

**Already enabled in production:**
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security` (HTTPS only)

---

## 📊 Performance Monitoring

### **Database Performance**

**Slow query detection:**
```javascript
// Enabled in development mode
// Logs queries taking > 1 second
prisma.$on('query', (e) => {
  if (e.duration > 1000) {
    logger.warn(`Slow query detected (${e.duration}ms):`, e.query);
  }
});
```

**Monitor:**
- Query execution time
- Connection pool usage
- Database size growth

### **API Performance**

**Tools to add (optional):**
```bash
# APM (Application Performance Monitoring)
npm install newrelic
npm install @sentry/node  # Error tracking
```

---

## 🔐 Authentication Security

### **JWT Token Management**

**✅ Current Implementation:**
- Access token: 15 minutes (short-lived)
- Refresh token: 7 days
- Token revocation support
- IP-based tracking

**Security features:**
- Tokens stored in database with expiry
- Automatic cleanup of expired tokens
- IP address logging for suspicious activity

### **OAuth Security**

**✅ Google OAuth:**
- Email verification required
- Issuer validation
- Token audience validation
- HTTPS callback URLs

---

## 🚀 Deployment Optimization

### **Render.com Configuration**

```yaml
# render.yaml (already configured)
services:
  - type: web
    name: chhattisgarhshadi-backend
    env: node
    buildCommand: npm install && npx prisma generate
    startCommand: npm start
    healthCheckPath: /api/v1/health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: matrimony-db
          property: connectionString
```

### **Environment-Specific Settings**

**Development:**
```env
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*
```

**Production:**
```env
NODE_ENV=production
LOG_LEVEL=warn
CORS_ORIGIN=https://your-domain.com
```

---

## 📋 Security Audit Checklist

Before going live:

- [ ] All environment secrets are strong and unique
- [ ] CORS restricted to actual domain(s)
- [ ] HTTPS enabled (enforce in production)
- [ ] Database credentials rotated
- [ ] Razorpay using LIVE keys (not TEST)
- [ ] AWS S3 bucket has proper IAM permissions
- [ ] Rate limiting configured appropriately
- [ ] Logging enabled and monitored
- [ ] Error messages don't leak sensitive info
- [ ] Dependencies updated (`npm audit fix`)
- [ ] Backup strategy in place

---

## 🐛 Known Vulnerabilities

Check with:
```bash
npm audit

# Fix non-breaking changes
npm audit fix

# Fix all (may break things)
npm audit fix --force
```

**Current status:** 3 vulnerabilities detected
- Run `npm audit` to see details
- Most are from `xss-clean` (deprecated package)
- Consider removing `xss-clean` if not critical

---

## 📈 Performance Metrics to Track

1. **API Response Time**
   - Target: <200ms for most endpoints
   - Monitor: P95, P99 latency

2. **Database Query Performance**
   - Target: <100ms for simple queries
   - Monitor: Slow query logs

3. **Memory Usage**
   - Target: <512MB under normal load
   - Monitor: Node.js heap size

4. **Error Rate**
   - Target: <0.1% of requests
   - Monitor: 5xx responses

---

## 🔄 Regular Maintenance

**Weekly:**
- Review logs for suspicious activity
- Check error rates and slow queries

**Monthly:**
- Update dependencies (`npm update`)
- Rotate API keys (if policy requires)
- Review and optimize slow database queries

**Quarterly:**
- Full security audit
- Load testing
- Backup restoration test

---

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Prisma Performance Guide](https://www.prisma.io/docs/guides/performance-and-optimization)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
