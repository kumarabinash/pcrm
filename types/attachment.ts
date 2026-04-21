export interface Attachment {
  id: string
  fileName: string
  mimeType: string
  fileSize: number
  url: string
  uploadedBy: string | null
  createdAt: string
}
