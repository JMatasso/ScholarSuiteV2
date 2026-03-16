import { createUploadthing, type FileRouter } from "uploadthing/next"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

const f = createUploadthing()

export const ourFileRouter = {
  profileImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      await db.user.update({
        where: { id: metadata.userId },
        data: { image: file.ufsUrl },
      })
      return { uploadedBy: metadata.userId, url: file.ufsUrl }
    }),

  documentUploader: f({
    pdf: { maxFileSize: "16MB" },
    image: { maxFileSize: "8MB" },
    "application/msword": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB" },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // Determine document type from filename
      const name = file.name.toLowerCase()
      let type: "TRANSCRIPT" | "LETTER" | "FINANCIAL" | "IDENTIFICATION" | "OTHER" = "OTHER"
      if (name.includes("transcript")) type = "TRANSCRIPT"
      else if (name.includes("letter") || name.includes("recommendation")) type = "LETTER"
      else if (name.includes("financial") || name.includes("fafsa")) type = "FINANCIAL"
      else if (name.includes("id") || name.includes("passport")) type = "IDENTIFICATION"

      await db.document.create({
        data: {
          userId: metadata.userId,
          name: file.name,
          type,
          fileUrl: file.ufsUrl,
          fileSize: file.size,
          mimeType: file.type,
        },
      })
      return { uploadedBy: metadata.userId }
    }),
  messageAttachment: f({
    image: { maxFileSize: "8MB" },
    pdf: { maxFileSize: "16MB" },
    "application/msword": { maxFileSize: "16MB" },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB" },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session?.user) throw new Error("Unauthorized")
      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.ufsUrl, name: file.name, size: file.size, type: file.type }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
