/**
 * Parse a CSV string into an array of objects.
 * Handles quoted fields, commas inside quotes, newlines inside quotes,
 * and escaped double-quotes ("").
 */
export function parseCSV(text: string): Record<string, string>[] {
  const rows = parseCSVRows(text)
  if (rows.length < 2) return []

  const headers = rows[0].map((h) => h.trim())
  return rows.slice(1).map((values) =>
    headers.reduce(
      (obj, header, i) => ({ ...obj, [header]: (values[i] || "").trim() }),
      {} as Record<string, string>
    )
  )
}

/**
 * Low-level CSV row parser that correctly handles:
 * - Quoted fields with commas
 * - Newlines inside quoted fields
 * - Escaped quotes (doubled "")
 */
function parseCSVRows(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const ch = text[i]

    if (inQuotes) {
      if (ch === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          // Escaped quote
          field += '"'
          i += 2
        } else {
          // End of quoted field
          inQuotes = false
          i++
        }
      } else {
        field += ch
        i++
      }
    } else {
      if (ch === '"') {
        inQuotes = true
        i++
      } else if (ch === ',') {
        row.push(field)
        field = ""
        i++
      } else if (ch === '\r') {
        // Handle \r\n or standalone \r
        row.push(field)
        field = ""
        if (row.some((v) => v.length > 0)) rows.push(row)
        row = []
        i++
        if (i < text.length && text[i] === '\n') i++
      } else if (ch === '\n') {
        row.push(field)
        field = ""
        if (row.some((v) => v.length > 0)) rows.push(row)
        row = []
        i++
      } else {
        field += ch
        i++
      }
    }
  }

  // Last field/row
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    if (row.some((v) => v.length > 0)) rows.push(row)
  }

  return rows
}
