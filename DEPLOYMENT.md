# Deployment Guide: Vercel + Postgres

This guide will help you deploy the Startup Prioritization Dashboard to Vercel with PostgreSQL database support for 20,000+ companies.

## Prerequisites

- [Vercel Account](https://vercel.com)
- [GitHub Account](https://github.com) (repository already created)
- Anthropic API Key
- CSV file with your 20,000 companies (optional - you can upload via UI)

## Step 1: Set Up Vercel Postgres Database

### 1.1 Create Vercel Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your GitHub repository: `Arconiccapital/v0-startup-prioritization-dashboard`
4. **DO NOT deploy yet** - we need to set up the database first

### 1.2 Create Postgres Database

1. In your Vercel project, go to the **"Storage"** tab
2. Click "Create Database"
3. Select **"Postgres"**
4. Choose a name (e.g., `startup-prioritization-db`)
5. Select region closest to your users
6. Click "Create"

### 1.3 Connect Database to Project

1. After database creation, click "Connect Project"
2. Select your project from the list
3. Vercel will automatically add environment variables:
   - `POSTGRES_URL`
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - `POSTGRES_USER`
   - `POSTGRES_HOST`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DATABASE`

## Step 2: Configure Environment Variables

### 2.1 Add Anthropic API Key

1. In your Vercel project, go to **"Settings"** → "Environment Variables"
2. Add the following variable:
   ```
   ANTHROPIC_API_KEY=sk-ant-YOUR_KEY_HERE
   ```
3. Select all environments (Production, Preview, Development)
4. Click "Save"

### 2.2 Verify Database Variables

Ensure these variables are present (auto-added by Vercel):
- ✅ `POSTGRES_URL`
- ✅ `POSTGRES_PRISMA_URL`
- ✅ `POSTGRES_URL_NON_POOLING`

## Step 3: Run Database Migration

### 3.1 Install Vercel CLI (if not already installed)

```bash
npm install -g vercel
```

### 3.2 Login to Vercel

```bash
vercel login
```

### 3.3 Link Project Locally

```bash
cd v0-startup-prioritization-dashboard
vercel link
```

Follow the prompts to link to your Vercel project.

### 3.4 Pull Environment Variables

```bash
vercel env pull .env.local
```

This downloads your production environment variables (including database URLs).

### 3.5 Generate Prisma Client

```bash
pnpm install
npx prisma generate
```

### 3.6 Run Migration

```bash
npx prisma db push
```

This creates the database tables based on your `prisma/schema.prisma`.

**Expected output:**
```
🚀 Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

## Step 4: Deploy to Vercel

### 4.1 Deploy

```bash
vercel --prod
```

Or push to your `main` branch - Vercel will auto-deploy.

### 4.2 Verify Deployment

1. Visit your deployment URL (e.g., `https://your-project.vercel.app`)
2. Check that the app loads without errors
3. The database is empty initially - you'll upload data next

## Step 5: Upload Your 20,000 Companies

### Option A: Via Web UI (Recommended)

1. Go to your deployed app
2. Navigate to the pipeline/upload page
3. Upload your CSV file (with proper column mapping)
4. The app will batch-insert 500 records at a time
5. For 20,000 companies, expect ~30-60 seconds upload time

### Option B: Via Prisma Seed Script (Advanced)

Create `prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import { parseCSVWithMapping } from '../lib/csv-parser'

const prisma = new PrismaClient()

async function main() {
  const csvText = fs.readFileSync('data/companies.csv', 'utf-8')
  const mapping = { /* your column mapping */ }

  const startups = parseCSVWithMapping(csvText, mapping)

  console.log(`Seeding ${startups.length} companies...`)

  for (let i = 0; i < startups.length; i += 500) {
    const batch = startups.slice(i, i + 500)
    await prisma.startup.createMany({
      data: batch,
      skipDuplicates: true,
    })
    console.log(`Inserted ${i + batch.length}/${startups.length}`)
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
```

Then run:
```bash
npx tsx prisma/seed.ts
```

## Step 6: Verify Everything Works

### 6.1 Test Database Connection

Visit: `https://your-app.vercel.app/api/startups?limit=10`

Should return JSON with your startups.

### 6.2 Test Investment Memo Generation

1. Click on any company
2. Click "Generate Investment Memo"
3. Should generate using GPT-4o-mini

## Performance Optimization Tips

### Caching Strategy

Add to `next.config.mjs`:

```javascript
export default {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}
```

### Database Indexes

The schema already includes these performance indexes:
- `@@index([rank])`
- `@@index([sector])`
- `@@index([pipelineStage])`
- `@@index([sector, rank])`
- `@@index([pipelineStage, rank])`

For 20k records, queries should be < 500ms.

## Monitoring & Debugging

### View Logs

```bash
vercel logs [deployment-url]
```

### Database Queries (Prisma Studio)

```bash
npx prisma studio
```

Opens a GUI to browse your database at `http://localhost:5555`.

### Check Build Logs

Go to Vercel Dashboard → Deployments → [Your Deployment] → View Function Logs

## Cost Estimates

- **Vercel Hobby Plan**: Free (includes 100GB bandwidth)
- **Vercel Postgres**: ~$20/month (includes 10GB storage, 1M rows, connection pooling)
- **Anthropic API (Claude Sonnet 4.5)**: ~$3 per 1M input tokens, ~$15 per 1M output tokens
  - Estimate: $5-20/month depending on memo generation usage

## Troubleshooting

### "Prisma Client is not generated"

```bash
npx prisma generate
```

### "Cannot connect to database"

Check environment variables:
```bash
vercel env ls
```

Ensure `POSTGRES_PRISMA_URL` is set.

### "Too many connections"

Vercel Postgres uses connection pooling automatically. If issues persist:
- Check your Prisma client initialization in `lib/prisma.ts`
- Ensure you're using the singleton pattern

### Upload Fails for Large CSV

- Increase Next.js body size limit in `next.config.mjs`
- Split CSV into smaller chunks (< 10k rows per file)

## Security Checklist

- ✅ Database credentials in environment variables (not committed to git)
- ✅ Anthropic API key in environment variables
- ✅ `.env*` files in `.gitignore`
- ✅ Prisma connection pooling enabled
- ✅ HTTPS enforced by Vercel

## Next Steps

1. **Optional: Add Authentication**
   - Implement NextAuth.js
   - Add `userId` column to track ownership
   - Gate access based on user roles

2. **Optional: Enable Real-time Updates**
   - Add WebSocket support
   - Implement collaborative editing

3. **Optional: Advanced Analytics**
   - Add dashboard for portfolio metrics
   - Implement custom scoring algorithms

## Support

- Vercel Docs: https://vercel.com/docs
- Prisma Docs: https://www.prisma.io/docs
- Project Issues: https://github.com/Arconiccapital/v0-startup-prioritization-dashboard/issues

---

**Deployment Time: ~20-30 minutes**

You're now ready to deploy your startup prioritization dashboard to production! 🚀
