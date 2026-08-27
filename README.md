# SpineSync Enterprise

Starter frontend for a mining-focused MSK, Functional Capacity Evaluation (FCE), Fitness-for-Work and Return-to-Work platform.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

## Push to GitHub

```bash
git init
git add .
git commit -m "Initial SpineSync Enterprise build"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/spinesync-enterprise.git
git push -u origin main
```

## Deploy to Vercel

1. Push this project to GitHub.
2. Sign in to Vercel.
3. Add New Project.
4. Import `spinesync-enterprise`.
5. Framework preset: Vite.
6. Build command: `npm run build`
7. Output directory: `dist`
8. Deploy.

## Current modules

- Dashboard
- Worker registry
- Assessments
- Job profiles
- Reports
- Settings

## Next build

The next step is Supabase:
- authentication
- worker database
- organisation / mine / site structure
- assessment records
- FCE test battery
- fitness decisions
- report generation
- role-based access
