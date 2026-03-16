import { NextRequest, NextResponse } from "next/server"
import { withRole } from "@/lib/api-middleware"

export const POST = withRole("ADMIN", async (_session, request: NextRequest) => {
  const body = await request.json()
  const { state, search } = body

  if (!state) {
    return NextResponse.json({ error: "State is required" }, { status: 400 })
  }

  let url = `https://educationdata.urban.org/api/v1/schools/ccd/directory/2022/?state_name=${encodeURIComponent(state)}`
  if (search) {
    url += `&school_name=${encodeURIComponent(search)}`
  }

  const response = await fetch(url)

  if (!response.ok) {
    return NextResponse.json(
      { error: "Failed to fetch from NCES API" },
      { status: 502 }
    )
  }

  const data = await response.json()
  const results = (data.results || []).map((s: Record<string, unknown>) => ({
    ncesId: String(s.ncessch),
    name: s.school_name || "",
    address: s.street_mailing || "",
    city: s.city_mailing || "",
    state: s.state_name || "",
    zipCode: s.zip_mailing || "",
  }))

  return NextResponse.json(results)
})
