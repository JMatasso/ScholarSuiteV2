import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createActivityEvent, notifyLinkedParents } from "@/lib/activity-events";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const data = await req.json();
    const role = (session.user as { role: string }).role;

    // Verify ownership: students can only update their own tasks
    const existingTask = await db.task.findUnique({ where: { id } });
    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    if (role === "STUDENT" && existingTask.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (role === "PARENT") {
      // Parents can only update tasks belonging to their linked students
      const link = await db.parentStudent.findFirst({
        where: { parentId: session.user.id, studentId: existingTask.userId },
      });
      if (!link) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    // Parents can only set parentAcknowledged
    if (role === "PARENT" && typeof data.parentAcknowledged === "boolean") {
      updateData.parentAcknowledged = data.parentAcknowledged;
    }

    // Students and admins can update more fields
    if (role === "ADMIN" || role === "STUDENT") {
      if (data.status) updateData.status = data.status;
      if (data.priority) updateData.priority = data.priority;
      if (data.dueDate !== undefined)
        updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
      if (typeof data.notifyParent === "boolean")
        updateData.notifyParent = data.notifyParent;
      if (typeof data.parentAcknowledged === "boolean")
        updateData.parentAcknowledged = data.parentAcknowledged;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      );
    }

    const task = await db.task.update({
      where: { id },
      data: updateData,
    });

    // Fire activity event when task is completed
    if (updateData.status === "DONE" && task.userId) {
      createActivityEvent({
        studentId: task.userId,
        type: "TASK_COMPLETED",
        title: `Task completed: ${task.title}`,
        description: `"${task.title}" has been marked as done.`,
        metadata: { taskId: task.id },
      })
      notifyLinkedParents({
        studentId: task.userId,
        title: "Task Completed",
        message: `Your student completed the task "${task.title}".`,
        link: "/parent/tasks",
        type: "TASK_COMPLETED",
      })
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (
      !session?.user ||
      (session.user as { role: string }).role !== "ADMIN"
    ) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await db.task.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
