# 🚀 Quick Setup Checklist - Web-Based OAuth

## ⚡ 3-Step Setup (5 minutes)

### Step 1: Add Environment Variables ⚠️ REQUIRED
Open your `.env` file and add:

```env
GOOGLE_CLIENT_SECRET=YOUR_CLIENT_SECRET_FROM_GOOGLE_CONSOLE
# For development:
GOOGLE_REDIRECT_URI=http://localhost:8080/auth/google/callback
# For production (update when deploying):
# GOOGLE_REDIRECT_URI=https://your-production-domain.com/auth/google/callback
```

**Get Client Secret:**
1. Visit: https://console.cloud.google.com/apis/credentials
2. Click your **Web application** OAuth 2.0 Client ID
3. Copy the **Client secret** value
4. Paste it in `.env`

---

### Step 2: Update Google Cloud Console ⚠️ REQUIRED
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click **Create Credentials** → **OAuth client ID**
3. Select **Application type:** `Web application`
4. Under **Authorized redirect URIs**, click **+ ADD URI**
5. Add these URIs:
   - `http://localhost:8080/auth/google/callback` (for development)
   - `https://your-production-domain.com/auth/google/callback` (for production)
6. **Authorized JavaScript origins** (optional): `http://localhost:8080`
7. Click **CREATE**
8. Copy the **Client ID** and **Client secret**

---

### Step 3: Restart Server ⚠️ REQUIRED
```bash
npm run dev
```

---

## ✅ Verification

### Test the endpoint:
```bash
curl -X POST http://localhost:8080/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "authorizationCode": "test_code",
    "redirectUri": "http://localhost:8080/auth/google/callback"
  }'
```

**Expected (before valid code):**
- Status: 401 Unauthorized
- Message: "Invalid authorization code" (this is good! means setup works)

**Success Indicators:**
✅ Server starts without errors
✅ No "GOOGLE_CLIENT_SECRET is required" error
✅ Endpoint accepts `authorizationCode` parameter

---

## 🎯 What's Working Now

- ✅ **New Flow:** Accepts `authorizationCode` + `redirectUri`
- ✅ **Legacy Flow:** Still accepts `idToken` (backward compatible)
- ✅ **Auto-Detection:** Backend chooses correct flow automatically
- ✅ **Validation:** Requires at least one auth method

---

## 📝 Next Steps

1. ✅ Backend code updated (DONE)
2. ⚠️ Add `GOOGLE_CLIENT_SECRET` to `.env` (YOU NEED TO DO THIS)
3. ⚠️ Add redirect URI in Google Console (YOU NEED TO DO THIS)
4. ✅ Frontend ready (DONE)
5. ⏳ Test end-to-end flow
6. ⏳ Deploy to production

---

## 🔗 Full Documentation

See complete guide: `.github/WEB_OAUTH_MIGRATION_GUIDE.md`

---

## 🆘 Having Issues?

### "GOOGLE_CLIENT_SECRET is required"
→ Add it to your `.env` file (see Step 1)

### "redirect_uri_mismatch"
→ Add redirect URI to Google Console (see Step 2)

### "Invalid authorization code"
→ This is expected before frontend testing! Setup is correct.

---

**⏱️ Setup Time:** 5 minutes  
**🔧 Required Changes:** 2 (env variable + Google Console)  
**💯 Backward Compatible:** Yes (idToken still works)
