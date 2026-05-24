# AutoCareX — India's #1 Auto Care Platform

A full-stack automotive service super app with:
- 📱 **Customer App** — Book car wash, engine service, tyre change, and more
- 🔧 **Franchise Partner App** — Manage jobs, earnings, and customers
- 🖥️ **Admin Panel** — Full operations dashboard

## Tech Stack
- **Backend**: Node.js + Express + PostgreSQL + Redis + Socket.io
- **Mobile**: Flutter (Android + iOS)
- **Admin**: React + MUI v5 + Vite
- **Infra**: Railway (backend) + Vercel (admin) + Docker (local)

## Local Development
```bash
# Start infrastructure
docker-compose -f docker-compose.local.yml up -d

# Backend
cd backend && npm install && npm run dev

# Admin Panel
cd admin && npm install && npm run dev

# Mobile Preview (browser)
cd mobile-preview && npm install && npm run dev
```

## Production Deployment
See `store-assets/RAILWAY_DEPLOY_GUIDE.md` for full deployment guide.
