/**
 * Converts a HEIC/HEIF File to JPEG before upload.
 * Non-HEIC files are returned unchanged.
 * Safe to call on every file — detection is fast and synchronous.
 */
export async function convertIfHeic(file: File): Promise<File> {
  const isHeic =
    file.type === 'image/heic' ||
    file.type === 'image/heif' ||
    /\.(heic|heif)$/i.test(file.name)

  if (!isHeic) return file

  const stem = file.name.replace(/\.(heic|heif)$/i, '')

  // iOS Safari often auto-converts HEIC to JPEG but keeps file.type = 'image/heic'.
  // Sniff the actual bytes to avoid passing a JPEG to heic2any (causes ERR_LIBHEIF).
  const magic = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const isActuallyJpeg = magic[0] === 0xFF && magic[1] === 0xD8 && magic[2] === 0xFF

  if (isActuallyJpeg) {
    return new File([file], `${stem}.jpg`, { type: 'image/jpeg' })
  }

  try {
    const { default: heic2any } = await import('heic2any')
    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.92 })
    // For burst/multi-frame HEIF, only the first frame is used
    const blob = Array.isArray(result) ? result[0] : result
    return new File([blob], `${stem}.jpg`, { type: 'image/jpeg' })
  } catch {
    throw new Error('This photo couldn\'t be converted. Try a different photo or export it as JPEG first.')
  }
}
