"use client"

import { FileText, X, Loader2 } from "@/lib/icons"
import { cn } from "@/lib/utils"

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?|$)/i.test(url)
}

export function AttachmentPreview({
  attachment,
  onRemove,
}: {
  attachment: { url: string; name: string; type: string }
  onRemove: () => void
}) {
  const isImage = attachment.type.startsWith("image/") || isImageUrl(attachment.url)

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
      {isImage ? (
        <img src={attachment.url} alt={attachment.name} className="h-8 w-8 rounded object-cover" />
      ) : (
        <FileText className="h-5 w-5 text-muted-foreground" />
      )}
      <span className="text-xs font-medium truncate max-w-[160px]">{attachment.name}</span>
      <button
        onClick={onRemove}
        className="ml-auto flex h-5 w-5 items-center justify-center rounded-full hover:bg-muted text-muted-foreground hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function UploadingIndicator() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      <span className="text-xs text-muted-foreground">Uploading...</span>
    </div>
  )
}

export function MessageAttachmentDisplay({
  imageUrl,
  isOwn,
}: {
  imageUrl: string
  isOwn: boolean
}) {
  const isImage = isImageUrl(imageUrl)

  if (isImage) {
    return (
      <a href={imageUrl} target="_blank" rel="noopener noreferrer" className="block mt-1">
        <img
          src={imageUrl}
          alt="Attachment"
          className="max-w-[240px] max-h-[180px] rounded-lg object-cover"
        />
      </a>
    )
  }

  return (
    <a
      href={imageUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium",
        isOwn
          ? "bg-white/10 hover:bg-white/20"
          : "bg-background hover:bg-background/80"
      )}
    >
      <FileText className="h-4 w-4" />
      View attachment
    </a>
  )
}
