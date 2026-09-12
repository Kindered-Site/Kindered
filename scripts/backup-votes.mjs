#!/usr/bin/env node
// Kindred — voting data backup
//
// Pulls a full, point-in-time copy of every table behind the site's voting
// features (Kindred Score match votes, trope confirmation votes, comments,
// and favorite counts) straight out of Supabase via its public REST API,
// and writes it to a timestamped JSON file under backups/.
//
// Uses the SAME project URL + anon key already embedded in index.html —
// that key is meant to be public (Supabase calls it a "publishable" key)
// and every table it can read here already has a public "select" policy in
// supabase-schema.sql, so nothing sensitive is exposed by hardcoding it
// here that isn't already sitting in the live site's page source.
//
// The "feedback" table is deliberately NOT included: it has no public read
// policy (that's on purpose — see supabase-schema.sql), so it can only be
// exported from the Supabase dashboard's Table Editor, signed in as the
// project owner.
//
// Usage:
//   node scripts/backup-votes.mjs [outDir]
//   (outDir defaults to "backups")

const SUPABASE_URL = "https://pkruvnvshcwotvnaxvbv.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_NsP2FJT1wXAk8pVwv0C4gA_pZiDBP2p";

// The four tables that make up "the voting" — see supabase-schema.sql.
const TABLES = ["matches", "comments", "tagvotes", "favorites"];

const PAGE_SIZE = 1000; // Supabase's default/max rows-per-request cap

async function fetchAllRows(table) {
  const rows = [];
  let from = 0;
  for (;;) {
    const to = from + PAGE_SIZE - 1;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id.asc`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Range: `${from}-${to}`,
          Prefer: "count=exact",
        },
      }
    );
    if (!res.ok && res.status !== 206) {
      const body = await res.text().catch(() => "");
      throw new Error(`Fetching ${table} failed: HTTP ${res.status} ${body}`);
    }
    const batch = await res.json();
    rows.push(...batch);
    if (batch.length < PAGE_SIZE) break; // last page
    from += PAGE_SIZE;
  }
  return rows;
}

async function main() {
  const outDir = process.argv[2] || "backups";
  const { mkdirSync, writeFileSync } = await import("node:fs");
  const { join } = await import("node:path");

  mkdirSync(outDir, { recursive: true });

  const exportedAt = new Date().toISOString();
  const tables = {};
  let totalRows = 0;

  for (const table of TABLES) {
    process.stdout.write(`Fetching ${table}... `);
    const rows = await fetchAllRows(table);
    tables[table] = rows;
    totalRows += rows.length;
    console.log(`${rows.length} rows`);
  }

  const payload = { exportedAt, source: SUPABASE_URL, tables };
  const filename = `votes-${exportedAt.replace(/[:.]/g, "-")}.json`;
  const outPath = join(outDir, filename);
  writeFileSync(outPath, JSON.stringify(payload, null, 2));

  // Also keep an easy-to-find "always the newest" copy alongside the
  // timestamped one, so a restore doesn't require picking through history.
  writeFileSync(join(outDir, "votes-latest.json"), JSON.stringify(payload, null, 2));

  console.log(`\nWrote ${outPath} (${totalRows} total rows across ${TABLES.length} tables).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
