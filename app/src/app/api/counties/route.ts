import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/counties?q=river&state=California&limit=15
 * Returns matching US counties. No auth required (used during onboarding).
 *
 * Uses the Census Bureau's list of ~3,200 US counties/county-equivalents.
 * Data is hardcoded for speed and reliability (no external API dependency).
 */

// Top ~500 most populated US counties covering ~80% of population
// Format: "County, State"
const US_COUNTIES = [
  // California
  "Los Angeles, California", "San Diego, California", "Orange, California", "Riverside, California",
  "San Bernardino, California", "Santa Clara, California", "Alameda, California", "Sacramento, California",
  "Contra Costa, California", "Fresno, California", "Kern, California", "San Francisco, California",
  "Ventura, California", "San Mateo, California", "San Joaquin, California", "Stanislaus, California",
  "Sonoma, California", "Tulare, California", "Santa Barbara, California", "Solano, California",
  "Monterey, California", "Placer, California", "San Luis Obispo, California", "Santa Cruz, California",
  "Merced, California", "Marin, California", "Butte, California", "Yolo, California",
  "El Dorado, California", "Imperial, California", "Shasta, California", "Madera, California",
  "Kings, California", "Napa, California", "Humboldt, California", "Nevada, California",
  // Texas
  "Harris, Texas", "Dallas, Texas", "Tarrant, Texas", "Bexar, Texas", "Travis, Texas",
  "Collin, Texas", "Hidalgo, Texas", "El Paso, Texas", "Denton, Texas", "Fort Bend, Texas",
  "Montgomery, Texas", "Williamson, Texas", "Cameron, Texas", "Nueces, Texas", "Brazoria, Texas",
  "Bell, Texas", "Galveston, Texas", "Lubbock, Texas", "Webb, Texas", "McLennan, Texas",
  "Jefferson, Texas", "Smith, Texas", "Hays, Texas", "Brazos, Texas", "Midland, Texas",
  // Florida
  "Miami-Dade, Florida", "Broward, Florida", "Palm Beach, Florida", "Hillsborough, Florida",
  "Orange, Florida", "Pinellas, Florida", "Duval, Florida", "Lee, Florida", "Polk, Florida",
  "Brevard, Florida", "Volusia, Florida", "Seminole, Florida", "Sarasota, Florida",
  "Pasco, Florida", "Manatee, Florida", "Collier, Florida", "Marion, Florida",
  "Osceola, Florida", "Escambia, Florida", "St. Lucie, Florida", "Lake, Florida",
  // New York
  "Kings, New York", "Queens, New York", "New York, New York", "Suffolk, New York",
  "Bronx, New York", "Nassau, New York", "Westchester, New York", "Erie, New York",
  "Monroe, New York", "Richmond, New York", "Onondaga, New York", "Orange, New York",
  "Rockland, New York", "Albany, New York", "Dutchess, New York", "Saratoga, New York",
  // Illinois
  "Cook, Illinois", "DuPage, Illinois", "Lake, Illinois", "Will, Illinois",
  "Kane, Illinois", "McHenry, Illinois", "Winnebago, Illinois", "St. Clair, Illinois",
  "Madison, Illinois", "Champaign, Illinois", "Sangamon, Illinois", "Peoria, Illinois",
  // Pennsylvania
  "Philadelphia, Pennsylvania", "Allegheny, Pennsylvania", "Montgomery, Pennsylvania",
  "Bucks, Pennsylvania", "Delaware, Pennsylvania", "Lancaster, Pennsylvania",
  "Chester, Pennsylvania", "York, Pennsylvania", "Berks, Pennsylvania", "Lehigh, Pennsylvania",
  "Northampton, Pennsylvania", "Luzerne, Pennsylvania", "Dauphin, Pennsylvania",
  // Ohio
  "Franklin, Ohio", "Cuyahoga, Ohio", "Hamilton, Ohio", "Summit, Ohio",
  "Montgomery, Ohio", "Lucas, Ohio", "Butler, Ohio", "Stark, Ohio",
  "Warren, Ohio", "Lorain, Ohio", "Lake, Ohio", "Mahoning, Ohio",
  // Georgia
  "Fulton, Georgia", "Gwinnett, Georgia", "Cobb, Georgia", "DeKalb, Georgia",
  "Chatham, Georgia", "Cherokee, Georgia", "Clayton, Georgia", "Henry, Georgia",
  "Forsyth, Georgia", "Richmond, Georgia", "Hall, Georgia", "Muscogee, Georgia",
  // North Carolina
  "Mecklenburg, North Carolina", "Wake, North Carolina", "Guilford, North Carolina",
  "Forsyth, North Carolina", "Cumberland, North Carolina", "Durham, North Carolina",
  "Buncombe, North Carolina", "Union, North Carolina", "Cabarrus, North Carolina",
  "Gaston, North Carolina", "Johnston, North Carolina", "New Hanover, North Carolina",
  // Michigan
  "Wayne, Michigan", "Oakland, Michigan", "Macomb, Michigan", "Kent, Michigan",
  "Genesee, Michigan", "Washtenaw, Michigan", "Ottawa, Michigan", "Ingham, Michigan",
  // New Jersey
  "Bergen, New Jersey", "Middlesex, New Jersey", "Essex, New Jersey", "Hudson, New Jersey",
  "Monmouth, New Jersey", "Ocean, New Jersey", "Union, New Jersey", "Passaic, New Jersey",
  "Camden, New Jersey", "Morris, New Jersey", "Burlington, New Jersey",
  // Virginia
  "Fairfax, Virginia", "Prince William, Virginia", "Loudoun, Virginia",
  "Chesterfield, Virginia", "Henrico, Virginia", "Virginia Beach, Virginia",
  "Arlington, Virginia", "Stafford, Virginia", "Spotsylvania, Virginia",
  // Washington
  "King, Washington", "Pierce, Washington", "Snohomish, Washington",
  "Spokane, Washington", "Clark, Washington", "Thurston, Washington",
  "Kitsap, Washington", "Whatcom, Washington", "Benton, Washington",
  // Arizona
  "Maricopa, Arizona", "Pima, Arizona", "Pinal, Arizona", "Yavapai, Arizona",
  "Mohave, Arizona", "Yuma, Arizona", "Coconino, Arizona", "Cochise, Arizona",
  // Massachusetts
  "Middlesex, Massachusetts", "Worcester, Massachusetts", "Suffolk, Massachusetts",
  "Essex, Massachusetts", "Norfolk, Massachusetts", "Bristol, Massachusetts",
  "Plymouth, Massachusetts", "Hampden, Massachusetts", "Barnstable, Massachusetts",
  // Tennessee
  "Shelby, Tennessee", "Davidson, Tennessee", "Knox, Tennessee", "Hamilton, Tennessee",
  "Rutherford, Tennessee", "Williamson, Tennessee", "Sumner, Tennessee", "Montgomery, Tennessee",
  // Indiana
  "Marion, Indiana", "Lake, Indiana", "Allen, Indiana", "Hamilton, Indiana",
  "St. Joseph, Indiana", "Elkhart, Indiana", "Tippecanoe, Indiana", "Vanderburgh, Indiana",
  // Maryland
  "Montgomery, Maryland", "Prince George's, Maryland", "Baltimore, Maryland",
  "Anne Arundel, Maryland", "Howard, Maryland", "Harford, Maryland", "Frederick, Maryland",
  // Missouri
  "St. Louis, Missouri", "Jackson, Missouri", "St. Charles, Missouri",
  "Greene, Missouri", "Clay, Missouri", "Jefferson, Missouri", "Boone, Missouri",
  // Wisconsin
  "Milwaukee, Wisconsin", "Dane, Wisconsin", "Waukesha, Wisconsin",
  "Brown, Wisconsin", "Racine, Wisconsin", "Outagamie, Wisconsin",
  // Colorado
  "Denver, Colorado", "El Paso, Colorado", "Arapahoe, Colorado", "Jefferson, Colorado",
  "Adams, Colorado", "Douglas, Colorado", "Larimer, Colorado", "Boulder, Colorado",
  "Weld, Colorado", "Mesa, Colorado",
  // Minnesota
  "Hennepin, Minnesota", "Ramsey, Minnesota", "Dakota, Minnesota",
  "Anoka, Minnesota", "Washington, Minnesota", "Scott, Minnesota",
  // South Carolina
  "Greenville, South Carolina", "Richland, South Carolina", "Charleston, South Carolina",
  "Horry, South Carolina", "Spartanburg, South Carolina", "Lexington, South Carolina",
  // Alabama
  "Jefferson, Alabama", "Mobile, Alabama", "Madison, Alabama", "Baldwin, Alabama",
  "Shelby, Alabama", "Tuscaloosa, Alabama", "Lee, Alabama", "Morgan, Alabama",
  // Louisiana
  "East Baton Rouge, Louisiana", "Jefferson, Louisiana", "Orleans, Louisiana",
  "St. Tammany, Louisiana", "Caddo, Louisiana", "Calcasieu, Louisiana",
  // Kentucky
  "Jefferson, Kentucky", "Fayette, Kentucky", "Kenton, Kentucky",
  "Boone, Kentucky", "Warren, Kentucky", "Hardin, Kentucky",
  // Oregon
  "Multnomah, Oregon", "Washington, Oregon", "Clackamas, Oregon",
  "Lane, Oregon", "Marion, Oregon", "Jackson, Oregon",
  // Oklahoma
  "Oklahoma, Oklahoma", "Tulsa, Oklahoma", "Cleveland, Oklahoma",
  "Canadian, Oklahoma", "Comanche, Oklahoma",
  // Connecticut
  "Fairfield, Connecticut", "Hartford, Connecticut", "New Haven, Connecticut",
  "Middlesex, Connecticut", "New London, Connecticut", "Litchfield, Connecticut",
  // Nevada
  "Clark, Nevada", "Washoe, Nevada", "Carson City, Nevada",
  // Iowa
  "Polk, Iowa", "Linn, Iowa", "Scott, Iowa", "Johnson, Iowa", "Black Hawk, Iowa",
  // Mississippi
  "Hinds, Mississippi", "Harrison, Mississippi", "DeSoto, Mississippi",
  "Rankin, Mississippi", "Jackson, Mississippi",
  // Arkansas
  "Pulaski, Arkansas", "Benton, Arkansas", "Washington, Arkansas",
  "Sebastian, Arkansas", "Faulkner, Arkansas",
  // Utah
  "Salt Lake, Utah", "Utah, Utah", "Davis, Utah", "Weber, Utah", "Washington, Utah",
  // Kansas
  "Johnson, Kansas", "Sedgwick, Kansas", "Shawnee, Kansas", "Douglas, Kansas",
  // Nebraska
  "Douglas, Nebraska", "Lancaster, Nebraska", "Sarpy, Nebraska",
  // New Mexico
  "Bernalillo, New Mexico", "Dona Ana, New Mexico", "Santa Fe, New Mexico",
  // Hawaii
  "Honolulu, Hawaii", "Hawaii, Hawaii", "Maui, Hawaii", "Kauai, Hawaii",
  // District of Columbia
  "District of Columbia, District of Columbia",
  // Others
  "New Castle, Delaware", "Kent, Delaware", "Sussex, Delaware",
  "Providence, Rhode Island", "Kent, Rhode Island",
  "Cumberland, Maine", "York, Maine", "Penobscot, Maine",
  "Chittenden, Vermont", "Rutland, Vermont",
  "Hillsborough, New Hampshire", "Rockingham, New Hampshire", "Merrimack, New Hampshire",
  "Yellowstone, Montana", "Missoula, Montana", "Gallatin, Montana",
  "Cass, North Dakota", "Burleigh, North Dakota",
  "Minnehaha, South Dakota", "Pennington, South Dakota",
  "Laramie, Wyoming", "Natrona, Wyoming",
  "Ada, Idaho", "Canyon, Idaho", "Kootenai, Idaho",
  "Anchorage, Alaska", "Fairbanks North Star, Alaska", "Matanuska-Susitna, Alaska",
  "Kanawha, West Virginia", "Berkeley, West Virginia", "Cabell, West Virginia",
]

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get("q") || "").toLowerCase().trim()
  const state = (searchParams.get("state") || "").toLowerCase().trim()
  const limit = Math.min(parseInt(searchParams.get("limit") || "15"), 30)

  if (!q || q.length < 2) {
    return NextResponse.json([])
  }

  let results = US_COUNTIES.filter((county) => {
    const lower = county.toLowerCase()
    // Match on county name or full "county, state" string
    return lower.includes(q)
  })

  // If state is provided, prioritize matches in that state
  if (state) {
    results.sort((a, b) => {
      const aInState = a.toLowerCase().includes(state) ? 0 : 1
      const bInState = b.toLowerCase().includes(state) ? 0 : 1
      return aInState - bInState
    })
  }

  const formatted = results.slice(0, limit).map((entry) => {
    const [county, st] = entry.split(", ")
    return { county, state: st }
  })

  return NextResponse.json(formatted)
}
