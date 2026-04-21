'use client'

import { useRef, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Paperclip, Trash2, FileText } from 'lucide-react'
import { getUploadUrl, addAttachment } from '@/app/actions'
import { convertIfHeic } from '@/lib/convertHeic'
import type { Attachment } from '@/types/attachment'

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  attachments: Attachment[]
  currentUserId: string
  onAdd: (a: Attachment) => void
  onDelete: (attachmentId: string) => void
  onViewAttachment: (a: Attachment) => void
}

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  return `${Math.round(bytes / 1024)} KB`
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

const AttachmentsSheet = ({
  open,
  onOpenChange,
  attachments,
  currentUserId,
  onAdd,
  onDelete,
  onViewAttachment,
}: Props) => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.files?.[0]
    if (!raw) return

    e.target.value = ''

    const file = await convertIfHeic(raw)

    if (file.size > MAX_FILE_SIZE) {
      window.alert('File exceeds the 10 MB limit. Please choose a smaller file.')
      return
    }

    setUploading(true)
    try {
      const { uploadUrl, storageKey, publicUrl } = await getUploadUrl(file.name, file.type)

      const res = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      })
      if (!res.ok) throw new Error(`Upload failed (${res.status})`)

      const result = await addAttachment({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        storageKey,
      })

      const attachment: Attachment = {
        id: result.id,
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        url: publicUrl,
        uploadedBy: result.uploadedBy,
        createdAt: result.createdAt,
      }

      onAdd(attachment)
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[70vh] overflow-y-auto bg-card border-border/60">
        <SheetHeader className="pb-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-base font-bold text-foreground">
              Attachments{' '}
              {attachments.length > 0 && (
                <span className="text-muted-foreground font-normal">({attachments.length})</span>
              )}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Paperclip className="w-3.5 h-3.5" />
              {uploading ? 'Uploading...' : 'Add'}
            </Button>
          </div>
        </SheetHeader>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="mt-3 space-y-1" style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))' }}>
          {attachments.length === 0 && !uploading && (
            <p className="text-sm text-muted-foreground/60 text-center py-6">No attachments yet</p>
          )}

          {attachments.map((attachment) => {
            const isImage = attachment.mimeType.startsWith('image/')
            const canDelete = currentUserId === attachment.uploadedBy

            return (
              <div key={attachment.id} className="flex items-center gap-3 py-2">
                {isImage ? (
                  <button
                    onClick={() => { onOpenChange(false); onViewAttachment(attachment) }}
                    className="shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-border/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={attachment.url}
                      alt={attachment.fileName}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ) : (
                  <button
                    onClick={() => { onOpenChange(false); onViewAttachment(attachment) }}
                    className="flex items-center gap-2 flex-1 min-w-0 bg-muted/40 border border-border/30 rounded-xl px-3 py-2.5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <FileText className="w-5 h-5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{attachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)}</p>
                    </div>
                  </button>
                )}

                {isImage && (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground truncate">{attachment.fileName}</p>
                    <p className="text-xs text-muted-foreground/60">{formatFileSize(attachment.fileSize)}</p>
                  </div>
                )}

                {canDelete && (
                  <button
                    onClick={() => onDelete(attachment.id)}
                    className="shrink-0 p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-destructive"
                    aria-label={`Delete ${attachment.fileName}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </SheetContent>
    </Sheet>
  )
}

export default AttachmentsSheet
