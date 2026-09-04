# Kindred — going live

This folder is the whole site: one `index.html` (everything — markup, styles, and
logic — is in that single file on purpose, so there's nothing to build or
compile), a `supabase-schema.sql` file that sets up the database, and this
README. Follow the steps below in order — each one only takes a few minutes.

## 1. Create your accounts (free)

You'll need three:

1. **GitHub** — [github.com/signup](https://github.com/signup). This is where the
   code lives; Vercel deploys straight from it. Pick any username.
2. **Supabase** — [supabase.com](https://supabase.com) → "Start your project" →
   sign in with GitHub. This is the free database that replaces the
   Claude-artifact-only voting/favorites/comments backend. When it asks you to
   create a project, name it `kindred` (or anything), pick any region close to
   you, and set a database password — save that password somewhere, you likely
   won't need it again but it's annoying to lose.
3. **Vercel** — [vercel.com/signup](https://vercel.com/signup) → sign in with
   GitHub. This is the free host that actually serves the site to visitors and
   auto-redeploys every time the code changes.

You don't need a domain yet — Vercel gives you a free
`kindred-something.vercel.app` address to start with. Buying a real domain is
step 5, once the site's live and you know it's the one you want to keep.

## 2. Set up the database

1. In your new Supabase project, go to **SQL Editor** (left sidebar) → **New
   query**.
2. Open `supabase-schema.sql` in this folder, copy all of it, paste it into
   the editor, and click **Run**. This creates the four tables the site needs
   (matches, comments, tagvotes, favorites) and turns on realtime sync.
3. Go to **Project Settings** (gear icon) → **API**. You'll see a **Project
   URL** and an **anon / public** key — copy both.
4. Open `index.html` in this folder, find this block near the top of the
   `<script>` section (search for `YOUR_SUPABASE`):

   ```js
   var SUPABASE_URL = "YOUR_SUPABASE_PROJECT_URL";
   var SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
   ```

   Paste your Project URL and anon key in there (keep the quotes), save the
   file. That anon key is *meant* to be public/visible in the site's code —
   Supabase's security model controls access through the database rules in
   `supabase-schema.sql`, not by hiding this key.

## 3. Push the code to GitHub

If you're comfortable with GitHub Desktop or the command line, create a new
**public** repository named `kindred` on GitHub, then push this whole folder
to it. If you'd rather not touch git directly: create the empty repo on
GitHub's website, then use the **"uploading an existing file"** link on the
repo's page to drag in `index.html`, `supabase-schema.sql`, `README.md`, and
`.gitignore`.

(Once this is on GitHub, tell Claude the repo URL — from then on, updates
like "add these 10 new titles" or "tweak the color again" can be pushed
straight to GitHub from here, and Vercel will redeploy automatically. That's
the ongoing workflow you asked about earlier.)

## 4. Deploy on Vercel

1. In Vercel, click **Add New… → Project**.
2. Choose **Import** next to your `kindred` GitHub repo.
3. Leave every setting on its default (this is a static site — no framework,
   no build command, nothing to configure) and click **Deploy**.
4. In under a minute you'll get a live link like
   `https://kindred-xyz.vercel.app` — that's the real, public site.

## 5. Add your own domain (optional, whenever you're ready)

1. Buy a domain — Namecheap, Cloudflare Registrar, and Porkbun are all
   reasonable, roughly $10–15/year for a `.com`.
2. In Vercel, open the project → **Settings → Domains** → add your domain.
3. Vercel shows you 1–2 DNS records to add at your registrar. Add them there;
   it usually goes live within a few minutes to a couple of hours.

## 6. Amazon Associates (once the site's live with real traffic)

Apply at [affiliate-program.amazon.com](https://affiliate-program.amazon.com/)
using your live domain. Keep in mind the approval clock: you have 180 days
from applying to get 3 qualifying sales or the account closes (you can
reapply). Once approved, put your Associates tag into `index.html`:

```js
var AMAZON_ASSOCIATE_TAG = ""; // put your tag here, e.g. "kindred-20"
```

## What still runs locally, not from Supabase

Two things intentionally stay in each visitor's own browser (`localStorage`),
same as they did in the artifact — there's no login system, so there's
nothing to sync them to: your own **Favorites list**, and which way you
personally **voted** on a trope or match (so buttons remember your choice on
your device). The shared *counts* everyone sees (vote totals, "N readers
favorited this") come from Supabase and are visible to everyone.
