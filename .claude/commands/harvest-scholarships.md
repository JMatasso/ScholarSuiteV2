Find scholarship URLs from aggregator websites based on user criteria.

## Instructions

The user will provide criteria like state, amount range, category, major, etc. Your job is to:

1. Generate 10-20 search queries targeting scholarship aggregator sites:
   - fastweb.com scholarships
   - scholarships.com
   - bold.org scholarships
   - goingmerry.com
   - collegeboard.org scholarships
   - State-specific education department scholarship pages
   - University financial aid external scholarship lists

2. For each search query, use WebSearch to find relevant pages

3. For each result page that looks like a scholarship listing or directory:
   - Use WebFetch to load the page
   - Extract individual scholarship URLs from the page
   - Record: scholarship_name (if visible), url, source_site, category

4. Deduplicate URLs

5. Save results to a CSV file at `app/data/harvested-urls-{YYYY-MM-DD}.csv` with columns:
   url, name_hint, source_site, category, date_found

6. Report summary: total URLs found, by source site, by category

## User Criteria
$ARGUMENTS
