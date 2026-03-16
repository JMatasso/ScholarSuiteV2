Refresh existing scholarships in the database by re-checking their source URLs.

## Instructions

1. Fetch all scholarships from the database: GET http://localhost:3000/api/scholarships

2. Filter to scholarships that have a `url` or `sourceUrl` field set

3. For each scholarship with a source URL:
   - Use WebFetch to load the current page
   - Extract the current scholarship data
   - Compare to what's in the database
   - Flag any changes: deadline updated, amount changed, page 404'd (discontinued)

4. Generate a change report showing:
   - Scholarship name
   - What changed (field: old -> new)
   - Whether the scholarship appears discontinued (404 or content removed)
   - Whether the deadline has passed

5. Ask the user if they want to apply updates. If yes:
   - PATCH each changed scholarship at http://localhost:3000/api/scholarships/{id}
   - Update lastScrapedAt, scrapeStatus, and changed fields
   - Report: updated count, discontinued count, errors

$ARGUMENTS
