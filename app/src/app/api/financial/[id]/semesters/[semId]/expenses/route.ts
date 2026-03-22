import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

/** POST — add a custom expense to a semester */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; semId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: planId, semId } = await params
    const role = (session.user as { role: string }).role

    const plan = await db.financialPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const data = await req.json()
    const { name, amount, applyToSemesterIds } = data as {
      name: string
      amount: number
      applyToSemesterIds?: string[]
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    // If applying to multiple semesters (recurring expense)
    if (applyToSemesterIds && applyToSemesterIds.length > 0) {
      const expenses = await db.customExpense.createMany({
        data: applyToSemesterIds.map((sid) => ({
          semesterId: sid,
          name: name.trim(),
          amount: amount || 0,
        })),
      })
      return NextResponse.json({ count: expenses.count }, { status: 201 })
    }

    const expense = await db.customExpense.create({
      data: {
        semesterId: semId,
        name: name.trim(),
        amount: amount || 0,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error("Error creating custom expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** PATCH — update a custom expense amount */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; semId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: planId } = await params
    const role = (session.user as { role: string }).role

    const plan = await db.financialPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { expenseId, amount, name } = await req.json()
    if (!expenseId) {
      return NextResponse.json({ error: "expenseId required" }, { status: 400 })
    }

    const updateData: Record<string, unknown> = {}
    if (typeof amount === "number") updateData.amount = amount
    if (typeof name === "string") updateData.name = name.trim()

    const expense = await db.customExpense.update({
      where: { id: expenseId },
      data: updateData,
    })

    return NextResponse.json(expense)
  } catch (error) {
    console.error("Error updating custom expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

/** DELETE — remove a custom expense */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; semId: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: planId } = await params
    const role = (session.user as { role: string }).role

    const plan = await db.financialPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }
    if (role === "STUDENT" && plan.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const expenseId = searchParams.get("expenseId")
    const expenseName = searchParams.get("name")

    if (expenseId) {
      await db.customExpense.delete({ where: { id: expenseId } })
    } else if (expenseName) {
      // Delete all custom expenses with this name across all semesters in this plan
      const semesterIds = await db.financialSemester.findMany({
        where: { planId },
        select: { id: true },
      })
      await db.customExpense.deleteMany({
        where: {
          semesterId: { in: semesterIds.map((s) => s.id) },
          name: expenseName,
        },
      })
    } else {
      return NextResponse.json({ error: "expenseId or name required" }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting custom expense:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
