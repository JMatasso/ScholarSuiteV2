# Scholarship Scraper Guide

This guide explains how to use ScholarSuite's scholarship scraping tools to build and maintain your scholarship database.

---

## Quick Start

### Prerequisites
- Clone the repo and have Claude Code installed
- The dev server should be running (`npm run dev` in the `app/` folder) for import/refresh commands
- For the admin portal scraper page, your Railway deployment needs the `CHAT_AI_MODEL` or Anthropic API key env var set

### Step 1: Harvest URLs
Open Claude Code in the project directory and run:

```
/harvest-scholarships California first-generation STEM scholarships $1000-$50000
```

This will:
- Search Fastweb, Scholarships.com, Bold.org, and other aggregator sites
- Collect individual scholarship URLs from listing pages
- Deduplicate and save to `app/data/harvested-urls-YYYY-MM-DD.csv`
- Take 20-40 minutes depending on how many results it finds

**Pro tip:** Run it multiple times with different criteria to build a comprehensive list:
```
/harvest-scholarships national scholarships for women in STEM
/harvest-scholarships Texas scholarships 2026
/harvest-scholarships minority scholarships engineering computer science
/harvest-scholarships first-generation low-income college scholarships
/harvest-scholarships scholarships for high school seniors 2026
```

### Step 2: Import to Database
Make sure your dev server is running (`npm run dev`), then:

```
/import-scholarships
```

This will:
- Read the most recent `harvested-urls-*.csv` from `app/data/`
- Fetch each URL and use AI to extract scholarship details (name, amount, deadline, eligibility, etc.)
- Check for duplicates against your existing database
- Save extracted data to `app/data/extracted-scholarships-YYYY-MM-DD.csv`
- Ask if you want to import — say yes to add them to your database

To process a specific file:
```
/import-scholarships app/data/harvested-urls-2026-03-16.csv
```

### Step 3: Keep Data Current
Periodically (monthly or quarterly), run:

```
/refresh-scholarships
```

This will:
- Pull all scholarships from your database that have source URLs
- Re-visit each source page
- Flag changes (new deadline, updated amount, discontinued scholarships)
- Ask if you want to apply the updates

---

## Admin Portal Scraper

For one-off imports or monitoring, use the admin portal at:
**`/admin/scholarships/scraper`**

### Extract Tab
1. Paste one or more scholarship URLs (one per line) into the text area
2. Click "Extract All"
3. Wait for AI to process each URL
4. Review the extracted data in the results table
5. Click "Add to Database" per row (or "Add All" for bulk)
6. Duplicates are automatically detected and flagged

### Refresh Tab
- View all scholarships that have a source URL tracked
- See when each was last scraped and its current status
- Click "Refresh" on individual scholarships to re-check
- Click "Refresh All Stale" to batch-process outdated entries
- Review field-level changes (old value → new value) and click "Apply Changes"

### Status Badges
| Badge | Meaning |
|-------|---------|
| **CURRENT** (green) | Scholarship data is up to date |
| **NEEDS_REVIEW** (amber) | Changes detected — review before applying |
| **EXPIRED** (rose) | Deadline has passed |
| **ERROR** (red) | Source URL returned an error (404, timeout, etc.) |

---

## Scholarship Data Fields

When scraping, the AI extracts these fields:

| Field | Description | Example |
|-------|-------------|---------|
| Name | Scholarship name | "Coca-Cola Scholars Program" |
| Provider | Organization offering it | "Coca-Cola Scholars Foundation" |
| Amount | Dollar amount | 20000 |
| Amount Max | Upper range (if variable) | 50000 |
| Deadline | Application deadline | "2026-10-31" |
| Description | Full description text | "Awards for community leaders..." |
| URL | Application/info page URL | "https://..." |
| Min GPA | Minimum GPA requirement | 3.0 |
| States | Eligible states | ["California", "Texas"] or [] for national |
| Fields of Study | Eligible majors | ["Engineering", "STEM"] |
| Ethnicities | If targeted | ["Hispanic", "African American"] |
| First-Gen Required | Boolean | true/false |
| Pell Required | Boolean | true/false |
| Financial Need | Boolean | true/false |
| Min SAT / Min ACT | Test score minimums | 1200 / 25 |

---

## Tips for Maximum Yield

1. **Be specific with criteria** — "California STEM first-generation $5000+" generates better queries than just "scholarships"
2. **Run multiple passes** with different angles:
   - By state (your students' home states)
   - By demographic (first-gen, minority, women)
   - By field of study (STEM, business, healthcare, arts)
   - By amount range (small $500-$5K, medium $5K-$25K, large $25K+)
3. **Review before importing** — AI extraction isn't perfect. Spot-check amounts and deadlines
4. **Set application year** — Tag scholarships with the current application year (e.g., "2025-2026") so you can filter by year later
5. **Refresh quarterly** — Run `/refresh-scholarships` every 3 months to catch deadline changes and discontinued scholarships

---

## Working From Multiple Machines

These commands work from any machine with:
1. The repo cloned (`git pull` to get latest)
2. Claude Code installed
3. The dev server running (for import/refresh)

The harvested CSV files are saved in `app/data/` — they're gitignored by default, so if you want to share them between machines, either:
- Copy them manually
- Remove `app/data/` from `.gitignore` and commit them
- Use a shared drive/cloud storage

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Failed to fetch" on a URL | The site may be blocking automated requests. Try again later or skip that URL. |
| AI extraction returns wrong data | The page may be JavaScript-heavy. Try the direct URL in the admin portal's single-URL extractor for better results. |
| Duplicate detection too aggressive | It matches by name — if two different scholarships have similar names, it may flag false positives. Review and override. |
| Dev server not running | Import and refresh commands need `npm run dev` running locally. Start it first. |
| Rate limiting | The batch extractor processes URLs sequentially to avoid rate limits. If you hit limits, wait a few minutes. |
