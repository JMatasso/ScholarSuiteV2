"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useImageUpload } from "@/hooks/use-image-upload"
import { ImagePlus, X, Upload, Trash2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ImageUploadProps {
  /** Current image URL (for showing existing images) */
  currentImage?: string | null
  /** Called with the File object when user selects/drops an image */
  onFileSelect?: (file: File) => void
  /** Called when user removes the image */
  onRemove?: () => void
  /** Whether an upload is in progress */
  uploading?: boolean
  /** Label text */
  label?: string
  /** Subtitle text */
  subtitle?: string
  /** Accepted file types */
  accept?: string
  /** Custom height class */
  heightClass?: string
  /** Additional className */
  className?: string
}

export function ImageUpload({
  currentImage,
  onFileSelect,
  onRemove,
  uploading = false,
  label = "Image Upload",
  subtitle = "Supported formats: JPG, PNG, GIF",
  accept = "image/*",
  heightClass = "h-64",
  className,
}: ImageUploadProps) {
  const {
    previewUrl,
    fileName,
    fileInputRef,
    handleThumbnailClick,
    handleFileChange: baseHandleFileChange,
    handleRemove: baseHandleRemove,
  } = useImageUpload()

  const [isDragging, setIsDragging] = useState(false)

  // The displayed image: preview (newly selected) takes priority over current (existing)
  const displayImage = previewUrl || currentImage

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      baseHandleFileChange(event)
      const file = event.target.files?.[0]
      if (file) {
        onFileSelect?.(file)
      }
    },
    [baseHandleFileChange, onFileSelect],
  )

  const handleRemove = useCallback(() => {
    baseHandleRemove()
    onRemove?.()
  }, [baseHandleRemove, onRemove])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)

      const file = e.dataTransfer.files?.[0]
      if (file && file.type.startsWith("image/")) {
        const fakeEvent = {
          target: {
            files: [file],
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        handleFileChange(fakeEvent)
      }
    },
    [handleFileChange],
  )

  return (
    <div className={cn("w-full space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <Input
        type="file"
        accept={accept}
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
      />

      {!displayImage ? (
        <div
          onClick={handleThumbnailClick}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted",
            isDragging && "border-[#2563EB]/50 bg-[#2563EB]/5",
            heightClass,
          )}
        >
          {uploading ? (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          ) : (
            <>
              <div className="rounded-full bg-background p-3 shadow-sm">
                <ImagePlus className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Click to select</p>
                <p className="text-xs text-muted-foreground">
                  or drag and drop file here
                </p>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="relative">
          <div className={cn("group relative overflow-hidden rounded-lg border", heightClass)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayImage}
              alt="Preview"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-white" />
              ) : (
                <>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={handleThumbnailClick}
                    className="h-9 w-9 p-0"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={handleRemove}
                    className="h-9 w-9 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
          {fileName && (
            <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="truncate">{fileName}</span>
              <button
                onClick={handleRemove}
                className="ml-auto rounded-full p-1 hover:bg-muted"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
