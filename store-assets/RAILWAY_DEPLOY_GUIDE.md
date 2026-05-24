# AutoCareX — Railway & Vercel Deployment Guide

This guide walks you through deploying the AutoCareX backend to Railway (with PostgreSQL and Redis) and the admin panel to Vercel.

---

## Part 1: Deploy the Backend to Railway

### Step 1: Push Your Code to GitHub

Railway deploys from a GitHub repository. If you haven't done this yet:

```bash
# From the AutoCareX root directory
git init
git add .
git commit -m "Initial commit"
gh repo create autocareX --private --push
# Or: git remote add origin https://github.com/YOUR_USERNAME/autocareX.git && git push -u origin main
```

### Step 2: Create a New Railway Project

1. Go to https://railway.app and sign in (or sign up — free tier available)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorise Railway to access your GitHub account if prompted
5. Select your **AutoCareX** repository
6. When asked for the root directory, set it to: **`/backend`**
7. Railway detects the `railway.json` and `Procfile` automatically — click **Deploy**

### Step 3: Add the PostgreSQL Plugin

1. Inside your Railway project, click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
2. Railway automatically provisions a PostgreSQL instance and injects `DATABASE_URL` into your backend service's environment
3. The backend's `src/config/database.js` is already configured to use `DATABASE_URL` when present — no code changes needed

### Step 4: Add the Redis Plugin

1. Inside your Railway project, click **"+ New"** → **"Database"** → **"Add Redis"**
2. Railway automatically provisions a Redis instance and injects `REDIS_URL` into your backend service's environment
3. The backend's `src/config/redis.js` already uses `REDIS_URL` when present — no code changes needed

### Step 5: Set All Environment Variables

1. In your Railway project, click on the **backend service**
2. Go to the **Variables** tab
3. Click **"Raw Editor"** and paste the contents of `backend/.env.production`
4. Replace every placeholder value with your real credentials:

| Variable | Where to get it |
|---|---|
| `JWT_SECRET` | Run: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"` |
| `JWT_REFRESH_SECRET` | Same command, run again for a different value |
| `TWILIO_ACCOUNT_SID` | https://console.twilio.com |
| `TWILIO_AUTH_TOKEN` | https://console.twilio.com |
| `TWILIO_PHONE_NUMBER` | Twilio console → Phone Numbers |
| `RAZORPAY_KEY_ID` | https://dashboard.razorpay.com → API Keys (use Live keys) |
| `RAZORPAY_KEY_SECRET` | Same as above |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Webhooks → create a webhook → copy secret |
| `FIREBASE_*` | Firebase Console → Project Settings → Service Accounts → Generate private key |
| `AWS_ACCESS_KEY_ID` | AWS IAM Console → Create user with S3 access |
| `AWS_SECRET_ACCESS_KEY` | Same as above |
| `S3_BUCKET` | Create S3 bucket named `autocareX-prod-uploads` in `ap-south-1` |
| `ADMIN_DEFAULT_PASSWORD` | Choose a strong password for the default admin account |

Note: `DATABASE_URL` and `REDIS_URL` are injected automatically by Railway — do not fill those in manually.

### Step 6: Run Database Migrations

After the first successful deploy:

1. In Railway → your backend service → **"Shell"** tab (or use the Railway CLI)
2. Run:
```bash
node src/database/migrate.js
```

Or via Railway CLI:
```bash
railway run node src/database/migrate.js
```

### Step 7: Get Your Backend URL

1. In Railway → your backend service → **Settings** tab
2. Under **Networking** → **Public Domain**, click **"Generate Domain"**
3. Your backend will be live at something like:
   `https://backend-production-xxxx.up.railway.app`
4. Test the health endpoint: `https://backend-production-xxxx.up.railway.app/api/v1/health`

Note this URL — you will need it for the next step.

---

## Part 2: Deploy the Admin Panel to Vercel

### Step 1: Update the API URL

