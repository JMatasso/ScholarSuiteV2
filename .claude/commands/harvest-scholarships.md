Find scholarship URLs from aggregator websites based on user criteria.

## Instructions

The user will provide criteria like state, amount range, category, major, target count, etc. Your job is to:

1. Generate 10-20+ search queries targeting scholarship aggregator sites:
   - fastweb.com scholarships
   - scholarships.com
   - scholarships360.org
   - bold.org scholarships
   - accessscholarships.com
   - collegeboard.org (BigFuture) scholarships
   - scholarshipamerica.org
   - State-specific education department scholarship pages
   - University financial aid external scholarship lists
   - Note: goingmerry.com is defunct (redirects to Earnest) — skip it

2. For each search query, use WebSearch to find relevant pages

3. For each result page that looks like a scholarship listing or directory:
   - Use WebFetch to load the page
   - Extract individual scholarship URLs from the page
   - Record: scholarship_name (if visible), url, source_site, category

4. **Paginate** — if a source has multiple pages of results (e.g., Bold.org page 2, 3, etc.), keep fetching subsequent pages until you run out or hit the target count

5. **Default exclusions** — ALWAYS skip these unless the user explicitly asks to include them:
   - No-essay sweepstakes/giveaways (e.g., Bold.org "Be Bold" No-Essay, Niche $25K no-essay, Sallie Mae monthly, ScholarshipOwl, CollegeVine, Cappex/Appily easy money)
   - Essay contests that are primarily writing competitions (e.g., Profile in Courage, Fountainhead, Americanism Essay)
   - Video/media contests (e.g., Stossel Video Contest, Project Yellow Light, Courageous Persuaders, Doodle for Google, #ScienceSaves Video, Comics Are LIT)
   - Social media giveaways (TikTok scholarships, Instagram giveaways, YouTube scholarships, diploma frame giveaways)
   - Sweepstakes-style drawings with no application (e.g., BigFuture monthly $500 drawings, SoFi monthly giveaway)

   **DO include** legitimate application-based scholarships that happen to require an essay as part of a full application — the exclusion is for standalone essay/video *contests* and random-draw sweepstakes only.

6. **Target count** — if the user specifies a target (e.g., "target 1000"), keep broadening searches (by state, major, demographic, category) and paginating until you reach it or exhaust sources. Default target: as many as one pass yields (~100-150).

7. Deduplicate URLs (same scholarship appearing on multiple aggregators = keep only one entry)

8. Save results to a CSV file at `app/data/harvested-urls-{YYYY-MM-DD}.csv` with columns:
   url, name_hint, source_site, category, date_found

9. Report summary: total URLs found, by source site, by category

## User Criteria
$ARGUMENTS
