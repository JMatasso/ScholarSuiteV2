/**
 * Parse a CSV string into an array of objects.
 * The first row is treated as headers.
 */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split("\n")
  const headers = lines[0].split(",").map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim())
    return headers.reduce(
      (obj, header, i) => ({ ...obj, [header]: values[i] }),
      {} as Record<string, string>
    )
  })
}
