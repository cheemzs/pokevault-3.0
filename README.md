# PokeVault — Vercel + Supabase Setup Guide

A complete, step-by-step guide for absolute beginners. Follow every section in order.

---

## What you need before starting

- A free [GitHub](https://github.com) account
- A free [Supabase](https://supabase.com) account
- A free [Vercel](https://vercel.com) account (sign up with your GitHub account — it links automatically)
- [Git](https://git-scm.com/downloads) installed on your computer

---

## Step 1 — Set up Supabase (your database)

### 1a. Create a new Supabase project

1. Go to [supabase.com](https://supabase.com) → click **Start your project** → **New project**
2. Choose a name: `pokevault`
3. Set a strong database password (save it somewhere — you won't need it often but keep it safe)
4. Region: **Southeast Asia (Singapore)** — closest to you
5. Click **Create new project** and wait about 2 minutes for it to finish

### 1b. Run the database setup SQL

1. In your Supabase dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Open the file `supabase_setup.sql` from this project folder
4. Select all the text, copy it, and paste it into the SQL Editor
5. Click **Run** (the green button)
6. You should see **"Success. No rows returned"** — this is correct

### 1c. Collect your Supabase credentials

You need **2 values** from Supabase. Find them here:

**Supabase Dashboard → your project → Project Settings (gear icon) → API**

| What you need | Where to find it | Looks like |
|---|---|---|
| `SUPABASE_URL` | "Project URL" | `https://abcdefgh.supabase.co` |
| `SUPABASE_ANON_KEY` | "anon / public" key | A long string starting with `eyJ...` |

Copy both values and paste them into a temporary text file — you'll use them in Steps 2 and 3.

### 1d. Configure Supabase Auth (email login)

1. In your Supabase dashboard → **Authentication** → **Providers**
2. Make sure **Email** is enabled (it is by default)
3. Still in Authentication → **URL Configuration**
4. Set **Site URL** to your Vercel URL. If you don't know it yet, come back to this step after Step 3 — use `https://your-project-name.vercel.app`
5. Under **Redirect URLs**, add: `https://your-project-name.vercel.app/**`

---

## Step 2 — Edit your code with your credentials

You must paste your Supabase credentials into **two files** before deploying.

### File 1: `public/login.html`

Open `public/login.html` in a text editor. Find these two lines near the bottom:

```js
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace the placeholder strings with your actual values:

```js
const SUPABASE_URL = 'https://abcdefgh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGci...your_actual_key...';
```

### File 2: `public/js/app.js`

Open `public/js/app.js`. Find these same two lines near the top:

```js
const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

Replace them the same way.

> **Note:** The Supabase anon key is safe to include in frontend code — it's designed to be public. It only grants access to data permitted by your Row Level Security rules, which are already set up so each user can only see their own cards.

---

## Step 3 — Push to GitHub

### 3a. Create a new GitHub repository

1. Go to [github.com](https://github.com) → click **+** (top right) → **New repository**
2. Name it `pokevault`
3. Leave it **Public** (required for Vercel free tier) or Private if you have GitHub Pro
4. **Do NOT** tick "Add a README" — you already have one
5. Click **Create repository**

### 3b. Push your local files to GitHub

Open a terminal (Command Prompt on Windows, Terminal on Mac) and navigate to your project folder:

```bash
cd path/to/your/pokevault-folder
```

Then run these commands one at a time:

```bash
git init
git add .
git commit -m "Initial deploy"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/pokevault.git
git push -u origin main
```

Replace `YOUR_GITHUB_USERNAME` with your actual GitHub username.

---

## Step 4 — Deploy on Vercel

### 4a. Import your project

1. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
2. Click **Import** next to your `pokevault` repository
3. Vercel will detect the project settings automatically — leave everything as default
4. **Do not click Deploy yet** — you must add environment variables first

### 4b. Add environment variables

Still on the Vercel import screen, scroll down to **Environment Variables** and add these:

| Variable Name | Value |
|---|---|
| `POKEPRICE_KEY` | `pokeprice_pro_81d514f798098e04853ba615aa3200469b49e10e787d981d` |

That's the only variable Vercel needs — it's the API key for the serverless proxy. Your Supabase credentials are already in the frontend code from Step 2.

### 4c. Deploy

Click **Deploy**. Vercel will build and deploy your app. This takes about 60–90 seconds.

When it finishes, you'll see a green **"Congratulations!"** screen with your live URL, which will look like: `https://pokevault-abc123.vercel.app`

---

## Step 5 — Final Supabase URL update

Now that you have your live Vercel URL:

1. Go back to Supabase → **Authentication** → **URL Configuration**
2. Set **Site URL** to your exact Vercel URL: `https://pokevault-abc123.vercel.app`
3. Under **Redirect URLs**, add: `https://pokevault-abc123.vercel.app/**`
4. Click **Save**

---

## Step 6 — Test everything

Visit your Vercel URL and run through this checklist:

- [ ] Login page loads at `/login`
- [ ] You can register a new account with an email and password
- [ ] You are redirected to the main collection page after registering
- [ ] You can log in and out
- [ ] "Add card" form opens and you can add a card
- [ ] "↻ Refresh prices" button fetches prices (requires valid PokePrice API key)
- [ ] Stats page loads at `/stats`

---

## How future deployments work

Every time you push a change to GitHub, Vercel **automatically re-deploys** your app. You never need to log into Vercel again for regular updates.

```bash
# Make your changes, then:
git add .
git commit -m "Describe your change"
git push
```

Vercel picks it up automatically within ~30 seconds.

---

## Project structure reference

```
pokevault/
├── api/
│   └── pokeprice.js        ← Vercel serverless function (keeps API key secret)
├── public/
│   ├── css/
│   │   └── style.css       ← All styles (3 themes: dark, light, lucario)
│   ├── js/
│   │   └── app.js          ← All frontend logic (auth, cards, prices, charts)
│   ├── index.html          ← Main collection page
│   ├── login.html          ← Login / register page
│   ├── stats.html          ← Portfolio analytics page
│   └── pfp.jpeg            ← Logo
├── vercel.json             ← Routing config
├── supabase_setup.sql      ← Run once in Supabase SQL Editor
└── README.md               ← This file
```

---

## Environment variables reference

| Variable | Set in | Purpose |
|---|---|---|
| `POKEPRICE_KEY` | Vercel dashboard | PokePrice Pro API key — kept secret server-side |
| `SUPABASE_URL` | `app.js` and `login.html` | Supabase project URL — safe in frontend |
| `SUPABASE_ANON_KEY` | `app.js` and `login.html` | Supabase anon key — safe in frontend (protected by RLS) |

---

## Troubleshooting

**"Failed to load cards" / blank collection page**
→ Check that your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `app.js` are correct and you've run the SQL setup.

**Login redirects back to login immediately**
→ Go to Supabase → Authentication → URL Configuration and make sure your Vercel URL is set as the Site URL.

**"Price API is not configured"**
→ Go to Vercel → your project → Settings → Environment Variables and confirm `POKEPRICE_KEY` is set.

**Vercel build fails**
→ Check that `vercel.json` is in the root of your project folder (not inside a subfolder).
