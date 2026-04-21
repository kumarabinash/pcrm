import { S3Client, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Module-level singleton — created once, reused for every call (Issue 6)
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function generateUploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  })
  return getSignedUrl(r2Client, command, { expiresIn: 300 })
}

export async function deleteStorageObject(key: string): Promise<void> {
  await r2Client.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }))
}

export function getPublicUrl(key: string): string {
  // Non-null guard: fail loudly rather than return "undefined/<key>" (Issue 8)
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL
  if (!base) throw new Error('NEXT_PUBLIC_R2_PUBLIC_URL is not configured')
  return `${base}/${key}`
}
