Extract scholarship data from a CSV of URLs and optionally import to the database.

## Instructions

1. Read the most recent CSV file in `app/data/` that starts with `harvested-urls` (or the file specified by the user)

2. For each URL in the CSV:
   - Use WebFetch to load the page
   - Extract scholarship fields: name, provider, amount, deadline, description, eligibility requirements, application URL
   - Structure the data to match the Scholarship model fields

3. Check for duplicates against the existing database:
   - Fetch existing scholarships from the local dev server: GET http://localhost:3000/api/scholarships
   - Compare by name (case-insensitive)
   - Flag duplicates but still include them in the output

4. Save extracted data to `app/data/extracted-scholarships-{YYYY-MM-DD}.csv` with all scholarship fields

5. Ask the user if they want to import to the database. If yes:
   - For each non-duplicate, POST to http://localhost:3000/api/scholarships with the extracted data
   - Include sourceUrl, lastScrapedAt, applicationYear, scrapeStatus: "CURRENT"
   - Report: imported count, skipped duplicates, errors

$ARGUMENTS
