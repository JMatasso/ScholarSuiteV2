import * as XLSX from "xlsx"

interface IncomeSource {
  name: string
  type: string
  amount: number
  status: string
}

interface Semester {
  name: string
  tuition: number
  housing: number
  food: number
  transportation: number
  books: number
  personal: number
  other: number
  incomeSources: IncomeSource[]
}

interface ExportData {
  semesters: Semester[]
  totalScholarships: number
  studentName?: string
}

function getSemesterTotal(sem: Semester): number {
  return sem.tuition + sem.housing + sem.food + sem.transportation + sem.books + sem.personal + sem.other
}

function getSemesterAid(sem: Semester): number {
  return sem.incomeSources.reduce((a, s) => a + s.amount, 0)
}

export function exportBudgetToExcel({ semesters, totalScholarships, studentName }: ExportData) {
  const wb = XLSX.utils.book_new()

  // Sheet 1: Semester Breakdown
  const semesterRows = semesters.map((sem) => ({
    Semester: sem.name,
    Tuition: sem.tuition,
    Housing: sem.housing,
    Food: sem.food,
    "Books & Supplies": sem.books,
    Transportation: sem.transportation,
    Personal: sem.personal,
    Other: sem.other,
    "Total Cost": getSemesterTotal(sem),
    "Total Aid": getSemesterAid(sem),
    "Net Cost": getSemesterTotal(sem) - getSemesterAid(sem),
  }))

  // Add totals row
  const totalCost = semesters.reduce((a, s) => a + getSemesterTotal(s), 0)
  const totalAid = semesters.reduce((a, s) => a + getSemesterAid(s), 0)
  semesterRows.push({
    Semester: "TOTAL",
    Tuition: semesters.reduce((a, s) => a + s.tuition, 0),
    Housing: semesters.reduce((a, s) => a + s.housing, 0),
    Food: semesters.reduce((a, s) => a + s.food, 0),
    "Books & Supplies": semesters.reduce((a, s) => a + s.books, 0),
    Transportation: semesters.reduce((a, s) => a + s.transportation, 0),
    Personal: semesters.reduce((a, s) => a + s.personal, 0),
    Other: semesters.reduce((a, s) => a + s.other, 0),
    "Total Cost": totalCost,
    "Total Aid": totalAid,
    "Net Cost": totalCost - totalAid,
  })

  const ws1 = XLSX.utils.json_to_sheet(semesterRows)

  // Set column widths
  ws1["!cols"] = [
    { wch: 20 }, // Semester
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 14 },
    { wch: 14 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ]

  // Format currency columns
  const currencyCols = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  const rowCount = semesterRows.length + 1 // +1 for header
  for (const col of currencyCols) {
    for (let row = 1; row < rowCount; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
      if (ws1[cellRef]) {
        ws1[cellRef].z = "$#,##0"
      }
    }
  }

  XLSX.utils.book_append_sheet(wb, ws1, "Semester Breakdown")

  // Sheet 2: Income Sources
  const incomeRows: Array<Record<string, string | number>> = []
  for (const sem of semesters) {
    for (const source of sem.incomeSources) {
      incomeRows.push({
        Semester: sem.name,
        "Source Name": source.name,
        Type: source.type,
        Amount: source.amount,
        Status: source.status,
      })
    }
  }

  if (incomeRows.length > 0) {
    const ws2 = XLSX.utils.json_to_sheet(incomeRows)
    ws2["!cols"] = [
      { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 },
    ]
    // Format amount column
    for (let row = 1; row <= incomeRows.length; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: 3 })
      if (ws2[cellRef]) ws2[cellRef].z = "$#,##0"
    }
    XLSX.utils.book_append_sheet(wb, ws2, "Income Sources")
  }

  // Sheet 3: Summary
  const summaryData = [
    { Metric: "Total Estimated Cost", Value: totalCost },
    { Metric: "Total Budget Aid", Value: totalAid },
    { Metric: "Scholarships Won", Value: totalScholarships },
    { Metric: "Remaining Gap", Value: Math.max(totalCost - totalAid - totalScholarships, 0) },
    { Metric: "Number of Semesters", Value: semesters.length },
  ]
  const ws3 = XLSX.utils.json_to_sheet(summaryData)
  ws3["!cols"] = [{ wch: 25 }, { wch: 15 }]
  // Format currency cells (rows 0-3)
  for (let row = 1; row <= 4; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row, c: 1 })
    if (ws3[cellRef]) ws3[cellRef].z = "$#,##0"
  }
  XLSX.utils.book_append_sheet(wb, ws3, "Summary")

  // Generate filename
  const date = new Date().toISOString().slice(0, 10)
  const name = studentName?.replace(/[^a-zA-Z0-9]/g, "_") || "Student"
  const filename = `ScholarSuite_Budget_${name}_${date}.xlsx`

  XLSX.writeFile(wb, filename)
}
