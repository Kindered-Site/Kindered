-- Kindred — Supabase schema
-- Run this once in your Supabase project's SQL Editor (Project -> SQL Editor -> New query),
-- after creating the project and before pasting your project URL/anon key into index.html.
--
-- Mirrors the four "collections" the site used inside the Claude artifact's
-- built-in database: matches (title-to-title vote counts), comments (on a
-- match), tagvotes (per-title-per-trope up/down votes), and favorites (a
-- shared "N readers favorited this" count per title). Column names match the
-- fields the app's JS already reads/writes — including a couple of
-- camelCase ones ("createdAt") kept exactly as-is so the site's code didn't
-- need to change, just the backend underneath it. Postgres lowercases
-- unquoted identifiers, so those are quoted below to preserve the casing.

create table if not exists matches (
  id text primary key,
  upvotes integer not null default 0,
  downvotes integer not null default 0,
  "createdAt" timestamptz not null default now()
);

create table if not exists comments (
  id bigint generated always as identity primary key,
  match_id text not null references matches(id) on delete cascade,
  text text not null,
  author text,
  "createdAt" timestamptz not null default now()
);

create table if not exists tagvotes (
  id text primary key, -- "<titleId>__<tagId>"
  up integer not null default 0,
  down integer not null default 0
);

create table if not exists favorites (
  id text primary key, -- titleId
  count integer not null default 0
);

-- Row Level Security: same open-by-design model the Claude artifact's "db"
-- capability used (anyone who can load the page can read and write these
-- four tables — there's no login system). If you add accounts later,
-- tighten these policies then. For now this just keeps the tables from
-- being locked to nobody by default, which is Supabase's out-of-the-box
-- behavior once RLS is enabled.

alter table matches enable row level security;
alter table comments enable row level security;
alter table tagvotes enable row level security;
alter table favorites enable row level security;

create policy "public read matches" on matches for select using (true);
create policy "public insert matches" on matches for insert with check (true);
create policy "public update matches" on matches for update using (true);

create policy "public read comments" on comments for select using (true);
create policy "public insert comments" on comments for insert with check (true);

create policy "public read tagvotes" on tagvotes for select using (true);
create policy "public insert tagvotes" on tagvotes for insert with check (true);
create policy "public update tagvotes" on tagvotes for update using (true);

create policy "public read favorites" on favorites for select using (true);
create policy "public insert favorites" on favorites for insert with check (true);
create policy "public update favorites" on favorites for update using (true);

-- Realtime: lets everyone's votes/comments/favorites show up live for
-- everyone else without refreshing, same as the artifact version did.
alter publication supabase_realtime add table matches, comments, tagvotes, favorites;