Open `admin/.env.production` and `admin/vercel.json`, and replace the placeholder URL with your actual Railway backend URL:

```
VITE_API_URL=https://backend-production-xxxx.up.railway.app/api/v1
```

Also update the `env.VITE_API_URL` field inside `admin/vercel.json`.

Commit and push the change:
```bash
git add admin/.env.production admin/vercel.json
git commit -m "Set production API URL"
git push
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign in (or sign up — free tier available)
2. Click **"Add New"** → **"Project"**
3. Import your GitHub repository
4. When asked for the **Root Directory**, set it to: **`admin`**
5. Framework preset: **Vite** (should be auto-detected)
6. Build command: `npm run build`
7. Output directory: `dist`
8. Click **"Deploy"**

### Step 3: Set Environment Variables in Vercel

1. In your Vercel project → **Settings** → **Environment Variables**
2. Add each variable from `admin/.env.production`:
   - `VITE_API_URL` = your Railway backend URL + `/api/v1`
   - `VITE_APP_NAME` = `AutoCareX Admin`
   - `VITE_RAZORPAY_KEY_ID` = your Razorpay live key ID

3. Trigger a redeploy: **Deployments** → latest deployment → **Redeploy**

### Step 4: Set Up a Custom Domain (Optional)

1. In Vercel → **Settings** → **Domains**
2. Add `admin.autocareX.in`
3. Add the CNAME DNS record at your domain registrar pointing to `cname.vercel-dns.com`
4. Vercel provisions an SSL certificate automatically

---

## Part 3: Configure Webhooks After Deployment

### Razorpay Webhook
1. Razorpay Dashboard → Settings → Webhooks → Add New Webhook
2. URL: `https://backend-production-xxxx.up.railway.app/api/v1/payments/webhook`
3. Events: `payment.captured`, `payment.failed`, `refund.processed`
4. Copy the webhook secret and set it as `RAZORPAY_WEBHOOK_SECRET` in Railway

### Twilio Status Callbacks
1. Twilio Console → Phone Numbers → your number → Messaging
2. Webhook URL for incoming: `https://backend-production-xxxx.up.railway.app/api/v1/sms/incoming`

---

## Deployment Checklist

- [ ] Backend deployed and health check passes (`/api/v1/health` returns 200)
- [ ] PostgreSQL plugin added — `DATABASE_URL` auto-set
- [ ] Redis plugin added — `REDIS_URL` auto-set
- [ ] All environment variables filled with real (live) values
- [ ] Database migrations executed successfully
- [ ] Admin panel deployed to Vercel
- [ ] `VITE_API_URL` in Vercel matches the Railway backend URL
- [ ] Razorpay webhook configured and verified
- [ ] Firebase push notifications tested on a real device
- [ ] Admin default password changed immediately after first login
- [ ] Custom domains configured (if applicable)
- [ ] SSL certificates active on all domains

---

## Monitoring & Logs

**Railway logs:**
```bash
railway logs --tail
```
Or view in the Railway dashboard → your service → **Logs** tab.

**Vercel logs:**
Vercel Dashboard → your project → **Functions** tab → view function logs.

**Uptime monitoring:** Consider adding Railway's URL to a free uptime monitor such as UptimeRobot (https://uptimerobot.com) targeting the `/api/v1/health` endpoint. Set alerts to your email or Slack.

---

## Cost Estimates (as of 2025)

| Service | Free Tier | Typical Production Cost |
|---|---|---|
| Railway (backend) | $5 credit/month | ~$10–20/month |
| Railway PostgreSQL | Included in project | ~$5–10/month |
| Railway Redis | Included in project | ~$5/month |
| Vercel (admin panel) | Free (Hobby) | Free or $20/month (Pro) |
| AWS S3 (storage) | 5 GB free | ~$1–5/month |
| **Total estimate** | | **~$20–55/month** |

For early-stage production, Railway's Starter plan at $5/month credit covers most needs. Upgrade as traffic grows.
