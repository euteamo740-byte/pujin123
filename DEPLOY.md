# Pujin Store - Virtual SIM Marketplace

## ⚠️ SECURITY - Credential Management

**JANGAN PERNAH push credential ke GitHub!**

- ✅ Safe: `.env.example` (template)
- ✅ Safe: Code yang baca dari `process.env`
- ❌ **Jangan push:** `.env`, `twilio-config.js`, `nexmo-config.js`

---

## Deploy Instructions

### 1. Push to GitHub

```bash
cd ~/virtual-sim-web
git remote add origin https://github.com/PUJIN_USERNAME/pujin-store.git
git branch -M main
git push -u origin main
```

### 2. Setup Environment Variables di Railway

Setelah buat project Railway, **tambahkan environment variables:**

Di Railway dashboard → Variables tab:

```
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_API_KEY_SID=your_api_key_sid_here
TWILIO_API_KEY_SECRET=your_api_key_secret_here
TWILIO_PHONE_NUMBER=+62xxxxxxxxxx
WEBHOOK_URL=https://pujin-store-production.up.railway.app/api/webhooks/twilio/sms
PORT=3001
```

### 3. Deploy to Railway (Backend)

1. Go to https://railway.app
2. "New Project" → "Deploy from GitHub"
3. Select `pujin-store` repo
4. Railway auto-deploy backend
5. Set environment variables (step 2)
6. Dapat URL: `https://pujin-store-production.up.railway.app`

### 4. Deploy to Vercel (Frontend)

1. Go to https://vercel.com
2. "New Project" → Import `pujin-store`
3. Framework: "Other"
4. Deploy
5. Dapat URL: `https://pujin-store.vercel.app`

### 5. Update Frontend API URL

Setelah deploy, edit `dashboard.js`:
```javascript
const API_URL = 'https://pujin-store-production.up.railway.app/api';
```

Commit & push perubahan ini.

---

## Local Development

```bash
# Backend
cd backend && node server.js

# Frontend
cd ~/virtual-sim-web && python3 -m http.server 8000
```

## Admin Access
- URL: /admin-dashboard.html
- Username: admin
- Password: admin123
