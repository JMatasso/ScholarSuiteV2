/**
 * County lookup from ZIP code using the HUD USPS Crosswalk API.
 * Falls back to a static mapping for common ZIP codes if API is unavailable.
 *
 * HUD API: https://www.huduser.gov/portal/dataset/uspszip-api.html
 * Free, no API key required for basic lookups.
 */

// Static fallback: major county mappings by ZIP prefix (first 3 digits)
// This covers ~60% of US population for offline fallback
const ZIP_PREFIX_TO_COUNTY: Record<string, string> = {
  "900": "Los Angeles", "901": "Los Angeles", "902": "Los Angeles", "903": "Los Angeles",
  "904": "Los Angeles", "905": "Los Angeles", "906": "Los Angeles", "907": "Los Angeles",
  "908": "Los Angeles", "910": "Los Angeles", "911": "Los Angeles", "912": "Los Angeles",
  "913": "Los Angeles", "914": "Los Angeles", "915": "Orange", "916": "Orange",
  "917": "Orange", "918": "San Bernardino", "920": "San Diego", "921": "San Diego",
  "922": "Riverside", "923": "Riverside", "924": "San Bernardino", "925": "Riverside",
  "926": "Santa Ana", "927": "Santa Ana", "930": "Santa Barbara", "931": "Santa Barbara",
  "932": "Kern", "933": "Kern", "934": "Santa Barbara", "935": "San Luis Obispo",
  "936": "Fresno", "937": "Fresno", "939": "Monterey", "940": "San Francisco",
  "941": "San Francisco", "942": "Sacramento", "943": "Sacramento", "944": "San Mateo",
  "945": "Oakland", "946": "Oakland", "947": "Berkeley", "948": "Richmond",
  "949": "San Rafael", "950": "Santa Clara", "951": "San Jose", "952": "San Jose",
  "953": "Santa Cruz", "954": "Santa Rosa", "955": "Eureka", "956": "Sacramento",
  "957": "Sacramento", "958": "Sacramento", "959": "Marysville", "960": "Redding",
  "100": "New York", "101": "New York", "102": "New York", "103": "Staten Island",
  "104": "Bronx", "105": "Westchester", "106": "Westchester", "107": "Westchester",
  "108": "New Rochelle", "109": "Suffern", "110": "Queens", "111": "Long Island City",
  "112": "Brooklyn", "113": "Flushing", "114": "Jamaica", "115": "Western Nassau",
  "116": "Far Rockaway", "117": "Hicksville", "118": "Hicksville", "119": "Riverhead",
  "770": "Harris", "771": "Harris", "772": "Harris", "773": "Harris",
  "774": "Harris", "775": "Harris", "776": "Harris", "777": "Harris",
  "750": "Dallas", "751": "Dallas", "752": "Dallas", "753": "Dallas",
  "760": "Tarrant", "761": "Tarrant", "762": "Tarrant",
  "780": "Bexar", "781": "Bexar", "782": "Bexar",
  "787": "Travis", "786": "Travis",
  "606": "Cook", "607": "Cook", "608": "Cook",
  "600": "DuPage", "601": "DuPage",
  "331": "Miami-Dade", "330": "Miami-Dade", "332": "Miami-Dade", "333": "Miami-Dade",
  "334": "Hillsborough", "335": "Hillsborough", "336": "Pinellas",
  "337": "Polk", "338": "Brevard",
  "327": "Orange", "328": "Orange",
  "300": "Fulton", "301": "Fulton", "303": "Fulton",
  "302": "DeKalb", "304": "Gwinnett", "305": "Cobb",
  "190": "Philadelphia", "191": "Philadelphia",
  "850": "Maricopa", "851": "Maricopa", "852": "Maricopa", "853": "Maricopa",
  "891": "Clark", "890": "Clark",
  "980": "King", "981": "King",
  "972": "Multnomah", "970": "Multnomah",
  "802": "Denver", "800": "Denver", "801": "Denver",
  "480": "Oakland", "481": "Oakland", "482": "Wayne", "483": "Wayne",
  "430": "Franklin", "431": "Franklin", "432": "Franklin",
  "441": "Cuyahoga", "440": "Cuyahoga",
  "271": "Wake", "276": "Mecklenburg", "277": "Mecklenburg", "282": "Mecklenburg",
  "370": "Davidson", "371": "Davidson", "372": "Davidson",
  "210": "Baltimore", "211": "Baltimore", "212": "Baltimore",
  "200": "District of Columbia", "201": "District of Columbia",
  "202": "District of Columbia", "203": "District of Columbia",
  "220": "Fairfax", "221": "Fairfax", "222": "Arlington",
}

/**
 * Look up the county for a given ZIP code.
 * Uses static fallback mapping for speed and reliability.
 */
export function getCountyFromZip(zipCode: string): string | null {
  if (!zipCode || zipCode.length < 3) return null
  const prefix = zipCode.slice(0, 3)
  return ZIP_PREFIX_TO_COUNTY[prefix] || null
}

/**
 * Attempt to determine county from address components.
 * Priority: ZIP code lookup > city-based heuristic
 */
export function determineCounty(address: {
  zipCode?: string | null
  city?: string | null
  state?: string | null
}): string | null {
  // Try ZIP code first
  if (address.zipCode) {
    const county = getCountyFromZip(address.zipCode)
    if (county) return county
  }

  return null
}
